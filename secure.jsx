import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { getLang } from "./i18n.js";
import { qrSvg, drawQr } from "./qr.js";
import { TURNSTILE_SITE_KEY, SITE_URL } from "./config.js";

/* ---------------- language helper (new UI is written bilingually) ---------------- */

export const tr = (ar, en) => (getLang() === "en" ? en : ar);
export const fmtYmd = (s) => {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s || "-";
};

/* ---------------- safe links (only http/https) ---------------- */

export function safeHref(url) {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch (e) {
    return null;
  }
}

/* ---------------- Cloudflare Turnstile (human verification) ---------------- */

let turnstileScript = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileScript) {
    turnstileScript = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => resolve(window.turnstile);
      s.onerror = () => {
        turnstileScript = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return turnstileScript;
}
export const turnstileEnabled = !!TURNSTILE_SITE_KEY;

export function Turnstile({ onToken, resetKey = 0 }) {
  const box = useRef(null);
  const widget = useRef(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return;
        widget.current = ts.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: getLang(),
          theme: "light",
          callback: (t) => cb.current(t),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);
  useEffect(() => {
    if (resetKey && widget.current && window.turnstile) {
      window.turnstile.reset(widget.current);
      cb.current("");
    }
  }, [resetKey]);
  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div className="turnstile-wrap">
      <div ref={box} />
      {failed && (
        <p className="hint">
          {tr("تعذّر تحميل التحقق البشري. تحقق من الاتصال ثم حدّث الصفحة.", "Human verification could not load. Check your connection and refresh the page.")}
        </p>
      )}
    </div>
  );
}

/* ---------------- password complexity ---------------- */

const RULES = [
  { id: "length", test: (p) => p.length >= 10, ar: "10 أحرف على الأقل", en: "At least 10 characters" },
  { id: "upper", test: (p) => /[A-Z]/.test(p), ar: "حرف إنجليزي كبير (A-Z)", en: "An uppercase letter (A-Z)" },
  { id: "lower", test: (p) => /[a-z]/.test(p), ar: "حرف إنجليزي صغير (a-z)", en: "A lowercase letter (a-z)" },
  { id: "digit", test: (p) => /\d/.test(p), ar: "رقم (0-9)", en: "A number (0-9)" },
  { id: "special", test: (p) => /[^A-Za-z0-9]/.test(p), ar: "رمز خاص مثل ! @ # $", en: "A special character such as ! @ # $" },
  {
    id: "username",
    test: (p, u) => !u || u.length < 3 || !p.toLowerCase().includes(u.toLowerCase()),
    ar: "لا تحتوي على اسم المستخدم",
    en: "Does not contain the username",
  },
];
export function passwordOk(p, username) {
  const s = String(p || "");
  return s.length <= 128 && RULES.every((r) => r.test(s, username));
}
export function PasswordRules({ password, username, confirm }) {
  const p = String(password || "");
  return (
    <ul className="pw-rules" aria-live="polite">
      {RULES.map((r) => {
        const okR = r.test(p, username);
        return (
          <li key={r.id} className={okR ? "ok" : ""}>
            <span aria-hidden="true">{okR ? "✓" : "•"}</span> {tr(r.ar, r.en)}
          </li>
        );
      })}
      {confirm !== undefined && (
        <li className={p && confirm === p ? "ok" : ""}>
          <span aria-hidden="true">{p && confirm === p ? "✓" : "•"}</span> {tr("تطابق التأكيد", "Confirmation matches")}
        </li>
      )}
    </ul>
  );
}

/* ---------------- two-factor step after the password ---------------- */

function svgDataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
function downloadText(name, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

export function MfaStep({ challenge, onDone, onCancel }) {
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // after setup → show recovery codes
  const [saved, setSaved] = useState(false);
  const setup = challenge.mfa === "setup";

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.loginMfa({
        mfa_token: challenge.mfa_token,
        code: useRecovery ? "" : code.replace(/\s+/g, ""),
        recovery_code: useRecovery ? recovery : undefined,
      });
      if (data.recovery_codes) setResult(data);
      else onDone(data);
    } catch (err) {
      setError(err.message);
      setCode("");
      if (err.code === "mfa_expired") setTimeout(onCancel, 2500);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const text = [
      tr("رموز الاسترداد — منصة التعليم الطبي", "Recovery codes — Medical e-Learning Platform"),
      `${tr("الحساب", "Account")}: ${challenge.account}`,
      tr("كل رمز يُستخدم مرة واحدة إذا فقدت هاتفك.", "Each code works once if you lose your phone."),
      "",
      ...result.recovery_codes,
    ].join("\n");
    return (
      <div className="mfa-box">
        <h2 className="mfa-title">✅ {tr("تم تفعيل التحقق الثنائي", "Two-factor authentication is on")}</h2>
        <p>{tr("احفظ رموز الاسترداد التالية في مكان آمن. كل رمز يُستخدم مرة واحدة للدخول إذا فقدت هاتفك، ولن تظهر مرة أخرى.", "Save these recovery codes somewhere safe. Each one signs you in once if you lose your phone, and they will not be shown again.")}</p>
        <ul className="recovery-codes" dir="ltr">
          {result.recovery_codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="form-actions">
          <button type="button" className="btn btn-small" onClick={() => downloadText("recovery-codes.txt", text)}>
            ⬇ {tr("تنزيل الرموز", "Download codes")}
          </button>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
          {tr("حفظت رموز الاسترداد", "I have saved my recovery codes")}
        </label>
        <button className="btn btn-primary" disabled={!saved} onClick={() => onDone(result)}>
          {tr("متابعة إلى المنصة", "Continue to the platform")}
        </button>
      </div>
    );
  }

  return (
    <form className="form mfa-box" onSubmit={submit}>
      <h2 className="mfa-title">🔐 {setup ? tr("ربط تطبيق المصادقة (التحقق الثنائي)", "Link an authenticator app (two-factor)") : tr("التحقق الثنائي", "Two-factor verification")}</h2>
      {setup ? (
        <>
          <ol className="mfa-steps">
            <li>{tr("ثبّت تطبيق Google Authenticator أو Microsoft Authenticator على هاتفك.", "Install Google Authenticator or Microsoft Authenticator on your phone.")}</li>
            <li>{tr(`امسح الرمز التالي من التطبيق. سيظهر الحساب باسم «${challenge.issuer}».`, `Scan this code in the app. The account will appear as “${challenge.issuer}”.`)}</li>
            <li>{tr("أدخل الرمز المكوّن من 6 أرقام الظاهر في التطبيق.", "Enter the 6-digit code shown in the app.")}</li>
          </ol>
          <img className="mfa-qr" alt={tr("رمز QR لتطبيق المصادقة", "QR code for the authenticator app")} src={svgDataUrl(qrSvg(challenge.otpauth, { ecl: "M", margin: 2 }))} />
          <details className="mfa-manual">
            <summary>{tr("لا أستطيع المسح — إدخال المفتاح يدوياً", "Can't scan? Enter the key manually")}</summary>
            <p>
              {tr("الجهة", "Issuer")}: <b dir="ltr">{challenge.issuer}</b> — {tr("الحساب", "Account")}: <b dir="ltr">{challenge.account}</b>
            </p>
            <code dir="ltr" className="mfa-secret">{challenge.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
          </details>
        </>
      ) : (
        <p>{tr(`افتح تطبيق المصادقة وأدخل الرمز الحالي لحساب «site.sa».`, `Open your authenticator app and enter the current code for the “site.sa” account.`)}</p>
      )}
      {error && <div className="error-box">{error}</div>}
      {!useRecovery ? (
        <label>
          {tr("رمز التحقق (6 أرقام)", "Verification code (6 digits)")}
          <input
            className="otp-input"
            dir="ltr"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
          />
        </label>
      ) : (
        <label>
          {tr("رمز الاسترداد", "Recovery code")}
          <input dir="ltr" required autoFocus autoComplete="off" placeholder="XXXXX-XXXXX" value={recovery} onChange={(e) => setRecovery(e.target.value)} />
        </label>
      )}
      <button className="btn btn-primary" disabled={loading} type="submit">
        {loading ? "…" : tr("تحقق", "Verify")}
      </button>
      {!setup && (
        <button type="button" className="link-btn" onClick={() => setUseRecovery((v) => !v)}>
          {useRecovery ? tr("استخدام رمز التطبيق", "Use the app code") : tr("فقدت هاتفي — استخدام رمز استرداد", "Lost my phone — use a recovery code")}
        </button>
      )}
      <button type="button" className="link-btn" onClick={onCancel}>
        ← {tr("العودة لتسجيل الدخول", "Back to sign in")}
      </button>
      {!setup && (
        <p className="hint">{tr("إذا فقدت هاتفك ورموز الاسترداد، اطلب من المشرف إعادة ضبط التحقق الثنائي.", "If you lost both your phone and recovery codes, ask the administrator to reset two-factor authentication.")}</p>
      )}
    </form>
  );
}

/* ---------------- certificate: canvas render → real PDF download ---------------- */

const PLATFORM_AR = "منصة التعليم الطبي الالكتروني بطب الأسرة والمجتمع";
const PLATFORM_EN = "Family & Community Medicine e-Learning Platform";
export const verifyUrl = (code) => `${SITE_URL}/?verify=${encodeURIComponent(code)}`;

let fontLink = null;
async function ensureCertFont() {
  if (!fontLink) {
    fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap";
    document.head.appendChild(fontLink);
  }
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.race([
      Promise.all(["400 40px Tajawal", "700 40px Tajawal", "800 40px Tajawal"].map((f) => document.fonts.load(f, "شهادة Certificate"))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) {
    /* fall back to system fonts */
  }
}
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (ctx.measureText(t).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export async function renderCertificateCanvas(cert, { logo, lang = getLang() } = {}) {
  await ensureCertFont();
  const W = 2339, H = 1654; // A4 landscape @ 200 dpi
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const en = lang === "en";
  const F = (w, s) => `${w} ${s}px Tajawal, "Segoe UI", Tahoma, Arial, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  // frame
  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 10;
  ctx.strokeRect(70, 70, W - 140, H - 140);
  ctx.strokeStyle = "#99c9c2";
  ctx.lineWidth = 3;
  ctx.strokeRect(95, 95, W - 190, H - 190);
  // corner accents
  ctx.fillStyle = "#c9a227";
  for (const [x, y] of [[95, 95], [W - 135, 95], [95, H - 135], [W - 135, H - 135]]) ctx.fillRect(x, y, 40, 40);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.direction = en ? "ltr" : "rtl";
  const cx = W / 2;
  const img = await loadImage(logo);
  if (img) ctx.drawImage(img, cx - 70, 150, 140, 130);
  ctx.fillStyle = "#115e59";
  ctx.font = F(700, 44);
  ctx.fillText(en ? PLATFORM_EN : PLATFORM_AR, cx, 345);
  ctx.fillStyle = "#0f766e";
  ctx.font = F(800, 112);
  ctx.fillText(en ? "Certificate of Attendance" : "شهادة حضور", cx, 495);
  ctx.fillStyle = "#64748b";
  ctx.font = F(500, 40);
  ctx.fillText(en ? "شهادة حضور" : "CERTIFICATE OF ATTENDANCE", cx, 560);

  ctx.fillStyle = "#1f2937";
  ctx.font = F(400, 46);
  ctx.fillText(en ? "This is to certify that" : `تشهد ${PLATFORM_AR} بأن`, cx, 655);
  ctx.fillStyle = "#111827";
  ctx.font = F(800, 90);
  ctx.direction = /[؀-ۿ]/.test(cert.holder_name) ? "rtl" : "ltr";
  ctx.fillText(cert.holder_name || "", cx, 775);
  const nameW = Math.min(1500, ctx.measureText(cert.holder_name || "").width + 120);
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(cx - nameW / 2, 800, nameW, 5);
  ctx.direction = en ? "ltr" : "rtl";

  const details = [
    cert.employee_id ? `${en ? "Employee ID" : "الرقم الوظيفي"}: ${cert.employee_id}` : "",
    cert.hospital ? `${en ? "Facility" : "المنشأة"}: ${cert.hospital}` : "",
  ].filter(Boolean).join("   •   ");
  ctx.fillStyle = "#475569";
  ctx.font = F(500, 38);
  if (details) ctx.fillText(details, cx, 870);

  ctx.fillStyle = "#1f2937";
  ctx.font = F(400, 44);
  ctx.fillText(en ? "has attended the educational lecture entitled" : "قد أتمّ/ت حضور المحاضرة التعليمية بعنوان", cx, 955);
  ctx.fillStyle = "#115e59";
  ctx.font = F(700, 60);
  const titleDir = /[؀-ۿ]/.test(cert.lecture_title) ? "rtl" : "ltr";
  ctx.direction = titleDir;
  const q = titleDir === "rtl" ? ["«", "»"] : ["“", "”"];
  const lines = wrapLines(ctx, `${q[0]}${cert.lecture_title}${q[1]}`, 1750);
  lines.forEach((l, i) => ctx.fillText(l, cx, 1040 + i * 72));
  ctx.direction = en ? "ltr" : "rtl";
  let y = 1040 + lines.length * 72;
  if (cert.program_name) {
    ctx.fillStyle = "#475569";
    ctx.font = F(500, 38);
    ctx.fillText(`${en ? "Training program" : "البرنامج التدريبي"}: ${cert.program_name}`, cx, y + 5);
    y += 60;
  }
  // score pill
  const pill = en ? `and passed the post-test with a score of ${cert.score}%` : `واجتاز/ت الاختبار البعدي بنسبة ${cert.score}%`;
  ctx.font = F(700, 40);
  const pw = ctx.measureText(pill).width + 90;
  ctx.fillStyle = "#f0fdfa";
  ctx.strokeStyle = "#99c9c2";
  ctx.lineWidth = 3;
  const py = y + 10;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(cx - pw / 2, py, pw, 76, 38) : ctx.rect(cx - pw / 2, py, pw, 76);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0f766e";
  ctx.fillText(pill, cx, py + 52);

  // footer: QR (left), validity (centre), issue / number (right)
  const qrSize = 300;
  const qx = 180, qy = H - 180 - qrSize;
  drawQr(ctx, verifyUrl(cert.code), qx, qy, qrSize, { ecl: "M", margin: 2 });
  ctx.fillStyle = "#475569";
  ctx.font = F(500, 30);
  ctx.textAlign = "center";
  ctx.fillText(en ? "Scan to verify" : "امسح للتحقق", qx + qrSize / 2, qy + qrSize + 42);

  ctx.fillStyle = "#1f2937";
  ctx.font = F(700, 38);
  ctx.fillText(en ? "Valid" : "سارية", cx, H - 300);
  ctx.font = F(500, 38);
  ctx.direction = "ltr";
  const range = en ? `from ${fmtYmd(cert.valid_from)} to ${fmtYmd(cert.valid_until)}` : null;
  if (en) ctx.fillText(range, cx, H - 245);
  else {
    ctx.direction = "rtl";
    ctx.fillText(`من ${fmtYmd(cert.valid_from)} إلى ${fmtYmd(cert.valid_until)}`, cx, H - 245);
  }
  ctx.direction = en ? "ltr" : "rtl";
  ctx.fillStyle = "#64748b";
  ctx.font = F(400, 30);
  ctx.fillText(en ? `Verify at ${SITE_URL.replace("https://", "")}` : `للتحقق: ${SITE_URL.replace("https://", "")}`, cx, H - 195);

  const rx = W - 180 - 380;
  ctx.textAlign = "center";
  ctx.fillStyle = "#475569";
  ctx.font = F(500, 32);
  ctx.fillText(en ? "Issue date" : "تاريخ الإصدار", rx + 190, H - 400);
  ctx.fillStyle = "#111827";
  ctx.font = F(700, 38);
  ctx.direction = "ltr";
  ctx.fillText(fmtYmd(cert.valid_from), rx + 190, H - 350); // issue date in Saudi time
  ctx.direction = en ? "ltr" : "rtl";
  ctx.fillStyle = "#475569";
  ctx.font = F(500, 32);
  ctx.fillText(en ? "Certificate No." : "رقم الشهادة", rx + 190, H - 275);
  ctx.fillStyle = "#111827";
  ctx.font = `700 36px "Courier New", monospace`;
  ctx.direction = "ltr";
  ctx.fillText(cert.code, rx + 190, H - 225);
  return c;
}

// Minimal PDF with one full-page JPEG (A4 landscape) — no external library needed.
function jpegToPdf(jpegBytes, imgW, imgH) {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let len = 0;
  const push = (chunk) => {
    const b = typeof chunk === "string" ? enc.encode(chunk) : chunk;
    parts.push(b);
    len += b.length;
  };
  const obj = (n, body) => {
    offsets[n] = len;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const PW = 842, PH = 595;
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = len;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  push(jpegBytes);
  push("\nendstream\nendobj\n");
  const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  obj(6, `<< /Title (Certificate) /Producer (FCM e-Learning Platform) >>`);
  const xref = len;
  let x = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) x += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  push(x);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return new Blob([out], { type: "application/pdf" });
}

export async function downloadCertificatePdf(cert, { logo } = {}) {
  const canvas = await renderCertificateCanvas(cert, { logo });
  const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.92));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pdf = jpegToPdf(bytes, canvas.width, canvas.height);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(pdf);
  a.download = `certificate-${cert.code}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}

/* ---------------- trainee certificate card (lecture page) ---------------- */

export function CertificateCard({ lectureId, refreshKey, logo }) {
  const [cert, setCert] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    api
      .getMyCertificates()
      .then((d) => alive && setCert((d.certificates || []).find((c) => Number(c.lecture_id) === Number(lectureId)) || null))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [lectureId, refreshKey]);
  if (!cert && !error) return null;
  async function download() {
    setBusy(true);
    setError("");
    try {
      await downloadCertificatePdf(cert, { logo });
    } catch (e) {
      setError(tr("تعذّر إنشاء ملف الشهادة على هذا الجهاز. جرّب متصفحاً آخر.", "The certificate file could not be created on this device. Try another browser."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="certificate-card">
      <span className="certificate-icon" aria-hidden="true">🎓</span>
      <div className="certificate-text">
        <strong>{tr("شهادة الحضور", "Attendance certificate")}</strong>
        {cert && (
          <span>
            {tr("رقم الشهادة", "Certificate No.")} <bdi dir="ltr">{cert.code}</bdi> — {tr("سارية من", "valid from")} <bdi dir="ltr">{fmtYmd(cert.valid_from)}</bdi> {tr("إلى", "to")} <bdi dir="ltr">{fmtYmd(cert.valid_until)}</bdi>
          </span>
        )}
        {error && <span className="error-text">{error}</span>}
      </div>
      {cert && (
        <div className="certificate-actions">
          <button className="btn btn-primary" disabled={busy} onClick={download}>
            {busy ? "…" : `⬇ ${tr("تحميل الشهادة PDF", "Download certificate (PDF)")}`}
          </button>
          <a className="btn btn-small" href={verifyUrl(cert.code)} target="_blank" rel="noopener noreferrer">
            🔎 {tr("صفحة التحقق", "Verification page")}
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------------- public verification page (QR target) ---------------- */

const STATUS_UI = {
  valid: { cls: "valid", icon: "✅", ar: "شهادة سارية", en: "Valid certificate" },
  expired: { cls: "expired", icon: "⌛", ar: "شهادة منتهية الصلاحية", en: "Expired certificate" },
  revoked: { cls: "revoked", icon: "⛔", ar: "شهادة ملغاة", en: "Revoked certificate" },
};
export function CertStatusBadge({ status }) {
  const s = STATUS_UI[status] || STATUS_UI.valid;
  return <span className={`cert-badge ${s.cls}`}>{s.icon} {tr(s.ar, s.en)}</span>;
}

export function VerifyPage({ initialCode, toggle, onBack }) {
  const [code, setCode] = useState(initialCode || "");
  const [cert, setCert] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const check = useCallback(async (value) => {
    const v = String(value || "").trim();
    if (!v) return;
    setLoading(true);
    setError("");
    setCert(null);
    try {
      const d = await api.verifyCertificate(v);
      setCert(d.certificate);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (initialCode) check(initialCode);
  }, [initialCode, check]);
  return (
    <div className="auth-shell">
      {toggle}
      <div className="auth-card verify-card">
        <div className="auth-logo">🔎</div>
        <h1 className="auth-title">{tr("التحقق من شهادة حضور", "Verify an attendance certificate")}</h1>
        <p className="hint">{tr(PLATFORM_AR, PLATFORM_EN)}</p>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            check(code);
          }}
        >
          <label>
            {tr("رقم الشهادة", "Certificate number")}
            <input dir="ltr" required placeholder="FCM-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </label>
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? "…" : tr("تحقق", "Verify")}
          </button>
        </form>
        {error && <div className="error-box">❌ {error}</div>}
        {cert && (
          <div className={`verify-result ${cert.status}`}>
            <CertStatusBadge status={cert.status} />
            <dl>
              <dt>{tr("اسم الحاصل على الشهادة", "Holder")}</dt>
              <dd><bdi>{cert.holder_name}</bdi></dd>
              {cert.employee_id_masked && (
                <>
                  <dt>{tr("الرقم الوظيفي", "Employee ID")}</dt>
                  <dd dir="ltr">{cert.employee_id_masked}</dd>
                </>
              )}
              <dt>{tr("المحاضرة", "Lecture")}</dt>
              <dd><bdi>{cert.lecture_title}</bdi></dd>
              {cert.program_name && (
                <>
                  <dt>{tr("البرنامج التدريبي", "Training program")}</dt>
                  <dd><bdi>{cert.program_name}</bdi></dd>
                </>
              )}
              <dt>{tr("تاريخ الإصدار", "Issue date")}</dt>
              <dd dir="ltr">{fmtYmd(cert.valid_from)}</dd>
              <dt>{tr("مدة الصلاحية", "Validity")}</dt>
              <dd>
                {tr("من", "From")} <bdi dir="ltr">{fmtYmd(cert.valid_from)}</bdi> {tr("إلى", "to")} <bdi dir="ltr">{fmtYmd(cert.valid_until)}</bdi>
              </dd>
              <dt>{tr("رقم الشهادة", "Certificate No.")}</dt>
              <dd dir="ltr"><code>{cert.code}</code></dd>
            </dl>
          </div>
        )}
        {onBack && (
          <button type="button" className="link-btn" onClick={onBack}>
            ← {tr("الذهاب إلى صفحة الدخول", "Go to the sign-in page")}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- admin: certificate verification portal ---------------- */

export function CertificatesPortal() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const load = useCallback(async (query, st) => {
    setLoading(true);
    setError("");
    try {
      const d = await api.adminCertificates({ q: query, status: st });
      setList(d.certificates || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load("", "");
  }, [load]);
  async function toggleRevoke(c) {
    setMsg("");
    setError("");
    try {
      if (c.status === "revoked") {
        await api.revokeCertificate(c.code, "", "restore");
        setMsg(tr(`أعيد تفعيل الشهادة ${c.code}.`, `Certificate ${c.code} was restored.`));
      } else {
        const reason = window.prompt(tr(`سبب إلغاء الشهادة ${c.code}:`, `Reason for revoking certificate ${c.code}:`), "");
        if (reason === null) return;
        await api.revokeCertificate(c.code, reason, "revoke");
        setMsg(tr(`تم إلغاء الشهادة ${c.code}.`, `Certificate ${c.code} was revoked.`));
      }
      load(q, status);
    } catch (e) {
      setError(e.message);
    }
  }
  const counts = list.reduce((a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a), {});
  return (
    <div className="panel">
      <h2>🔎 {tr("بوابة التحقق من الشهادات", "Certificate verification portal")}</h2>
      <p className="hint">
        {tr("ابحث برقم الشهادة (أو امسح رمز QR بكاميرا الهاتف)، أو باسم المتدرب أو رقمه الوظيفي أو عنوان المحاضرة. كل شهادة سارية لمدة سنة من تاريخ إصدارها.", "Search by certificate number (or scan the QR with a phone camera), trainee name, employee ID or lecture title. Each certificate is valid for one year from its issue date.")}
      </p>
      <form
        className="form report-filters"
        onSubmit={(e) => {
          e.preventDefault();
          load(q, status);
        }}
      >
        <label>
          {tr("بحث", "Search")}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("رقم الشهادة / الاسم / الرقم الوظيفي", "Certificate No. / name / employee ID")} />
        </label>
        <label>
          {tr("الحالة", "Status")}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{tr("الكل", "All")}</option>
            <option value="valid">{tr("سارية", "Valid")}</option>
            <option value="expired">{tr("منتهية", "Expired")}</option>
            <option value="revoked">{tr("ملغاة", "Revoked")}</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "…" : tr("بحث", "Search")}
        </button>
      </form>
      <div className="cert-counts">
        <span>{tr("النتائج", "Results")}: <b>{list.length}</b></span>
        <span>✅ {counts.valid || 0}</span>
        <span>⌛ {counts.expired || 0}</span>
        <span>⛔ {counts.revoked || 0}</span>
      </div>
      {error && <div className="error-box">{error}</div>}
      {msg && <div className="success-box">{msg}</div>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{tr("رقم الشهادة", "Certificate No.")}</th>
              <th>{tr("المتدرب", "Trainee")}</th>
              <th>{tr("الرقم الوظيفي", "Employee ID")}</th>
              <th>{tr("المحاضرة", "Lecture")}</th>
              <th>{tr("الدرجة", "Score")}</th>
              <th>{tr("الصلاحية", "Validity")}</th>
              <th>{tr("الحالة", "Status")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.code}>
                <td dir="ltr"><code>{c.code}</code></td>
                <td><bdi>{c.holder_name}</bdi></td>
                <td dir="ltr">{c.employee_id || "-"}</td>
                <td><bdi>{c.lecture_title}</bdi></td>
                <td>{c.score != null ? `${c.score}%` : "-"}</td>
                <td className="nowrap"><bdi dir="ltr">{fmtYmd(c.valid_from)}</bdi> → <bdi dir="ltr">{fmtYmd(c.valid_until)}</bdi></td>
                <td>
                  <CertStatusBadge status={c.status} />
                  {c.status === "revoked" && c.revoked_reason && <div className="muted small"><bdi>{c.revoked_reason}</bdi></div>}
                </td>
                <td className="actions-cell">
                  <a className="btn btn-small" href={verifyUrl(c.code)} target="_blank" rel="noopener noreferrer">{tr("عرض", "View")}</a>
                  <button className={c.status === "revoked" ? "btn btn-small" : "btn btn-small btn-danger"} onClick={() => toggleRevoke(c)}>
                    {c.status === "revoked" ? tr("إعادة تفعيل", "Restore") : tr("إلغاء", "Revoke")}
                  </button>
                </td>
              </tr>
            ))}
            {!list.length && !loading && (
              <tr>
                <td colSpan={8} className="muted">{tr("لا توجد شهادات مطابقة.", "No matching certificates.")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- admin: security audit log ---------------- */

const ACTION_LABELS = {
  login_success: ["دخول ناجح", "Successful sign-in"],
  login_fail: ["محاولة دخول فاشلة", "Failed sign-in"],
  lockout: ["إيقاف مؤقت بعد محاولات فاشلة", "Temporary lockout"],
  login_blocked: ["محاولة أثناء الإيقاف", "Attempt while locked"],
  mfa_enrolled: ["تفعيل التحقق الثنائي", "2FA enabled"],
  mfa_fail: ["رمز تحقق ثنائي خاطئ", "Wrong 2FA code"],
  mfa_setup_fail: ["رمز خاطئ أثناء الربط", "Wrong code during 2FA setup"],
  mfa_blocked: ["إيقاف خطوة التحقق", "2FA step blocked"],
  mfa_recovery_used: ["استخدام رمز استرداد", "Recovery code used"],
  admin_reset_mfa: ["إعادة ضبط التحقق الثنائي", "2FA reset by admin"],
  signup: ["طلب تسجيل", "Registration"],
  password_changed: ["تغيير كلمة المرور", "Password changed"],
  password_change_fail: ["فشل تغيير كلمة المرور", "Password change failed"],
  password_reset_requested: ["طلب استعادة كلمة المرور", "Password reset requested"],
  password_reset_done: ["استعادة كلمة المرور", "Password reset completed"],
  admin_sent_reset: ["إرسال رابط استعادة", "Reset link sent"],
  user_status: ["تغيير حالة حساب", "Account status changed"],
  user_role: ["تغيير دور", "Role changed"],
  user_deleted: ["حذف حساب", "Account deleted"],
  lecture_status: ["تغيير حالة محاضرة", "Lecture status changed"],
  lecture_deleted: ["حذف محاضرة", "Lecture deleted"],
  program_deleted: ["حذف برنامج", "Program deleted"],
  schedule_uploaded: ["رفع جدول", "Schedule uploaded"],
  certificate_revoked: ["إلغاء شهادة", "Certificate revoked"],
  certificate_restored: ["إعادة تفعيل شهادة", "Certificate restored"],
  backup_downloaded: ["تنزيل نسخة احتياطية", "Backup downloaded"],
  backup_emailed: ["إرسال نسخة احتياطية", "Backup emailed"],
};
const RISKY = new Set(["login_fail", "lockout", "login_blocked", "mfa_fail", "mfa_blocked", "password_change_fail", "mfa_setup_fail"]);

export function AuditLog({ fmt }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [onlyRisky, setOnlyRisky] = useState(false);
  useEffect(() => {
    if (!open) return;
    api.getAudit().then((d) => setRows(d.entries || [])).catch((e) => setError(e.message));
  }, [open]);
  const shown = onlyRisky ? rows.filter((r) => RISKY.has(r.action)) : rows;
  return (
    <div className="backup-panel">
      <div className="audit-head">
        <strong>🛡 {tr("سجل الأمان", "Security log")}</strong>
        <button className="btn btn-small" onClick={() => setOpen((v) => !v)}>
          {open ? tr("إخفاء", "Hide") : tr("عرض آخر 300 حدث", "Show last 300 events")}
        </button>
      </div>
      {open && (
        <>
          <label className="checkbox-row">
            <input type="checkbox" checked={onlyRisky} onChange={(e) => setOnlyRisky(e.target.checked)} />
            {tr("المحاولات المشبوهة فقط", "Suspicious attempts only")}
          </label>
          {error && <div className="error-box">{error}</div>}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{tr("الوقت", "Time")}</th>
                  <th>{tr("المستخدم", "User")}</th>
                  <th>{tr("الحدث", "Event")}</th>
                  <th>{tr("التفاصيل", "Details")}</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={RISKY.has(r.action) ? "risky" : ""}>
                    <td dir="ltr">{fmt ? fmt(r.ts) : r.ts}</td>
                    <td dir="ltr">{r.username || "-"}</td>
                    <td>{ACTION_LABELS[r.action] ? tr(...ACTION_LABELS[r.action]) : r.action}</td>
                    <td dir="auto">{r.detail || ""}</td>
                    <td dir="ltr">{r.ip || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
