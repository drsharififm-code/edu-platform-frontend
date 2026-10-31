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

// Split bilingual text (English + Arabic on the same slide) into runs by language so
// each run is read by a matching voice. Single-word runs (e.g. "HbA1c") stay inside
// the surrounding language to avoid choppy audio. Mirrors the server-side logic.
export function segmentByLang(text) {
  const spaced = String(text || "")
    .replace(/([^\s؀-ۿ])([؀-ۿ])/g, "$1 $2")
    .replace(/([؀-ۿ])([A-Za-z(\[])/g, "$1 $2");
  const runs = [];
  for (const w of spaced.split(/(\s+)/).filter((x) => x.length)) {
    const lang = /[؀-ۿ]/.test(w) ? "ar" : /[A-Za-z]/.test(w) ? "en" : null;
    const last = runs[runs.length - 1];
    if (!last) runs.push({ lang, text: w, words: lang ? 1 : 0 });
    else if (lang === null || lang === last.lang || last.lang === null) {
      last.text += w;
      if (lang) {
        last.lang = last.lang || lang;
        last.words += 1;
      }
    } else runs.push({ lang, text: w, words: 1 });
  }
  while (runs.length > 1) {
    let pick = -1;
    let best = null;
    runs.forEach((r, i) => {
      if (r.words >= 2) return;
      const nb = Math.max(runs[i - 1]?.words || 0, runs[i + 1]?.words || 0);
      if (!best || r.words < best[0] || (r.words === best[0] && -nb < best[1])) {
        best = [r.words, -nb];
        pick = i;
      }
    });
    if (pick < 0) break;
    const left = runs[pick - 1];
    const right = runs[pick + 1];
    const j = !right || (left && left.words >= right.words) ? pick - 1 : pick + 1;
    const [x, y] = j < pick ? [runs[j], runs[pick]] : [runs[pick], runs[j]];
    runs.splice(Math.min(pick, j), 2, { lang: runs[j].lang, text: x.text + y.text, words: x.words + y.words });
  }
  const out = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && last.lang === r.lang) last.text += r.text;
    else out.push({ lang: r.lang || "ar", text: r.text });
  }
  return out.map((r) => ({ lang: r.lang, text: r.text.trim() })).filter((r) => r.text);
}

// Browser voices: prefer high-quality "Natural"/"Online"/"Neural" voices (e.g. Microsoft
// Hamed/Zariyah in Edge, Google voices in Chrome), Saudi Arabic first, matching gender.
const MALE_HINTS = /hamed|naayf|shakir|fahed|hamdan|omar|bassel|rami|taim|moaz|shakir|guy|davis|andrew|brian|christopher|eric|roger|steffan|male|david|mark|james|daniel/i;
const FEMALE_HINTS = /zariyah|hoda|salma|amina|layla|mouna|reem|sana|fatima|aria|jenny|emma|ava|michelle|ana|female|zira|samantha|susan|hazel|libby/i;

function pickBrowserVoice(lang, gender) {
  const voices = window.speechSynthesis.getVoices() || [];
  const want = lang === "ar" ? "ar" : "en";
  let best = null;
  let bestScore = -1;
  for (const v of voices) {
    const vl = (v.lang || "").toLowerCase().replace("_", "-");
    if (!vl.startsWith(want)) continue;
    let score = 1;
    if (/natural|online|neural|wavenet|premium|enhanced/i.test(v.name)) score += 5;
    if (/^google/i.test(v.name)) score += 2;
    if (want === "ar" && vl === "ar-sa") score += 2;
    if (want === "en" && vl === "en-us") score += 1;
    if (gender === "male" && MALE_HINTS.test(v.name)) score += 3;
    if (gender === "female" && FEMALE_HINTS.test(v.name)) score += 3;
    if (gender === "male" && FEMALE_HINTS.test(v.name)) score -= 2;
    if (gender === "female" && MALE_HINTS.test(v.name)) score -= 2;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

// Chrome/Edge load voices asynchronously; warm them up early.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  } catch (e) {
    /* ignore */
  }
}

function speakWithBrowser(text, onEnd, voiceId) {
  if (!("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const gender = String(voiceId || "m1").startsWith("f") ? "female" : "male";
  // Chrome cuts off long utterances (~15s), so also split each language run by sentence.
  const parts = [];
  for (const seg of segmentByLang(text)) {
    let cur = "";
    for (const sen of seg.text.split(/(?<=[.!?؟،؛:\n])\s+/)) {
      if ((cur + " " + sen).length > 180 && cur) {
        parts.push({ lang: seg.lang, text: cur });
        cur = sen;
      } else cur = cur ? cur + " " + sen : sen;
    }
    if (cur.trim()) parts.push({ lang: seg.lang, text: cur });
  }
  if (!parts.length) {
    setTimeout(onEnd, 300);
    return true;
  }
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    onEnd && onEnd();
  };
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part.text);
    u.lang = part.lang === "ar" ? "ar-SA" : "en-US";
    const v = pickBrowserVoice(part.lang, gender);
    if (v) u.voice = v;
    u.rate = 0.95;
    if (i === parts.length - 1) {
      u.onend = done;
      u.onerror = done;
    }
    synth.speak(u);
  });
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
      const blob = await api.tts(text, voice, { lectureId, slideIndex: i });
      const url = URL.createObjectURL(blob);
      cacheRef.current[key] = url;
      return url;
    },
    [slides, voice, lectureId],
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
        const ok = speakWithBrowser(text, onEnd, voice);
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
        if (err.name === "NotAllowedError") {
          playingRef.current = false;
          setPlaying(false);
          setError("اضغط زر التشغيل لبدء القراءة الصوتية.");
        } else {
          // AI voice not configured or unavailable (e.g. no credit) → browser voice.
          setMode("browser");
          const ok = speakWithBrowser(text, onEnd, voice);
          if (!ok) {
            setError(err.message || "تعذّر تشغيل الصوت.");
            playingRef.current = false;
            setPlaying(false);
          }
        }
      } finally {
        setLoadingAudio(false);
      }
    },
    [slides, mode, voice, getAudioUrl, handleSlideEnded],
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
