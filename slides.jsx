import { useState, useEffect, useRef, useCallback } from "react";
import JSZip from "jszip";
import { api } from "./api.js";

export const VOICE_OPTIONS = [
  { value: "m1", label: "صوت رجالي 1" },
  { value: "m2", label: "صوت رجالي 2" },
  { value: "f1", label: "صوت نسائي 1" },
  { value: "f2", label: "صوت نسائي 2" },
];
// Decks saved before the voice update used OpenAI voice names.
const LEGACY_VOICES = { onyx: "m1", ash: "m1", echo: "m2", nova: "f1", coral: "f1", shimmer: "f2" };
export function normalizeVoice(v) {
  if (VOICE_OPTIONS.some((o) => o.value === v)) return v;
  return LEGACY_VOICES[v] || "m1";
}

/* ---------------- PPTX parsing (client-side) ---------------- */

const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

function parseXml(text) {
  return new DOMParser().parseFromString(text, "application/xml");
}

function byLocalName(root, name) {
  return Array.from(root.getElementsByTagNameNS("*", name));
}

function resolvePath(baseDir, target) {
  if (target.startsWith("/")) return target.slice(1);
  const parts = (baseDir + "/" + target).split("/");
  const out = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

async function readRels(zip, relsPath, baseDir) {
  const file = zip.file(relsPath);
  if (!file) return [];
  const doc = parseXml(await file.async("text"));
  return byLocalName(doc, "Relationship").map((r) => ({
    id: r.getAttribute("Id"),
    type: r.getAttribute("Type") || "",
    target: resolvePath(baseDir, r.getAttribute("Target") || ""),
  }));
}

function paragraphText(p) {
  return byLocalName(p, "t")
    .map((t) => t.textContent)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function placeholderType(shape) {
  const ph = byLocalName(shape, "ph")[0];
  if (!ph) return null;
  return ph.getAttribute("type") || "body";
}

function extractSlide(doc) {
  let title = "";
  const bullets = [];
  const shapes = [...byLocalName(doc, "sp"), ...byLocalName(doc, "graphicFrame")];
  for (const shape of shapes) {
    const type = placeholderType(shape);
    if (type === "sldNum" || type === "dt" || type === "ftr") continue;
    const paras = byLocalName(shape, "p")
      .filter((p) => p.namespaceURI && p.namespaceURI.includes("drawingml"))
      .map(paragraphText)
      .filter(Boolean);
    if (!paras.length) continue;
    if ((type === "title" || type === "ctrTitle") && !title) {
      title = paras.join(" ");
    } else {
      bullets.push(...paras);
    }
  }
  if (!title && bullets.length) title = bullets.shift();
  return { title, bullets };
}

function extractNotes(doc) {
  const out = [];
  for (const shape of byLocalName(doc, "sp")) {
    const type = placeholderType(shape);
    if (type !== "body") continue;
    byLocalName(shape, "p")
      .filter((p) => p.namespaceURI && p.namespaceURI.includes("drawingml"))
      .map(paragraphText)
      .filter(Boolean)
      .forEach((t) => out.push(t));
  }
  return out.join("\n");
}

export function defaultNarration(slide) {
  const parts = [slide.title, ...(slide.bullets || [])].filter(Boolean);
  return parts.map((p) => p.replace(/[.،؛:]+$/, "")).join(". ") + (parts.length ? "." : "");
}

export async function parsePptx(file) {
  if (!/\.pptx$/i.test(file.name)) {
    throw new Error("الرجاء اختيار ملف PowerPoint بصيغة ‎.pptx (يمكن حفظ ملفات ‎.ppt القديمة بصيغة ‎.pptx من PowerPoint).");
  }
  const zip = await JSZip.loadAsync(file);
  const presFile = zip.file("ppt/presentation.xml");
  if (!presFile) throw new Error("الملف لا يبدو ملف PowerPoint صالحاً.");
  const pres = parseXml(await presFile.async("text"));
  const presRels = await readRels(zip, "ppt/_rels/presentation.xml.rels", "ppt");
  const relById = Object.fromEntries(presRels.map((r) => [r.id, r]));
  let slidePaths = byLocalName(pres, "sldId")
    .map((el) => el.getAttributeNS(REL_NS, "id") || el.getAttribute("r:id"))
    .map((rid) => relById[rid]?.target)
    .filter(Boolean);
  if (!slidePaths.length) {
    slidePaths = Object.keys(zip.files)
      .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
      .sort((a, b) => Number(a.match(/\d+/g).pop()) - Number(b.match(/\d+/g).pop()));
  }

  const slides = [];
  for (const path of slidePaths) {
    const f = zip.file(path);
    if (!f) continue;
    const doc = parseXml(await f.async("text"));
    // Skip hidden slides
    const root = doc.documentElement;
    if (root && root.getAttribute("show") === "0") continue;
    const { title, bullets } = extractSlide(doc);
    const dir = path.split("/").slice(0, -1).join("/");
    const name = path.split("/").pop();
    const rels = await readRels(zip, `${dir}/_rels/${name}.rels`, dir);
    const notesRel = rels.find((r) => r.type.endsWith("/notesSlide"));
    let notes = "";
    if (notesRel && zip.file(notesRel.target)) {
      notes = extractNotes(parseXml(await zip.file(notesRel.target).async("text")));
    }
    const slide = { title, bullets };
    slide.narration = (notes || defaultNarration(slide)).slice(0, 4000);
    slides.push(slide);
  }
  if (!slides.length) throw new Error("لم يتم العثور على شرائح تحتوي نصاً في الملف.");
  return slides;
}

/* ---------------- Slide player with AI narration ---------------- */

const isArabic = (t) => /[؀-ۿ]/.test(t || "");

function speakWithBrowser(text, onEnd) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = isArabic(text) ? "ar-SA" : "en-US";
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
  if (match) u.voice = match;
  u.rate = 0.95;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
  return true;
}

export function SlidePlayer({ deck, lectureId, trackTime, onComplete }) {
  const slides = deck?.slides || [];
  const voice = normalizeVoice(deck?.voice);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [mode, setMode] = useState("ai"); // ai | browser
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const audioRef = useRef(null);
  const cacheRef = useRef({});
  const playingRef = useRef(false);
  const indexRef = useRef(0);
  const pendingSecondsRef = useRef(0);
  const tokenRef = useRef(0); // invalidates stale "ended" callbacks
  const [heard, setHeard] = useState(() => new Set());

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Watch-time tracking while narration plays (trainees only)
  useEffect(() => {
    if (!trackTime || !lectureId) return undefined;
    const tick = setInterval(() => {
      if (playingRef.current && document.visibilityState === "visible") pendingSecondsRef.current += 5;
      if (pendingSecondsRef.current >= 20) {
        const s = pendingSecondsRef.current;
        pendingSecondsRef.current = 0;
        api.heartbeatLecture(lectureId, s).catch(() => {});
      }
    }, 5000);
    return () => {
      clearInterval(tick);
      const s = pendingSecondsRef.current;
      pendingSecondsRef.current = 0;
      if (s > 0) api.heartbeatLecture(lectureId, s).catch(() => {});
    };
  }, [trackTime, lectureId]);

  // Stop everything on unmount
  useEffect(
    () => () => {
      playingRef.current = false;
      if (audioRef.current) audioRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      Object.values(cacheRef.current).forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const getAudioUrl = useCallback(
    async (i) => {
      const text = slides[i]?.narration || defaultNarration(slides[i] || {});
      const key = `${voice}|${text}`;
      if (cacheRef.current[key]) return cacheRef.current[key];
      const blob = await api.tts(text, voice);
      const url = URL.createObjectURL(blob);
      cacheRef.current[key] = url;
      return url;
    },
    [slides, voice],
  );

  const handleSlideEnded = useCallback(() => {
    if (!playingRef.current) return;
    tokenRef.current += 1;
    const i = indexRef.current;
    // The narration of slide i played to the end → count it as listened.
    setHeard((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
    if (trackTime && lectureId) api.slideProgress(lectureId, i).catch(() => {});
    if (i < slides.length - 1) {
      setIndex(i + 1);
      // playback continues via effect below
    } else {
      playingRef.current = false;
      setPlaying(false);
      setFinished(true);
      onComplete && onComplete();
    }
  }, [slides.length, onComplete, trackTime, lectureId]);

  const playSlide = useCallback(
    async (i) => {
      setError("");
      const text = slides[i]?.narration || defaultNarration(slides[i] || {});
      const token = ++tokenRef.current;
      const onEnd = () => {
        if (token === tokenRef.current) handleSlideEnded();
      };
      if (!text.trim()) {
        setTimeout(onEnd, 1500);
        return;
      }
      if (mode === "browser") {
        const ok = speakWithBrowser(text, onEnd);
        if (!ok) {
          setError("المتصفح لا يدعم القراءة الصوتية.");
          playingRef.current = false;
          setPlaying(false);
        }
        return;
      }
      try {
        setLoadingAudio(true);
        const url = await getAudioUrl(i);
        if (!playingRef.current || indexRef.current !== i || token !== tokenRef.current) return;
        const audio = audioRef.current;
        audio.src = url;
        await audio.play();
        // Prefetch next slide's audio
        if (i + 1 < slides.length) getAudioUrl(i + 1).catch(() => {});
      } catch (err) {
        if (err.code === "tts_not_configured") {
          setMode("browser");
          speakWithBrowser(text, onEnd);
        } else if (err.name === "NotAllowedError") {
          playingRef.current = false;
          setPlaying(false);
          setError("اضغط زر التشغيل لبدء القراءة الصوتية.");
        } else {
          setError(err.message || "تعذّر تشغيل الصوت.");
          playingRef.current = false;
          setPlaying(false);
        }
      } finally {
        setLoadingAudio(false);
      }
    },
    [slides, mode, getAudioUrl, handleSlideEnded],
  );

  // When index changes while playing, narrate the new slide
  useEffect(() => {
    if (playingRef.current) playSlide(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function stopAudio() {
    tokenRef.current += 1;
    if (audioRef.current) audioRef.current.pause();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function togglePlay() {
    if (playing) {
      playingRef.current = false;
      setPlaying(false);
      stopAudio();
    } else {
      playingRef.current = true;
      setPlaying(true);
      setFinished(false);
      playSlide(index);
    }
  }

  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    stopAudio();
    setIndex(i);
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      // RTL: left arrow = next, right arrow = previous
      if (e.key === "ArrowLeft") goTo(indexRef.current + 1);
      if (e.key === "ArrowRight") goTo(indexRef.current - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[index];
  const rtl = isArabic(slide.title + slide.bullets.join(" "));
  const progress = ((index + 1) / slides.length) * 100;

  return (
    <div className="slide-player">
      <div className="slide-stage">
        <div className={`slide-card ${rtl ? "rtl" : "ltr"}`} dir={rtl ? "rtl" : "ltr"}>
          {slide.title && <h3 className="slide-title">{slide.title}</h3>}
          {slide.bullets.length > 0 && (
            <ul className="slide-bullets">
              {slide.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          <div className="slide-number">
            {index + 1} / {slides.length}
          </div>
        </div>
      </div>
      <div className="slide-progress">
        <div className="slide-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="slide-controls">
        <button className="btn btn-small" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="الشريحة السابقة">
          ▶ السابقة
        </button>
        <button className="btn btn-primary slide-play" onClick={togglePlay}>
          {loadingAudio ? "⏳ جارِ تجهيز الصوت…" : playing ? "⏸ إيقاف مؤقت" : index === 0 && !finished ? "🔊 تشغيل العرض الصوتي" : "🔊 متابعة"}
        </button>
        <button
          className="btn btn-small"
          onClick={() => goTo(index + 1)}
          disabled={index === slides.length - 1}
          aria-label="الشريحة التالية"
        >
          التالية ◀
        </button>
      </div>
      {trackTime && (
        <p className="hint slide-heard">
          🎧 استمعت إلى {heard.size} من {slides.length} شريحة (
          {Math.round((heard.size / slides.length) * 100)}٪)
        </p>
      )}
      {mode === "browser" && (
        <p className="hint">يتم استخدام صوت المتصفح حالياً لأن خدمة الصوت الاحترافي (Google) غير مفعّلة بعد.</p>
      )}
      {error && <div className="error-box">{error}</div>}
      {index === slides.length - 1 && !finished && (
        <button
          className="btn btn-success btn-small"
          onClick={() => {
            stopAudio();
            playingRef.current = false;
            setPlaying(false);
            setFinished(true);
            onComplete && onComplete();
          }}
        >
          ✔ أنهيت العرض
        </button>
      )}
      <audio ref={audioRef} onEnded={() => handleSlideEnded()} preload="auto" />
    </div>
  );
}
