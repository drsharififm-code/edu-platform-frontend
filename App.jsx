import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api, setToken, getToken, API_BASE } from "./api.js";
import { getLang, setLang, dateLocale } from "./i18n.js";
import { SlidePlayer, parsePptx, VOICE_OPTIONS, defaultNarration, normalizeVoice } from "./slides.jsx";

const PROGRAM_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAAB6CAMAAABJAgv8AAABIFBMVEX+/v6YpKbO6NS3xsfN19bl6uuttrjY5uVRpmsXOjijqq2q17bEycwwdk1PmGoXZTfa9eYnR0ZyuYeWx6YtaEczVlPQ89c5mldFmVlRh2ZLaGduh4h2lo+X1aqoyLO418mHxphzp4aIt5iVt6top3pWdXO1vcFmmXmEmpm45cUaQ0J2xI5YsnOIqJWt4boZXTQjWzckZDyXnqMaQT1Fd1bW3eE3oVpGhFxFpFxotHwiOzs4gllDWVlje3sdaEAiQD04mmNjhnlEZVzj+t06ZWM5omSN0ZcVP0Q8hGBesYAbVlJJX2JmeoC58scAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADfPnBAAAAYHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAEoWZuAAAJGUlEQVR42u1aaXfiuBLFli1veLfBNph9h7CEkKWT7vQ+M+/N/P+/82QCRpZEeizmnfc+UCd9EgyRrqpu3SpVulK52tWudrWrXe1qV7va1a52tav935gjGi1DvGSF2rLjPXleWuNdQOw+2/bKtu+63DjSRT1SkdUjj2+NfrAymz2/NzBXwQ3fKbzPqj91Kk7N8CLV4IjEYHXnH35u3a0GDkcoPKuTv1iqUav0Cl3bOjlQUe3m/rvRG1txHFvNvnTm8KIkSeLbb3o/UhzSwirrC38dF16PNz2xY5m2bZuZZd+7bWJ/Y75Q7+vI7u9Vb278rHeK76tqOXrW7r4WieTcBeZ6E/da+8ei1Oo+rFbx6Wiiv/hx/0P1Op3USP2Op1pRtCD2TCO/pCN6JE1te1zE1R5vjo+mXlRX53gyO6kapSTN1EEpEFZAZpT4bJO4Km3LNtHhlp5leWS8l48qlZQdtUyeymZM47IZeeqbm8H8s9WhFzfuF/Sz+rRMgptjOl1WLLEQ45XJ1CE2CONSEHb/jJ6MWc+n0aUgFPML9Wxgn1lhYLNQ1B5VSt9a9WUZYj7ckSs4z8/nsnwc9BhPvYgigFdOKAZr8tjGp+5ZhY83DEU2og4ZZNUrlaKGbVFJe17620FMlxbnySIIO49K6rZlF9WtZ39559O9T4wzTi2v4P30vleydkimicP2A1PKBdp6QNXD6hl4QExGmvoFFEbZ0pH9jmnCfI+bT8dgiN1gtTHj+AHVsIdTgHyWkiEU6rHIiZ3PKkdbY5ib2Bf3R39YmYf9WuY67r3VMKMbrE/VxLxjNRypFXf95XRp9FSLr7USLVSvn+OHYL05HqK/rxX5B8b278cgeeH+DTHteJ20nQMS54/1eoRq+/3TN74GUbUD1DcE8Y2YOz2WiA7wWTwmyKBSS9V63UINJaqof+Wi5XsDVV2o6pQLg2jGho8326JJ0a+fp/LzHYKgdpZirTZNvcjy8Z5ddIx6hwuEQdbum7XP0Ox+3g6q6bdTo07kZ61kL3GShqI81Rj1vSL+HkiHTw/wXZ3541OBqnOLi5jdQCI8w0rD1qF8GQEh6z+Lsp1GbR4QY4IBPXYZtT61mdX/29xqF0p7ygMiNh2iWIps6jTfQJDVpmbhWi4+zrlAPBdBxHcyu4buwdEgKvPHKd5f8IF4eN8zeZpu+vs+iAKxrOMRKFnHj8EmTj42xTN6YrE9UYvml4MgNu3a7XfIIwZU0+OoT7hQzPlStLipb/fe+aCxod9dYAIlRlyS2dsUU1IMrDPXtQ1S0v6a6rycBeaJZck7YC5DxNnGG3Y82pmK0Xc2FAGMBp2Iq4JRJ28HSBFkZNQHuxWHoenT6OfpxZPqVPjUSibGRzdQF5DpcCTJOIgxchvdjPvREmtOuJIjSweMFDLQhT6EI1CtAphh0avK8aqEXDb+RIdqgM0G/MjgAwGCP/Ir2UgQYHV3Or5Shbe3UD7MLh46jGikWLWQOSs5Fg8ZQQCUZsvVW3DIo/WavpVMVWzOxe2IbPF9wy3pDAiZN/RjP966adGpYU2xu1fX4QUh3mU3q6oAFWJ3CbwxVDr7q1MVH5N59XaF225W/Qo8Ov2IADH0VthT9CwGx1fxsWXKp5anXrclVAs3M0gwlNli/PF5gUmTQfSbpVVzUsCwgygz5V8M/tJBpPpOgaEXjccRH3AMAEH4hesML2v88YMvVcu4CIMkQCwloTA664Wa4WfTy6geea1CIqSPatC4BIOs4xj0d5JBRNcudPka9IxiIineQ3c6dMFFwZAwP+gkBuW0oV9Pa+ieRYiBk6qfUWjA7CM/BgV3BKD8cBOGDTkfiXVqNEPVaLEvYUOXXyaAfjrqTiBdKrnBUDuidDxL9VKRZKjxhgx+aPIzYnR6AXWSk00NtLVJftXJNr1Xn+ZpmjF0EEWRZxyjI7+E8j/BCJ10hBOEKNj4CcVl50ndjyPq1qJT+NNZ87cRJwio47lKMgIgL1RdMvkcMbObNeF+MJtwgsAPXxVIf040gGgxZAcymRH1Jkw4cwM/PKAoMXSVivz9zNqAdNEwVDjVcoeDoA6bHJAwjXyj6UqcvJTf8YQYNvZrn9FCQSu+IbxCPhD4vpKgkCqRgQCvZwgHNIEA1b8cxE4gyqe0l4izhJNmRVJAAhQXiIoOmUdtzMB/FUQxAmTpOIAAM3aZBtsJAYIvHLvCtjLhCmn7pkdJuGMTE777+m+XDqK5LFawo7/hB6YrGrNi3WxuOVsKWAQ/KoDKKZmwspQi7BeXT6wobUDd3WklJTloIHhN6HtNk+Thvzllmy5aVV14u43LqPHPe7Ym3Sy03QTHL6MHvL2VrOsjCGH1NAXI7qSCnt299KpwPKycaIRitcM8RDJoDr++JN9nAicIlJboqoX+6SAPgyxVD7h2eQVVvmoNPOKjcHvYUpmEmqZt0de/eFtd5H0gKYqSXboYazTcI1GVofaSiwr46IYHTegHmtvoAwAbL7+98KEYCVDO73639I1jtD1x4eZFc+Nmvy80v89mHw9UErbbxuFHeeK6PGoFCxk5uoWMct3Gmo/E1TILG8cjw1cXIwII3fL/pUa6rb6D6aDcjeJtHUIgYbW+mKbALd3XkCqdpQoVkI/vubipNUklb16qEegJ5QopDM/2S7swIA+elHUF1Om+l2YF/JCcWxfS555sS7ICQoZq0BeYiTY8g6KhgQrjklCugoJ370LYXkOZ3fTTna3kNv4BEKwBSYMdERZddiVBVPQRIxwMEPLoTy0ALBB0hQdlr8UMTjCUQkHVpS24r02FBjHr091WSdGski0+0kQiRPK+pqCPgUQLSdIqIT0YGYYl52cKNSFDhxaQIirZnxrkbJqK6vlxzouK5cvkBFGu3ibbGRkPoH0pX0KLxJJ0II30fWl/M4iPUvc1Oxw2szcaQ/Sz2xDcImOVhGNco+tKcXK0b6l2UhWZhBxCzgRA41DCtm7S7CukhqByz9HXKDrmC0nQ/0Y8UZBaAEUs15Akj0g10bjmiDIUYN5RQp5xT+OD+wUqiqOAhss9tapmf9+BiAi/muOe7Q8TxI4wRGFKWhVuO3SU/Au0Jx+Tr8PJJcPUq13tav9D+w8KA6tiGnKu+AAAAABJRU5ErkJggg==";

const PLATFORM_NAME = "منصة التعليم الطبي الالكتروني بطب الأسرة والمجتمع";
const COPYRIGHT = "© Dr.sharifi.edu";

const ROLE_LABELS = { trainee: "متدرب", lecturer: "محاضر", admin: "مشرف" };
const STATUS_LABELS = { draft: "مسودة", approved: "معتمدة" };
const USER_STATUS_LABELS = {
  pending: "بانتظار الموافقة",
  approved: "مفعّل",
  rejected: "مرفوض",
};

function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Spinner() {
  return <div className="spinner" aria-label="جارِ التحميل" />;
}

function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="error-box">{message}</div>;
}

function SuccessBox({ message }) {
  if (!message) return null;
  return <div className="success-box">{message}</div>;
}

function CopyrightMark({ className = "" }) {
  return <div className={`copyright-mark ${className}`}>{COPYRIGHT}</div>;
}

function LangToggle({ className = "" }) {
  const lang = getLang();
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      title={lang === "en" ? "التبديل إلى العربية" : "Switch to English"}
      onClick={() => {
        setLang(lang === "en" ? "ar" : "en");
        window.location.reload();
      }}
    >
      🌐 {lang === "en" ? "العربية" : "English"}
    </button>
  );
}

function BackupPanel() {
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  async function download() {
    setBusy("dl");
    setErr("");
    setMsg("");
    try {
      const { blob, name } = await api.downloadBackup();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setMsg("تم تنزيل النسخة الاحتياطية.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }
  async function email() {
    setBusy("em");
    setErr("");
    setMsg("");
    try {
      const r = await api.emailBackup();
      setMsg(r.message);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="backup-panel">
      <h4 className="section-title">💾 النسخ الاحتياطي</h4>
      <p className="hint">
        تُرسل نسخة احتياطية كاملة من قاعدة البيانات تلقائياً إلى بريد المشرف في اليوم الأول من كل شهر. ويمكنك أخذ نسخة الآن.
      </p>
      <ErrorBox message={err} />
      <SuccessBox message={msg} />
      <div className="form-actions">
        <button className="btn btn-small" disabled={!!busy} onClick={download}>
          {busy === "dl" ? <Spinner /> : "⬇ تنزيل نسخة الآن"}
        </button>
        <button className="btn btn-small" disabled={!!busy} onClick={email}>
          {busy === "em" ? <Spinner /> : "📧 إرسال نسخة إلى بريدي"}
        </button>
      </div>
    </div>
  );
}

const JOB_TITLES = ["SHO", "REGISTRAR", "SENIOR REGISTRAR", "CONSULTANT", "TRAINEE"];
const PROGRAM_PRESETS = ["Urgent", "Mental", "SBFM", "Women Health", "CPD", "Flexible SBFM", "Home Care"];
const OTHER = "__other__";

function PasswordInput({ value, onChange, autoComplete, required, placeholder, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw-wrap">
      <input
        type={show ? "text" : "password"}
        dir="ltr"
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="pw-toggle"
        aria-label={show ? "إخفاء" : "إظهار"}
        title={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        onClick={(e) => {
          e.preventDefault();
          setShow((v) => !v);
        }}
      >
        {show ? "🙈" : "👁"}
      </button>
    </span>
  );
}

// Dropdown with preset options + "Others" (manual entry).
function SelectOrOther({ options, value, onChange, required, placeholder = "— اختر —", otherLabel = "Others (أخرى — إدخال يدوي)" }) {
  const isPreset = options.includes(value);
  const [otherMode, setOtherMode] = useState(!!value && !isPreset);
  useEffect(() => {
    if (value && !options.includes(value)) setOtherMode(true);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="select-other">
      <select
        required={required && !otherMode}
        value={otherMode ? OTHER : isPreset ? value : ""}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOtherMode(true);
            onChange("");
          } else {
            setOtherMode(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={OTHER}>{otherLabel}</option>
      </select>
      {otherMode && (
        <input
          required={required}
          autoFocus
          placeholder="اكتب القيمة يدوياً"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </span>
  );
}

function scheduleFileUrl(schedule, download = false) {
  if (!schedule) return "";
  return `${API_BASE}/api/programs/schedule/file?id=${schedule.id}&k=${encodeURIComponent(schedule.key)}${download ? "&download=1" : ""}`;
}

function ScheduleViewer({ program, onClose }) {
  const sch = program.schedule;
  const isPdf = /\.pdf$/i.test(sch.filename) || sch.mime === "application/pdf";
  const url = scheduleFileUrl(sch);
  const src = isPdf ? url : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  return (
    <div className="schedule-viewer">
      <div className="schedule-viewer-head">
        <strong>📅 جدول محاضرات برنامج «{program.name}»</strong>
        <div className="schedule-viewer-actions">
          <a className="btn btn-small" href={scheduleFileUrl(sch, true)} target="_blank" rel="noreferrer">
            ⬇ تحميل
          </a>
          <a className="btn btn-small" href={isPdf ? url : src} target="_blank" rel="noreferrer">
            ↗ نافذة جديدة
          </a>
          {onClose && (
            <button className="btn btn-small" onClick={onClose}>
              ✕ إغلاق
            </button>
          )}
        </div>
      </div>
      <div className="schedule-frame">
        <iframe src={src} title="schedule" />
      </div>
      <p className="hint">{sch.filename}</p>
    </div>
  );
}

/* ---------------- Personal annual report ---------------- */

function isoWeek(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function weekRange(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // Sunday-based week (Saudi work week)
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - day);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const f = (x) => x.toISOString().slice(0, 10);
  return { key: f(start), label: `${fmtDay(f(start))} – ${fmtDay(f(end))}` };
}

function PersonalReport({ isAdmin }) {
  const thisYear = Number(todayLocal().slice(0, 4));
  const [year, setYear] = useState(thisYear);
  const [employeeId, setEmployeeId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (emp, yr) => {
      setLoading(true);
      setError("");
      try {
        setData(await api.getPersonalReport({ employee_id: emp, year: yr }));
      } catch (err) {
        setData(null);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isAdmin) load("", year);
  }, [isAdmin, year, load]);

  const weeks = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    for (const l of data.lectures) {
      const w = weekRange(l.lecture_date);
      if (!map.has(w.key)) map.set(w.key, { ...w, total: 0, attended: 0 });
      const e = map.get(w.key);
      e.total += 1;
      if (l.attended) e.attended += 1;
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [data]);

  const years = [];
  for (let y = thisYear; y >= thisYear - 4; y--) years.push(y);

  return (
    <div className="personal-report">
      <form
        className="form report-filters"
        onSubmit={(e) => {
          e.preventDefault();
          load(employeeId.trim(), year);
        }}
      >
        {isAdmin && (
          <label>
            الرقم الوظيفي
            <input
              required
              dir="ltr"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="مثال: 149560"
            />
          </label>
        )}
        <label>
          السنة (ميلادي)
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {isAdmin && (
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <Spinner /> : "عرض التقرير"}
          </button>
        )}
      </form>
      <ErrorBox message={error} />
      {loading && !data && <Spinner />}
      {data && (
        <>
          <div className="report-person">
            <strong>{data.user.name}</strong>
            <span className="muted">
              {data.user.employee_id ? `الرقم الوظيفي: ${data.user.employee_id}` : ""}
              {data.user.job_title ? ` • ${data.user.job_title}` : ""}
              {data.user.hospital ? ` • ${data.user.hospital}` : ""}
            </span>
          </div>
          <div className="stats-grid report-cards">
            <div className="stat-card highlight">
              <span className="stat-value">{data.summary.attendance_percent}%</span>
              <span className="stat-label">نسبة حضور المحاضرات {data.year}</span>
              <div className="progress-bar">
                <div style={{ width: `${data.summary.attendance_percent}%` }} />
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {data.summary.attended} / {data.summary.total_lectures}
              </span>
              <span className="stat-label">محاضرات حضرها / المحاضرات المعتمدة</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{data.summary.passed}</span>
              <span className="stat-label">اختبارات اجتازها</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {data.summary.average_score == null ? "-" : `${data.summary.average_score}%`}
              </span>
              <span className="stat-label">متوسط درجات الاختبار البعدي</span>
            </div>
          </div>
          <p className="hint">
            يُعد المتدرب حاضراً للمحاضرة عند إكمالها وأداء اختبارها البعدي. يتحدث التقرير تلقائياً مع كل محاضرة، وتبقى بيانات السنة كاملة.
          </p>

          <h4 className="section-title">المتابعة الأسبوعية</h4>
          {weeks.length === 0 ? (
            <p className="muted">لا توجد محاضرات معتمدة في هذه السنة.</p>
          ) : (
            <ul className="week-list">
              {weeks.map((w) => (
                <li key={w.key}>
                  <span className="week-label">الأسبوع {w.label}</span>
                  <span className="week-bar">
                    <span style={{ width: `${Math.round((w.attended / w.total) * 100)}%` }} />
                  </span>
                  <span className="week-count">
                    {w.attended} / {w.total}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h4 className="section-title">تفاصيل المحاضرات</h4>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>المحاضرة</th>
                  <th>البرنامج</th>
                  <th>الحضور</th>
                  <th>تاريخ الإكمال</th>
                  <th>الدرجة</th>
                  <th>النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {data.lectures.map((l) => (
                  <tr key={l.id}>
                    <td>{fmtDay(l.lecture_date)}</td>
                    <td>{l.title}</td>
                    <td>{l.program_name || "-"}</td>
                    <td>{l.attended ? "✅ حضر" : l.viewed ? "🟡 بدأ ولم يكمل" : "❌ لم يحضر"}</td>
                    <td>{l.attended_at ? fmtDate(l.attended_at) : "-"}</td>
                    <td>{l.best_score == null ? "-" : `${l.best_score}%`}</td>
                    <td>{l.passed == null ? "-" : l.passed ? "ناجح" : "لم يجتز"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button className="btn btn-small" onClick={() => window.print()}>
              🖨 طباعة التقرير
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Password reset page (from email link) ---------------- */

function ResetPasswordPage({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين.");
    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setSuccess(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <LangToggle className="lang-toggle-fixed" />
        <div className="auth-logo">🔑</div>
        <h1 className="auth-title">تعيين كلمة مرور جديدة</h1>
        <ErrorBox message={error} />
        <SuccessBox message={success} />
        {success ? (
          <button className="btn btn-primary" onClick={onDone}>
            الذهاب لتسجيل الدخول
          </button>
        ) : (
          <form className="form" onSubmit={submit}>
            <label>
              كلمة المرور الجديدة
              <PasswordInput required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label>
              تأكيد كلمة المرور
              <PasswordInput required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? <Spinner /> : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- date helpers (Gregorian calendar) ---------------- */

// All dates are shown in the Gregorian (ميلادي) calendar, Saudi time.
const DATE_LOCALE = dateLocale();
const TZ = "Asia/Riyadh";

function parseDbDate(s) {
  if (!s) return null;
  const str = String(s);
  // D1 stores UTC as "YYYY-MM-DD HH:MM:SS"; ISO strings may already carry a zone.
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(str) ? str : str.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(s) {
  if (!s) return "-";
  const d = parseDbDate(s);
  if (!d) return s;
  return d.toLocaleDateString(DATE_LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
function fmtDateTime(s) {
  if (!s) return "-";
  const d = parseDbDate(s);
  if (!d) return s;
  return d.toLocaleString(DATE_LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
// Plain calendar day stored as "YYYY-MM-DD" (e.g. availability date) → DD/MM/YYYY
function fmtDay(s) {
  if (!s) return "-";
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}
// Today in Saudi time as "YYYY-MM-DD"
function todayLocal() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}
function isLectureExpired(lecture) {
  return !!lecture.available_until && lecture.available_until < todayLocal();
}

/* ---------------- Auth ---------------- */

function AuthPage({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
    keepSignedIn: true,
  });
  const [signupForm, setSignupForm] = useState({
    first_name: "",
    last_name: "",
    employee_id: "",
    email: "",
    hospital: "",
    username: "",
    password: "",
    specialty: "",
    job_title: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.login(loginForm);
      setToken(data.token);
      onLoggedIn(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [forgotId, setForgotId] = useState("");
  async function handleForgot(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotId.trim());
      setSuccess(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fn = signupForm.first_name.trim();
    const ln = signupForm.last_name.trim();
    if (!fn || !ln) {
      setError("الرجاء إدخال الاسم الأول واسم العائلة على الأقل.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.signup({
        ...signupForm,
        first_name: fn,
        last_name: ln,
        name: `${fn} ${ln}`,
      });
      setSuccess(data.message);
      setMode("login");
      setLoginForm((f) => ({ ...f, username: signupForm.username }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <LangToggle className="lang-toggle-fixed" />
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1 className="auth-title">{PLATFORM_NAME}</h1>
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "tab active" : "tab"}
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            تسجيل الدخول
          </button>
          <button
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              setMode("signup");
              setError("");
              setSuccess("");
            }}
          >
            حساب جديد
          </button>
        </div>

        <ErrorBox message={error} />
        <SuccessBox message={success} />

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="form">
            <label>
              اسم المستخدم
              <input
                required
                dir="ltr"
                autoComplete="username"
                autoCapitalize="none"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
              />
            </label>
            <label>
              كلمة المرور
              <PasswordInput
                required
                autoComplete="current-password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={loginForm.keepSignedIn}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, keepSignedIn: e.target.checked })
                }
              />
              إبقائي مسجّل الدخول
            </label>
            <button
              className="btn btn-primary"
              disabled={loading}
              type="submit"
            >
              {loading ? <Spinner /> : "دخول"}
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setMode("forgot");
                setError("");
                setSuccess("");
              }}
            >
              نسيت كلمة المرور؟
            </button>
          </form>
        ) : mode === "forgot" ? (
          <form onSubmit={handleForgot} className="form">
            <p className="hint">
              أدخل اسم المستخدم أو البريد الإلكتروني المسجل، وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.
            </p>
            <label>
              اسم المستخدم أو البريد الإلكتروني
              <input
                required
                dir="ltr"
                autoCapitalize="none"
                value={forgotId}
                onChange={(e) => setForgotId(e.target.value)}
              />
            </label>
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? <Spinner /> : "إرسال رابط إعادة التعيين"}
            </button>
            <button type="button" className="link-btn" onClick={() => setMode("login")}>
              ← العودة لتسجيل الدخول
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="form">
            <div className="form-row-2">
              <label>
                الاسم الأول *
                <input
                  required
                  autoComplete="given-name"
                  value={signupForm.first_name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, first_name: e.target.value })
                  }
                />
              </label>
              <label>
                اسم العائلة *
                <input
                  required
                  autoComplete="family-name"
                  value={signupForm.last_name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, last_name: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              الرقم الوظيفي *
              <input
                required
                inputMode="numeric"
                value={signupForm.employee_id}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, employee_id: e.target.value })
                }
              />
            </label>
            <label>
              البريد الإلكتروني *
              <input
                required
                type="email"
                dir="ltr"
                autoComplete="email"
                placeholder="name@example.com"
                value={signupForm.email}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, email: e.target.value })
                }
              />
            </label>
            <label>
              اسم المستشفى / المنشأة *
              <input
                required
                value={signupForm.hospital}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, hospital: e.target.value })
                }
              />
            </label>
            <label>
              اسم المستخدم *
              <input
                required
                dir="ltr"
                autoComplete="username"
                autoCapitalize="none"
                value={signupForm.username}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, username: e.target.value })
                }
              />
            </label>
            <label>
              كلمة المرور *
              <PasswordInput
                required
                autoComplete="new-password"
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, password: e.target.value })
                }
              />
            </label>
            <div className="form-row-2">
              <label>
                التخصص
                <input
                  value={signupForm.specialty}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, specialty: e.target.value })
                  }
                />
              </label>
              <label>
                المسمى الوظيفي
                <SelectOrOther
                  options={JOB_TITLES}
                  value={signupForm.job_title}
                  onChange={(v) => setSignupForm({ ...signupForm, job_title: v })}
                />
              </label>
            </div>
            <p className="hint">
              سيتم إنشاء حسابك كمتدرب، وينتظر موافقة المشرف قبل تفعيله.
            </p>
            <button
              className="btn btn-primary"
              disabled={loading}
              type="submit"
            >
              {loading ? <Spinner /> : "إنشاء الحساب"}
            </button>
          </form>
        )}
        <CopyrightMark className="auth-copyright" />
      </div>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function ProfilePage({ user, onUpdated, mustComplete = false }) {
  const [form, setForm] = useState({
    name: user.name || "",
    password: "",
    employee_id: user.employee_id || "",
    email: user.email || "",
    hospital: user.hospital || "",
    department: user.department || "",
    specialty: user.specialty || "",
    job_title: user.job_title || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setLoading(false);
      setError("البريد الإلكتروني مطلوب — الرجاء إدخال بريد صحيح.");
      return;
    }
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const data = await api.updateProfile(payload);
      onUpdated(data.user);
      setSuccess("تم حفظ التعديلات بنجاح.");
      setForm((f) => ({ ...f, password: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2>الملف الشخصي</h2>
      {mustComplete && (
        <div className="notice-box">
          📧 الرجاء إضافة بريدك الإلكتروني لإكمال بيانات حسابك. سيُستخدم لإرسال
          إشعارات المنصة (مثل اعتماد الحساب) وشهادات الحضور.
        </div>
      )}
      <ErrorBox message={error} />
      <SuccessBox message={success} />
      <form className="form form-grid" onSubmit={handleSubmit}>
        <label>
          الاسم الكامل
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          كلمة مرور جديدة (اختياري)
          <PasswordInput
            autoComplete="new-password"
            placeholder="اتركه فارغاً لعدم التغيير"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label>
          الرقم الوظيفي
          <input
            inputMode="numeric"
            value={form.employee_id}
            onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
          />
        </label>
        <label>
          البريد الإلكتروني *
          <input
            type="email"
            dir="ltr"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          اسم المستشفى / المنشأة
          <input
            value={form.hospital}
            onChange={(e) => setForm({ ...form, hospital: e.target.value })}
          />
        </label>
        <label>
          القسم / الجهة
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </label>
        <label>
          التخصص
          <input
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />
        </label>
        <label>
          المسمى الوظيفي
          <SelectOrOther
            options={JOB_TITLES}
            value={form.job_title}
            onChange={(v) => setForm({ ...form, job_title: v })}
          />
        </label>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? <Spinner /> : "حفظ"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Lecture form (create/edit) ---------------- */

const emptyMcq = () => ({
  question_text: "",
  options: ["", "", "", ""],
  correct: 0,
});

function ShortQuizBuilder({ questions, setQuestions }) {
  function update(qi, patch) {
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));
  }
  function updateOption(qi, oi, value) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) }
          : q,
      ),
    );
  }
  return (
    <div className="short-quiz-builder">
      {questions.map((q, qi) => (
        <div className="question-card" key={qi}>
          <label>
            السؤال {qi + 1}
            <input
              value={q.question_text}
              placeholder="نص السؤال"
              onChange={(e) => update(qi, { question_text: e.target.value })}
            />
          </label>
          <div className="options-list">
            {q.options.map((opt, oi) => (
              <div className="option-row" key={oi}>
                <input
                  type="radio"
                  name={`mcq-correct-${qi}`}
                  checked={q.correct === oi}
                  onChange={() => update(qi, { correct: oi })}
                  title="الإجابة الصحيحة"
                />
                <input
                  placeholder={`الخيار ${["أ", "ب", "ج", "د"][oi]}`}
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="hint">اختر الدائرة بجانب الإجابة الصحيحة.</p>
        </div>
      ))}
    </div>
  );
}

function validateShortQuiz(questions) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question_text.trim()) return `الرجاء كتابة نص السؤال ${i + 1}.`;
    const filled = q.options.filter((o) => o.trim()).length;
    if (filled < 2) return `السؤال ${i + 1}: أدخل خيارين على الأقل.`;
    if (!q.options[q.correct]?.trim())
      return `السؤال ${i + 1}: الإجابة الصحيحة المختارة فارغة.`;
  }
  return "";
}

function shortQuizPayload(lectureId, title, questions) {
  return {
    lecture_id: lectureId,
    title: `اختبار قصير: ${title}`,
    pass_score: 60,
    allow_retake: true,
    questions: questions.map((q) => {
      const options = [];
      q.options.forEach((o, i) => {
        if (o.trim()) options.push({ text: o.trim(), correct: i === q.correct });
      });
      return { question_text: q.question_text.trim(), type: "single", options };
    }),
  };
}

function quizToMcqs(quiz) {
  return (quiz?.questions || []).map((q) => {
    const opts = (q.options || []).map((o) => o.text || "");
    const correct = Math.max(0, (q.options || []).findIndex((o) => o.correct));
    while (opts.length < 4) opts.push("");
    return { question_text: q.question_text || "", options: opts.slice(0, Math.max(4, opts.length)), correct };
  });
}

function generatedToMcqs(list) {
  return list.map((q) => {
    const opts = (q.options || []).slice(0, 4);
    while (opts.length < 4) opts.push("");
    return { question_text: q.question || "", options: opts, correct: q.correct || 0 };
  });
}

function deckToText(deck) {
  return (deck?.slides || [])
    .map((sl, i) => [`Slide ${i + 1}: ${sl.title || ""}`, ...(sl.bullets || []), sl.narration || ""].filter(Boolean).join("\n"))
    .join("\n\n");
}

function QuizGenerator({ deck, title, onGenerated }) {
  const [open, setOpen] = useState(false);
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const deckText = deckToText(deck);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      const slides = await parsePptx(file);
      setFileText(deckToText({ slides }));
      setFileName(file.name);
    } catch (err) {
      setError(err.message);
    }
  }

  async function generate() {
    const text = [deckText, fileText, pasted].filter((t) => t && t.trim()).join("\n\n");
    setError("");
    setInfo("");
    if (text.trim().length < 80) {
      setError("أرفق ملف المحاضرة (PowerPoint) أو الصق نصها أولاً — النص الحالي غير كافٍ.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.generateQuiz({ text, title, count: 3 });
      onGenerated(generatedToMcqs(res.questions));
      setInfo("تم إنشاء الأسئلة ✓ — راجعها وعدّلها بالأسفل قبل الحفظ.");
    } catch (err) {
      setError(
        err.status === 503
          ? "خدمة الذكاء الاصطناعي غير مفعّلة بعد على الخادم. يمكنك كتابة الأسئلة يدوياً الآن."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="quiz-generator">
      {!open ? (
        <button type="button" className="btn btn-ai" onClick={() => setOpen(true)}>
          ✨ إنشاء الأسئلة تلقائياً من المحاضرة
        </button>
      ) : (
        <div className="quiz-generator-box">
          <strong>✨ إنشاء أسئلة الاختبار البعدي بالذكاء الاصطناعي</strong>
          <p className="hint">
            يقرأ النظام محتوى المحاضرة ويقترح 3 أسئلة اختيار من متعدد مع الإجابات الصحيحة، ثم يمكنك تعديلها.
          </p>
          <ul className="gen-sources">
            {deckText ? (
              <li>✅ نص الشرائح الصوتية المرفقة ({deck.slides.length} شريحة)</li>
            ) : null}
            <li>
              <label className="btn btn-small file-btn">
                📎 {fileName ? "تغيير ملف PowerPoint" : "إرفاق ملف المحاضرة (PowerPoint ‎.pptx)"}
                <input type="file" accept=".pptx" hidden onChange={onFile} />
              </label>
              {fileName && <span className="muted"> {fileName} ✓</span>}
            </li>
          </ul>
          <label>
            أو الصق نص المحاضرة / الملخص (اختياري)
            <textarea rows={4} value={pasted} onChange={(e) => setPasted(e.target.value)} />
          </label>
          <ErrorBox message={error} />
          {info && <div className="success-box">{info}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-ai" disabled={busy} onClick={generate}>
              {busy ? <Spinner /> : "✨ إنشاء الأسئلة"}
            </button>
            <button type="button" className="btn btn-small" onClick={() => setOpen(false)}>
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SlidesEditor({ deck, setDeck }) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setParsing(true);
    try {
      const slides = await parsePptx(file);
      setDeck({ voice: normalizeVoice(deck?.voice), file_name: file.name, slides });
      setOpen(true);
    } catch (err) {
      setError(err.message || "تعذّرت قراءة الملف.");
    } finally {
      setParsing(false);
    }
  }

  function updateNarration(i, value) {
    setDeck((d) => ({
      ...d,
      slides: d.slides.map((s, j) => (j === i ? { ...s, narration: value } : s)),
    }));
  }

  return (
    <div className="slides-editor">
      <div className="links-header">
        <span>🎙 عرض الشرائح بصوت الذكاء الاصطناعي</span>
      </div>
      <p className="hint">
        ارفع ملف PowerPoint (‎.pptx) وستُعرض الشرائح للمتدرب واحدة تلو الأخرى مع
        قراءة صوتية. تُقرأ ملاحظات المتحدث (Speaker Notes) إن وُجدت، وإلا يُقرأ نص
        الشريحة، ويمكنك تعديل النص المقروء لكل شريحة.
      </p>
      <ErrorBox message={error} />
      <div className="slides-editor-row">
        <label className="btn btn-small file-btn">
          {parsing ? "جارِ قراءة الملف…" : deck ? "استبدال الملف" : "📤 رفع ملف PowerPoint"}
          <input
            type="file"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleFile}
            disabled={parsing}
            hidden
          />
        </label>
        {deck && (
          <>
            <select
              value={normalizeVoice(deck.voice)}
              onChange={(e) => setDeck({ ...deck, voice: e.target.value })}
              aria-label="نوع الصوت"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={() => setDeck(null)}
            >
              إزالة الشرائح
            </button>
          </>
        )}
      </div>
      {deck && (
        <div className="slides-summary">
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "▲" : "▼"} {deck.file_name || "الشرائح"} — {deck.slides.length} شريحة
          </button>
          {open && (
            <ol className="narration-list">
              {deck.slides.map((s, i) => (
                <li key={i}>
                  <strong>{s.title || `شريحة ${i + 1}`}</strong>
                  <textarea
                    rows={3}
                    value={s.narration}
                    placeholder={defaultNarration(s)}
                    onChange={(e) => updateNarration(i, e.target.value)}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function LectureForm({ programs, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    title: initial?.title || "",
    description: initial?.description || "",
    program_id: initial?.program_id || "",
    topic: initial?.topic || "",
    lecturer_name: initial?.lecturer_name || "",
    video_url: initial?.video_url || "",
    slides_url: initial?.slides_url || "",
    available_until: initial?.available_until || "",
    extra_links: initial?.extra_links?.length ? initial.extra_links : [],
  }));
  const [deck, setDeck] = useState(initial?.slides || null);
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [lecturers, setLecturers] = useState([]);
  useEffect(() => {
    api
      .getLecturers()
      .then((d) => setLecturers(d.lecturers || []))
      .catch(() => {});
  }, []);
  const [mcqs, setMcqs] = useState([emptyMcq(), emptyMcq(), emptyMcq()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initial?.id) return;
    api
      .getQuizzes(initial.id)
      .then((d) => {
        const q = d.quizzes[0];
        if (q) {
          setExistingQuiz(q);
          const list = quizToMcqs(q);
          if (list.length) setMcqs(list);
        }
      })
      .catch(() => {});
  }, [initial?.id]);

  function addLink() {
    setForm((f) => ({
      ...f,
      extra_links: [...f.extra_links, { label: "", url: "" }],
    }));
  }
  function updateLink(idx, key, value) {
    setForm((f) => {
      const links = [...f.extra_links];
      links[idx] = { ...links[idx], [key]: value };
      return { ...f, extra_links: links };
    });
  }
  function removeLink(idx) {
    setForm((f) => ({
      ...f,
      extra_links: f.extra_links.filter((_, i) => i !== idx),
    }));
  }

  function applyGenerated(list) {
    const hasContent = mcqs.some((q) => q.question_text.trim());
    if (hasContent && !window.confirm("سيتم استبدال الأسئلة الحالية بالأسئلة الجديدة. متابعة؟")) return;
    setMcqs(list);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.video_url.trim() && !form.slides_url.trim() && !deck) {
      setError("أضف محتوى علمياً واحداً على الأقل: رابط فيديو، أو رابط محاضرة PowerPoint، أو ملف شرائح صوتية.");
      return;
    }
    if (!form.program_id) {
      setError("الرجاء اختيار البرنامج التدريبي الذي تتبع له المحاضرة.");
      return;
    }
    const quizMsg = validateShortQuiz(mcqs);
    if (quizMsg) {
      setError(quizMsg);
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, slides: deck };
      let lectureId = form.id;
      if (form.id) {
        await api.updateLecture(payload);
      } else {
        const res = await api.createLecture(payload);
        lectureId = res.id;
      }
      if (lectureId) {
        const payload = shortQuizPayload(lectureId, form.title, mcqs);
        if (existingQuiz) {
          await api.updateQuiz({ id: existingQuiz.id, questions: payload.questions });
        } else {
          await api.createQuiz(payload);
        }
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form form-grid" onSubmit={handleSubmit}>
      <ErrorBox message={error} />
      <label>
        عنوان المحاضرة
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>
      <label>
        البرنامج التدريبي *
        <select
          required
          value={form.program_id}
          onChange={(e) => setForm({ ...form, program_id: e.target.value })}
        >
          <option value="">— اختر البرنامج التدريبي —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        اسم المحاضر
        <input
          list="lecturer-options"
          value={form.lecturer_name}
          placeholder="اختر من القائمة أو اكتب الاسم يدوياً"
          onChange={(e) => setForm({ ...form, lecturer_name: e.target.value })}
        />
        <datalist id="lecturer-options">
          {lecturers.map((l) => (
            <option key={l.username} value={l.name} />
          ))}
        </datalist>
        <span className="hint">
          اختر محاضراً مسجلاً في المنصة أو اكتب اسم محاضر من خارجها. إذا تُرك فارغاً يُستخدم اسمك.
        </span>
      </label>
      <label>
        الموضوع / المحور
        <input
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
        />
      </label>
      <label>
        متاحة للمتدربين حتى تاريخ (ميلادي)
        <input
          type="date"
          value={form.available_until}
          min={form.id ? undefined : todayLocal()}
          onChange={(e) =>
            setForm({ ...form, available_until: e.target.value })
          }
        />
        <span className="hint">
          {form.available_until
            ? `تختفي المحاضرة عن المتدربين بعد ${fmtDay(form.available_until)}`
            : "اتركه فارغاً لإتاحتها بدون تاريخ انتهاء"}
        </span>
      </label>
      <label className="full">
        الوصف
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label>
        رابط الفيديو (يوتيوب أو غيره)
        <input
          dir="ltr"
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          placeholder="https://..."
        />
      </label>
      <label>
        رابط محاضرة PowerPoint / PDF
        <input
          dir="ltr"
          value={form.slides_url}
          onChange={(e) => setForm({ ...form, slides_url: e.target.value })}
          placeholder="https://..."
        />
        <span className="hint">
          رابط عام لملف ‎.pptx أو PDF أو Google Slides — يُعرض داخل المنصة.
        </span>
      </label>

      <div className="full">
        <SlidesEditor deck={deck} setDeck={setDeck} />
      </div>

      <div className="full">
        <div className="links-header">
          <span>روابط إضافية</span>
          <button type="button" className="btn btn-small" onClick={addLink}>
            + إضافة رابط
          </button>
        </div>
        {form.extra_links.map((link, idx) => (
          <div className="link-row" key={idx}>
            <input
              placeholder="عنوان الرابط"
              value={link.label}
              onChange={(e) => updateLink(idx, "label", e.target.value)}
            />
            <input
              dir="ltr"
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(idx, "url", e.target.value)}
            />
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={() => removeLink(idx)}
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <div className="full short-quiz-section">
        <div className="links-header">
          <span>📝 الاختبار البعدي Post-test (3 أسئلة اختيار من متعدد) *</span>
        </div>
        <p className="hint">
          إلزامي: يظهر للمتدرب بعد إكمال محتوى المحاضرة (الفيديو، محاضرة PowerPoint، أو الشرائح الصوتية).
          {existingQuiz ? " يمكنك تعديل الأسئلة والإجابات هنا ثم الحفظ." : ""}
        </p>
        <QuizGenerator deck={deck} title={form.title} onGenerated={applyGenerated} />
        <ShortQuizBuilder questions={mcqs} setQuestions={setMcqs} />
      </div>

      <p className="hint full">
        {form.id
          ? 'حفظ التعديل سيعيد المحاضرة إلى حالة "مسودة" لمراجعتها من جديد (إلا إذا كنت مشرفاً).'
          : "ستُحفظ المحاضرة كمسودة بانتظار اعتماد المشرف."}
      </p>

      <div className="form-actions full">
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? <Spinner /> : "حفظ"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

/* ---------------- Quiz form (create) ---------------- */

function QuizForm({ lectureId, onSaved, onCancel }) {
  const [title, setTitle] = useState("");
  const [passScore, setPassScore] = useState(60);
  const [allowRetake, setAllowRetake] = useState(true);
  const [questions, setQuestions] = useState([
    {
      question_text: "",
      type: "single",
      options: [
        { text: "", correct: false },
        { text: "", correct: false },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      {
        question_text: "",
        type: "single",
        options: [
          { text: "", correct: false },
          { text: "", correct: false },
        ],
      },
    ]);
  }
  function removeQuestion(qi) {
    setQuestions((qs) => qs.filter((_, i) => i !== qi));
  }
  function updateQuestion(qi, key, value) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, [key]: value } : q)),
    );
  }
  function addOption(qi) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? { ...q, options: [...q.options, { text: "", correct: false }] }
          : q,
      ),
    );
  }
  function updateOption(qi, oi, key, value) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.map((o, j) => {
          if (j !== oi) {
            // for single/truefalse type, only one option can be correct
            if (key === "correct" && value === true && q.type !== "multiple")
              return { ...o, correct: false };
            return o;
          }
          return { ...o, [key]: value };
        });
        return { ...q, options };
      }),
    );
  }
  function removeOption(qi, oi) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q,
      ),
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.createQuiz({
        lecture_id: lectureId,
        title,
        pass_score: Number(passScore),
        allow_retake: allowRetake,
        questions,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <ErrorBox message={error} />
      <label>
        عنوان الاختبار
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          درجة النجاح (%)
          <input
            type="number"
            min="0"
            max="100"
            value={passScore}
            onChange={(e) => setPassScore(e.target.value)}
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={allowRetake}
            onChange={(e) => setAllowRetake(e.target.checked)}
          />
          السماح بإعادة المحاولة
        </label>
      </div>

      {questions.map((q, qi) => (
        <div className="question-card" key={qi}>
          <div className="links-header">
            <strong>السؤال {qi + 1}</strong>
            {questions.length > 1 && (
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => removeQuestion(qi)}
              >
                حذف السؤال
              </button>
            )}
          </div>
          <label>
            نص السؤال
            <input
              required
              value={q.question_text}
              onChange={(e) =>
                updateQuestion(qi, "question_text", e.target.value)
              }
            />
          </label>
          <label>
            نوع السؤال
            <select
              value={q.type}
              onChange={(e) => updateQuestion(qi, "type", e.target.value)}
            >
              <option value="single">اختيار واحد</option>
              <option value="multiple">اختيار متعدد</option>
              <option value="truefalse">صح / خطأ</option>
            </select>
          </label>
          <div className="options-list">
            {q.options.map((opt, oi) => (
              <div className="option-row" key={oi}>
                <input
                  type={q.type === "multiple" ? "checkbox" : "radio"}
                  name={`correct-${qi}`}
                  checked={!!opt.correct}
                  onChange={(e) =>
                    updateOption(qi, oi, "correct", e.target.checked)
                  }
                />
                <input
                  placeholder={`الخيار ${oi + 1}`}
                  value={opt.text}
                  onChange={(e) => updateOption(qi, oi, "text", e.target.value)}
                />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => removeOption(qi, oi)}
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
            {q.type !== "truefalse" && (
              <button
                type="button"
                className="btn btn-small"
                onClick={() => addOption(qi)}
              >
                + إضافة خيار
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-small" onClick={addQuestion}>
        + إضافة سؤال جديد
      </button>

      <div className="form-actions">
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? <Spinner /> : "حفظ الاختبار"}
        </button>
        <button className="btn" type="button" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </form>
  );
}

/* ---------------- Quiz taking (trainee) ---------------- */

/* ---------------- Attendance certificate (PDF via print) ---------------- */

function escapeHtml(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function certificateNumber(lectureId, attemptId) {
  return `FCM-${String(lectureId).padStart(4, "0")}-${String(attemptId).padStart(5, "0")}`;
}

function openCertificate({ user, lecture, attempt }) {
  const w = window.open("", "_blank");
  if (!w) {
    window.alert("الرجاء السماح بالنوافذ المنبثقة لهذا الموقع لتحميل الشهادة.");
    return;
  }
  const e = escapeHtml;
  const no = certificateNumber(lecture.id, attempt.id);
  const details = [
    user.employee_id ? `الرقم الوظيفي: <b>${e(user.employee_id)}</b>` : "",
    user.hospital ? `المنشأة: <b>${e(user.hospital)}</b>` : "",
  ].filter(Boolean).join(" &nbsp;•&nbsp; ");
  w.document.open();
  w.document.write(`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>شهادة حضور - ${e(user.name)} - ${e(no)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #e5ecea; font-family: "Tajawal", "Segoe UI", Tahoma, sans-serif; color: #1f2937; }
  .toolbar { display: flex; gap: 8px; justify-content: center; padding: 12px; }
  .toolbar button { font: inherit; font-weight: 700; padding: 10px 18px; border-radius: 8px; border: 0; background: #0f766e; color: #fff; cursor: pointer; }
  .toolbar .hint { align-self: center; color: #475569; font-size: 14px; }
  .page { width: 297mm; height: 210mm; margin: 0 auto 16px; background: #fff; padding: 12mm; box-shadow: 0 4px 18px rgba(0,0,0,.12); }
  .frame { height: 100%; border: 3px solid #0f766e; outline: 1px solid #99c9c2; outline-offset: -9px; border-radius: 6px; padding: 12mm 18mm; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; }
  .head { display: flex; align-items: center; gap: 14px; }
  .head img { width: 64px; height: 60px; object-fit: contain; }
  .platform { font-weight: 700; color: #115e59; font-size: 18px; }
  h1 { margin: 10mm 0 2mm; font-size: 40px; font-weight: 800; color: #0f766e; letter-spacing: 1px; }
  .en { font-size: 16px; color: #64748b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 7mm; }
  .line { font-size: 19px; margin: 1.5mm 0; }
  .name { font-size: 34px; font-weight: 800; color: #111827; margin: 3mm 0 2mm; border-bottom: 2px solid #f59e0b; padding: 0 10mm 2mm; }
  .details { font-size: 16px; color: #475569; margin-bottom: 4mm; }
  .title { font-size: 24px; font-weight: 700; color: #115e59; margin: 2mm 0 3mm; }
  .score { display: inline-block; background: #f0fdfa; border: 1px solid #99c9c2; border-radius: 999px; padding: 1.5mm 6mm; font-weight: 700; color: #0f766e; }
  .foot { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; font-size: 14px; color: #475569; }
  .foot .box { text-align: center; min-width: 60mm; }
  .foot .sig { border-top: 1px solid #94a3b8; margin-top: 12mm; padding-top: 2mm; }
  .no { font-family: monospace; direction: ltr; font-size: 14px; color: #334155; }
  @media screen and (max-width: 1100px) {
    .page { transform-origin: top center; transform: scale(calc(100vw / 1180)); margin-bottom: calc((100vw / 1180 - 1) * 210mm); }
  }
  @media print {
    html, body { background: #fff; }
    .toolbar { display: none; }
    .page { margin: 0; box-shadow: none; transform: none !important; }
  }
</style></head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">⬇ حفظ PDF / طباعة</button>
    <span class="hint">اختر «حفظ بتنسيق PDF» (Save as PDF) من نافذة الطباعة</span>
  </div>
  <div class="page"><div class="frame">
    <div class="head"><img src="${PROGRAM_LOGO}" alt=""><div class="platform">${e(PLATFORM_NAME)}</div></div>
    <h1>شهادة حضور</h1>
    <div class="en">Certificate of Attendance</div>
    <div class="line">تشهد ${e(PLATFORM_NAME)} بأن</div>
    <div class="name">${e(user.name)}</div>
    ${details ? `<div class="details">${details}</div>` : ""}
    <div class="line">قد أتمّ/ت حضور المحاضرة التعليمية بعنوان</div>
    <div class="title">«${e(lecture.title)}»</div>
    <div class="line" style="margin-top:3mm"><span class="score">واجتاز/ت الاختبار البعدي بنسبة ${e(attempt.score)}%</span></div>
    <div class="foot">
      <div class="box">تاريخ الإصدار<br><b>${e(fmtDate(attempt.attempted_at))}</b></div>
      <div class="box">رقم الشهادة<br><span class="no">${e(no)}</span></div>
    </div>
  </div></div>
  <script>
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body></html>`);
  w.document.close();
}

/* ---------------- Post-test attempts: one original + one retake ---------------- */

const MAX_QUIZ_ATTEMPTS = 2;

function PostTestAttempts({ quiz, attempts, onSubmitted }) {
  const [retakeOpen, setRetakeOpen] = useState(false);
  const sorted = [...attempts].sort((a, b) => Number(a.id) - Number(b.id));
  const n = sorted.length;
  const passed = sorted.find((a) => Number(a.passed) === 1);
  const last = sorted[n - 1];
  const canRetake = !passed && n > 0 && n < MAX_QUIZ_ATTEMPTS;

  if (n === 0 || (canRetake && retakeOpen)) {
    return (
      <>
        {n > 0 && (
          <p className="retake-note">
            ↻ المحاولة الثانية والأخيرة — لن تتاح إعادة أخرى بعدها.
          </p>
        )}
        <TakeQuiz key={`${quiz.id}-${n}`} quiz={quiz} alreadyAttempted={false} onSubmitted={onSubmitted} />
      </>
    );
  }

  if (passed) {
    return (
      <div className="quiz-result pass">
        <h4>🎉 اجتزت الاختبار بنجاح</h4>
        <p>
          النتيجة: {passed.score}%{n > 1 ? " (في المحاولة الثانية)" : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="quiz-result fail">
      <h4>لم تحقق درجة النجاح المطلوبة ({quiz.pass_score || 60}%)</h4>
      <p>
        نتيجة {n > 1 ? "المحاولة الثانية" : "المحاولة الأولى"}: {last.score}%
      </p>
      {canRetake ? (
        <>
          <p className="muted">يمكنك إعادة الاختبار مرة واحدة فقط.</p>
          <button className="btn btn-primary" onClick={() => setRetakeOpen(true)}>
            ↻ إعادة الاختبار (المحاولة الأخيرة)
          </button>
        </>
      ) : (
        <p className="muted">
          استنفدت المحاولات المتاحة (محاولة أصلية + إعادة واحدة). للمساعدة تواصل مع المشرف.
        </p>
      )}
    </div>
  );
}

/* ---------------- Leave guard (mandatory post-test) ---------------- */

let leaveGuardMessage = null;
function confirmLeave() {
  return !leaveGuardMessage || window.confirm(leaveGuardMessage);
}

function TakeQuiz({ quiz, onSubmitted, alreadyAttempted }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleAnswer(question, optionIndex) {
    setAnswers((a) => {
      const current = a[question.id] || [];
      if (question.type === "multiple") {
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...a, [question.id]: next };
      }
      return { ...a, [question.id]: [optionIndex] };
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const data = await api.attemptQuiz({ quiz_id: quiz.id, answers });
      setResult(data);
      onSubmitted && onSubmitted(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className={`quiz-result ${result.passed ? "pass" : "fail"}`}>
        <h4>
          {result.passed
            ? "🎉 اجتزت الاختبار بنجاح"
            : "لم تحقق درجة النجاح المطلوبة"}
        </h4>
        <p>
          النتيجة: {result.score}% ({result.correctCount} من {result.total})
        </p>
      </div>
    );
  }

  return (
    <div className="quiz-box">
      <h4>{quiz.title}</h4>
      {alreadyAttempted && (
        <p className="hint">
          سبق لك أداء هذا الاختبار{quiz.allow_retake ? "، ويمكنك إعادة المحاولة." : "."}
        </p>
      )}
      <ErrorBox message={error} />
      {quiz.questions.map((q, qi) => (
        <div className="question-card" key={q.id}>
          <p>
            <strong>
              {qi + 1}. {q.question_text}
            </strong>
          </p>
          {q.options.map((opt, oi) => (
            <label className="option-row" key={oi}>
              <input
                type={q.type === "multiple" ? "checkbox" : "radio"}
                name={`take-${q.id}`}
                checked={(answers[q.id] || []).includes(oi)}
                onChange={() => toggleAnswer(q, oi)}
              />
              {opt.text}
            </label>
          ))}
        </div>
      ))}
      <button
        className="btn btn-primary"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? <Spinner /> : "إرسال الإجابات"}
      </button>
    </div>
  );
}

function QuizAnswerKey({ quiz }) {
  return (
    <div className="quiz-box">
      <h4>
        {quiz.title}{" "}
        <Badge tone="info">معاينة المشرف/المحاضر — الإجابات الصحيحة</Badge>
      </h4>
      {quiz.questions.map((q, qi) => (
        <div className="question-card" key={q.id}>
          <p>
            <strong>
              {qi + 1}. {q.question_text}
            </strong>
          </p>
          {q.options.map((opt, oi) => (
            <div
              className={`option-row ${opt.correct ? "correct-answer" : ""}`}
              key={oi}
            >
              {opt.correct ? "✅" : "▫️"} {opt.text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Feedback form ---------------- */

function FeedbackForm({ lectureId }) {
  const [form, setForm] = useState({
    content_rating: 5,
    lecturer_rating: 5,
    clarity_rating: 5,
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.submitFeedback({ lecture_id: lectureId, ...form });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) return <SuccessBox message="شكراً لك، تم إرسال تقييمك." />;

  const ratingField = (key, label) => (
    <label>
      {label}
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} / 5
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <form className="form form-grid" onSubmit={handleSubmit}>
      <h4 className="full">تقييم المحاضرة</h4>
      <ErrorBox message={error} />
      {ratingField("content_rating", "تقييم المحتوى")}
      {ratingField("lecturer_rating", "تقييم المحاضر")}
      {ratingField("clarity_rating", "وضوح الشرح")}
      <label className="full">
        ملاحظات إضافية
        <textarea
          rows={2}
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
      </label>
      <div className="form-actions full">
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? <Spinner /> : "إرسال التقييم"}
        </button>
      </div>
    </form>
  );
}

/* ---------------- Watch-time tracking (trainee video views) ---------------- */

function useWatchTimeTracker(lectureId, enabled) {
  const pendingRef = useRef(0);
  useEffect(() => {
    if (!enabled || !lectureId) return undefined;
    pendingRef.current = 0;
    const flush = (secs) => {
      if (!secs || secs <= 0) return;
      api.heartbeatLecture(lectureId, secs).catch(() => {
        /* ignore */
      });
    };
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") {
        pendingRef.current += 5;
      }
      if (pendingRef.current >= 20) {
        const toSend = pendingRef.current;
        pendingRef.current = 0;
        flush(toSend);
      }
    }, 5000);
    const handleHide = () => {
      if (document.visibilityState === "hidden" && pendingRef.current > 0) {
        const toSend = pendingRef.current;
        pendingRef.current = 0;
        flush(toSend);
      }
    };
    document.addEventListener("visibilitychange", handleHide);
    window.addEventListener("pagehide", handleHide);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", handleHide);
      window.removeEventListener("pagehide", handleHide);
      flush(pendingRef.current);
      pendingRef.current = 0;
    };
  }, [lectureId, enabled]);
}

function useVideoElementWatchTime(lectureId, videoRef, enabled) {
  const pendingRef = useRef(0);
  const lastTimeRef = useRef(null);
  useEffect(() => {
    if (!enabled || !lectureId) return undefined;
    const video = videoRef.current;
    if (!video) return undefined;
    pendingRef.current = 0;
    lastTimeRef.current = null;
    const flush = () => {
      const secs = pendingRef.current;
      if (!secs || secs <= 0) return;
      pendingRef.current = 0;
      api.heartbeatLecture(lectureId, secs).catch(() => {
        /* ignore */
      });
    };
    const onTimeUpdate = () => {
      if (video.paused || video.seeking) {
        lastTimeRef.current = video.currentTime;
        return;
      }
      if (lastTimeRef.current != null) {
        const delta = video.currentTime - lastTimeRef.current;
        if (delta > 0 && delta < 2) {
          pendingRef.current += delta;
        }
      }
      lastTimeRef.current = video.currentTime;
      if (pendingRef.current >= 15) flush();
    };
    const onPauseOrEnd = () => {
      lastTimeRef.current = null;
      flush();
    };
    const onSeeking = () => {
      lastTimeRef.current = null;
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("pause", onPauseOrEnd);
    video.addEventListener("ended", onPauseOrEnd);
    video.addEventListener("seeking", onSeeking);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("pause", onPauseOrEnd);
      video.removeEventListener("ended", onPauseOrEnd);
      video.removeEventListener("seeking", onSeeking);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [lectureId, enabled, videoRef]);
}

/* ---------------- Lecture detail ---------------- */

function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]+)/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function isDirectVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());
}

// Loads the YouTube IFrame API once and resolves with window.YT
let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev && prev();
      resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return ytApiPromise;
}

// Calls onEnded when the embedded YouTube video finishes
function useYouTubeEnded(iframeRef, enabled, onEnded) {
  const cbRef = useRef(onEnded);
  cbRef.current = onEnded;
  useEffect(() => {
    if (!enabled || !iframeRef.current) return undefined;
    let player = null;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !iframeRef.current) return;
      player = new YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            if (e.data === 0) cbRef.current && cbRef.current();
          },
        },
      });
    });
    return () => {
      // Don't call player.destroy(): it removes the iframe that React owns.
      cancelled = true;
      player = null;
    };
  }, [enabled, iframeRef]);
}

// Embeddable viewer URL for a PowerPoint/PDF link (or null if it can only be opened as a link).
function toSlidesViewerUrl(url) {
  if (!url) return null;
  const u = url.trim();
  const gSlides = u.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  if (gSlides) return `https://docs.google.com/presentation/d/${gSlides[1]}/embed?start=false&loop=false`;
  const gDrive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (gDrive) return `https://drive.google.com/file/d/${gDrive[1]}/preview`;
  if (/\.(pptx?|ppsx?|docx?|xlsx?)(\?.*)?$/i.test(u))
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}`;
  if (/\.pdf(\?.*)?$/i.test(u)) return u;
  return null;
}

// Per-item completion (video / PowerPoint link / spoken slides) remembered per trainee.
const doneKey = (username, lectureId, item) => `edu_done_${username}_${lectureId}${item ? "_" + item : ""}`;
function readDone(username, lectureId, item) {
  try {
    return (
      localStorage.getItem(doneKey(username, lectureId, item)) === "1" ||
      localStorage.getItem(doneKey(username, lectureId)) === "1" // older "all done" flag
    );
  } catch (e) {
    return false;
  }
}
function writeDone(username, lectureId, item) {
  try {
    localStorage.setItem(doneKey(username, lectureId, item), "1");
  } catch (e) {
    /* ignore */
  }
}

const CONTENT_LABELS = {
  video: "مشاهدة الفيديو",
  ppt: "الاطلاع على محاضرة PowerPoint",
  deck: "الاستماع لعرض الشرائح الصوتي",
};

function LectureDetail({ lecture, user, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [attemptedQuizIds, setAttemptedQuizIds] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isTrainee = user.role === "trainee";
  const canModerate = user.role === "admin" || user.role === "lecturer";
  const embed = toEmbedUrl(lecture.video_url);
  const directVideo =
    !embed && isDirectVideoUrl(lecture.video_url) ? lecture.video_url : null;
  const externalVideo = !embed && !directVideo && lecture.video_url;
  const hasSlides = !!lecture.slides?.slides?.length;
  const pptViewer = toSlidesViewerUrl(lecture.slides_url);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const quizRef = useRef(null);
  const expired = isLectureExpired(lecture);

  // Every content type in the lecture must be completed before the post-test opens.
  const items = useMemo(() => {
    const list = [];
    if (lecture.video_url) list.push("video");
    if (lecture.slides_url) list.push("ppt");
    if (hasSlides) list.push("deck");
    return list;
  }, [lecture.video_url, lecture.slides_url, hasSlides]);

  const [done, setDone] = useState(() =>
    Object.fromEntries(items.map((it) => [it, readDone(user.username, lecture.id, it)])),
  );
  const [opened, setOpened] = useState({}); // external links the trainee has opened
  const [quizUnlockedByAttempt, setQuizUnlockedByAttempt] = useState(false);
  const contentDone = quizUnlockedByAttempt || items.every((it) => done[it]);
  const quizDone =
    quizzes.length > 0 && quizzes.every((q) => attemptedQuizIds.includes(q.id));
  const mustTakeQuiz = isTrainee && !loading && !expired && quizzes.length > 0 && !quizDone;

  const handleQuizSubmitted = useCallback((quizId) => {
    setAttemptedQuizIds((ids) => (ids.includes(quizId) ? ids : [...ids, quizId]));
    setQuizUnlockedByAttempt(true);
    api
      .getMyAttempts()
      .then((a) => setMyAttempts(a.attempts || []))
      .catch(() => {});
  }, []);

  // Best passing attempt for this lecture's post-test → attendance certificate.
  const passedAttempt = useMemo(() => {
    const quizIds = quizzes.map((q) => q.id);
    const passed = myAttempts.filter((a) => quizIds.includes(a.quiz_id) && Number(a.passed) === 1);
    if (!passed.length) return null;
    return passed.reduce((best, a) =>
      Number(a.score) > Number(best.score) ||
      (Number(a.score) === Number(best.score) && String(a.attempted_at) < String(best.attempted_at))
        ? a
        : best,
    );
  }, [quizzes, myAttempts]);

  // The post-test is mandatory: warn before leaving the lecture without taking it.
  useEffect(() => {
    if (!mustTakeQuiz) {
      leaveGuardMessage = null;
      return undefined;
    }
    leaveGuardMessage = contentDone
      ? "لم تؤدِّ الاختبار البعدي بعد، وهو إلزامي. هل تريد مغادرة المحاضرة دون أداء الاختبار؟"
      : "لم تُكمل المحاضرة والاختبار البعدي الإلزامي بعد. هل تريد المغادرة الآن؟";
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = leaveGuardMessage;
      return leaveGuardMessage;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      leaveGuardMessage = null;
    };
  }, [mustTakeQuiz, contentDone]);

  const goBack = () => {
    if (confirmLeave()) onBack();
  };

  const markDone = useCallback(
    (item) => {
      writeDone(user.username, lecture.id, item);
      setDone((prev) => {
        if (prev[item]) return prev;
        const next = { ...prev, [item]: true };
        if (isTrainee && items.every((it) => next[it])) {
          setTimeout(() => {
            quizRef.current &&
              quizRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        }
        return next;
      });
    },
    [user.username, lecture.id, isTrainee, items],
  );
  const markVideoDone = useCallback(() => markDone("video"), [markDone]);
  const markDeckDone = useCallback(() => markDone("deck"), [markDone]);

  useWatchTimeTracker(lecture.id, isTrainee && !!embed && !expired);
  useVideoElementWatchTime(
    lecture.id,
    videoRef,
    isTrainee && !!directVideo && !expired,
  );
  useYouTubeEnded(iframeRef, !!embed, markVideoDone);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await api.viewLecture(lecture.id);
      const q = await api.getQuizzes(lecture.id);
      setQuizzes(q.quizzes);
      if (isTrainee) {
        try {
          const a = await api.getMyAttempts();
          const ids = (a.attempts || []).map((x) => x.quiz_id);
          setAttemptedQuizIds(ids);
          setMyAttempts(a.attempts || []);
          if (q.quizzes.some((qz) => ids.includes(qz.id))) setQuizUnlockedByAttempt(true);
        } catch (e) {
          /* ignore */
        }
      }
      if (
        canModerate &&
        (lecture.lecturer_username === user.username || user.role === "admin")
      ) {
        try {
          const fb = await api.getFeedback(lecture.id);
          setFeedback(fb.feedback);
        } catch (e) {
          /* ignore */
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lecture.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (isTrainee && expired) {
    return (
      <div className="panel">
        <button className="btn btn-small" onClick={onBack}>
          → رجوع
        </button>
        <h2>{lecture.title}</h2>
        <ErrorBox message={`انتهت فترة إتاحة هذه المحاضرة بتاريخ ${fmtDay(lecture.available_until)}.`} />
      </div>
    );
  }

  const embedSrc = embed
    ? `${embed}?enablejsapi=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`
    : null;

  // Manual confirmation button for content we cannot track automatically.
  const confirmButton = (item, text, needsOpen) =>
    isTrainee && !done[item] ? (
      <button
        className="btn btn-small btn-success content-done-btn"
        disabled={needsOpen && !opened[item]}
        title={needsOpen && !opened[item] ? "افتح الرابط أولاً" : ""}
        onClick={() => markDone(item)}
      >
        ✔ {text}
      </button>
    ) : isTrainee && done[item] ? (
      <span className="content-done-tag">✔ تم</span>
    ) : null;

  return (
    <div className="panel">
      <button className="btn btn-small" onClick={goBack}>
        → رجوع
      </button>
      <h2>{lecture.title}</h2>
      <div className="meta-row">
        <Badge>{lecture.topic || "بدون موضوع محدد"}</Badge>
        <Badge tone={lecture.status === "approved" ? "success" : "warning"}>
          {STATUS_LABELS[lecture.status]}
        </Badge>
        {lecture.available_until && (
          <Badge tone={expired ? "danger" : "info"}>
            {expired ? "انتهت الإتاحة" : "متاحة حتى"} {fmtDay(lecture.available_until)}
          </Badge>
        )}
        <span className="muted">المحاضر: {lecture.lecturer_name}</span>
        <span className="muted">👁 {lecture.view_count}</span>
      </div>
      {lecture.description && (
        <p className="description">{lecture.description}</p>
      )}

      {lecture.video_url && (
        <div className="content-block">
          <div className="content-block-head">
            <h3 className="section-title">🎬 الفيديو</h3>
            {isTrainee && done.video && <span className="content-done-tag">✔ تمت المشاهدة</span>}
          </div>
          {embedSrc && (
            <div className="video-wrap">
              <iframe
                ref={iframeRef}
                src={embedSrc}
                title="video"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {directVideo && (
            <div className="video-wrap">
              <video
                ref={videoRef}
                src={directVideo}
                controls
                playsInline
                preload="metadata"
                onEnded={markVideoDone}
              />
            </div>
          )}
          {externalVideo && (
            <div className="content-actions">
              <a
                href={lecture.video_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-small"
                onClick={() => setOpened((o) => ({ ...o, video: true }))}
              >
                ▶ فتح الفيديو
              </a>
              {confirmButton("video", "أنهيت مشاهدة الفيديو", true)}
            </div>
          )}
        </div>
      )}

      {lecture.slides_url && (
        <div className="content-block">
          <div className="content-block-head">
            <h3 className="section-title">📑 محاضرة PowerPoint</h3>
            {isTrainee && done.ppt && <span className="content-done-tag">✔ تم الاطلاع</span>}
          </div>
          {pptViewer && (
            <div className="video-wrap ppt-wrap">
              <iframe src={pptViewer} title="slides" allowFullScreen />
            </div>
          )}
          <div className="content-actions">
            <a
              href={lecture.slides_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-small"
              onClick={() => setOpened((o) => ({ ...o, ppt: true }))}
            >
              {pptViewer ? "↗ فتح في نافذة جديدة" : "📑 فتح المحاضرة"}
            </a>
            {!done.ppt && confirmButton("ppt", "أنهيت الاطلاع على المحاضرة", !pptViewer)}
          </div>
        </div>
      )}

      {hasSlides && (
        <div className="content-block slides-section">
          <div className="content-block-head">
            <h3 className="section-title">🎙 عرض الشرائح الصوتي</h3>
            {isTrainee && done.deck && <span className="content-done-tag">✔ تم الاستماع</span>}
          </div>
          <SlidePlayer
            deck={lecture.slides}
            lectureId={lecture.id}
            trackTime={isTrainee}
            onComplete={markDeckDone}
          />
        </div>
      )}

      {lecture.extra_links?.length > 0 && (
        <ul className="extra-links">
          {lecture.extra_links.map((l, i) => (
            <li key={i}>
              <a href={l.url} target="_blank" rel="noreferrer">
                🔗 {l.label || l.url}
              </a>
            </li>
          ))}
        </ul>
      )}

      {loading && <Spinner />}
      <ErrorBox message={error} />

      <div ref={quizRef} />
      {!loading && isTrainee && quizzes.length > 0 && (
        <div className={`posttest-card ${quizDone ? "is-done" : contentDone ? "is-open" : "is-locked"}`}>
          <div className="posttest-head">
            <span className="posttest-icon" aria-hidden="true">
              {quizDone ? "✅" : contentDone ? "📝" : "🔒"}
            </span>
            <div className="posttest-title">
              <strong>{getLang() === "en" ? "Post-test" : <>الاختبار البعدي <bdi>(Post-test)</bdi></>}</strong>
              <span className="posttest-sub">
                {quizDone
                  ? "تم أداء الاختبار"
                  : contentDone
                    ? "أجب عن الأسئلة ثم أرسل إجاباتك"
                    : "يُفتح بعد إكمال محتوى المحاضرة"}
              </span>
            </div>
            <Badge tone={quizDone ? "success" : "danger"}>إلزامي</Badge>
          </div>
          {!contentDone && (
            <ul className="content-checklist">
              {items.map((it) => (
                <li key={it} className={done[it] ? "done" : ""}>
                  {done[it] ? "✅" : "⬜"} {CONTENT_LABELS[it]}
                </li>
              ))}
            </ul>
          )}
          {contentDone &&
            quizzes.map((quiz) => (
              <PostTestAttempts
                key={quiz.id}
                quiz={quiz}
                attempts={myAttempts.filter((a) => a.quiz_id === quiz.id)}
                onSubmitted={() => handleQuizSubmitted(quiz.id)}
              />
            ))}
        </div>
      )}

      {!loading && isTrainee && passedAttempt && (
        <div className="certificate-card">
          <span className="certificate-icon" aria-hidden="true">🎓</span>
          <div className="certificate-text">
            <strong>شهادة الحضور</strong>
            <span>
              اجتزت الاختبار البعدي بنسبة {passedAttempt.score}% — رقم الشهادة{" "}
              <bdi dir="ltr">{certificateNumber(lecture.id, passedAttempt.id)}</bdi>
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => openCertificate({ user, lecture, attempt: passedAttempt })}
          >
            ⬇ تحميل الشهادة PDF
          </button>
        </div>
      )}
      {!loading && isTrainee && quizDone && !passedAttempt && (
        <div className="feedback-locked">
          🎓 تُمنح شهادة الحضور عند اجتياز الاختبار البعدي بالدرجة المطلوبة.
        </div>
      )}

      {!loading && canModerate && quizzes.length > 0 && (
        <h3 className="section-title">📝 الاختبار البعدي (Post-test)</h3>
      )}
      {!loading &&
        canModerate &&
        quizzes.map((quiz) => <QuizAnswerKey key={quiz.id} quiz={quiz} />)}
      {!loading && canModerate && quizzes.length === 0 && (
        <div className="error-box">
          لا يوجد اختبار بعدي لهذه المحاضرة. أضفه من «تعديل» أو «إدارة الاختبار».
        </div>
      )}

      {!loading && isTrainee && (quizDone || quizzes.length === 0) && contentDone && (
        <FeedbackForm lectureId={lecture.id} />
      )}
      {!loading && isTrainee && quizzes.length > 0 && !quizDone && (
        <div className="feedback-locked">
          🔒 تقييم المحاضرة (Feedback) يُتاح بعد إكمال الاختبار البعدي.
        </div>
      )}

      {feedback && (
        <div className="panel-sub">
          <h4>تقييمات المتدربين ({feedback.length})</h4>
          {feedback.length === 0 && (
            <p className="muted">لا توجد تقييمات بعد.</p>
          )}
          {feedback.map((f) => (
            <div className="feedback-item" key={f.id}>
              <div className="meta-row">
                <span>المحتوى: {f.content_rating ?? "-"}/5</span>
                <span>المحاضر: {f.lecturer_rating ?? "-"}/5</span>
                <span>الوضوح: {f.clarity_rating ?? "-"}/5</span>
              </div>
              {f.comment && <p className="muted">{f.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Lecture list / card ---------------- */

function LectureCard({
  lecture,
  programs,
  onOpen,
  onEdit,
  onApprove,
  onDelete,
  showManage,
}) {
  const programName = programs.find((p) => p.id === lecture.program_id)?.name;
  return (
    <div className="lecture-card">
      <div className="lecture-card-body" onClick={() => onOpen(lecture)}>
        <h3>{lecture.title}</h3>
        <div className="meta-row">
          {programName && <Badge tone="info">{programName}</Badge>}
          <Badge tone={lecture.status === "approved" ? "success" : "warning"}>
            {STATUS_LABELS[lecture.status]}
          </Badge>
          {lecture.slides?.slides?.length > 0 && <Badge>🎙 شرائح صوتية</Badge>}
          {lecture.available_until && (
            <Badge tone={isLectureExpired(lecture) ? "danger" : "default"}>
              {isLectureExpired(lecture) ? "انتهت" : "حتى"}{" "}
              {fmtDay(lecture.available_until)}
            </Badge>
          )}
        </div>
        <p className="muted">
          المحاضر: {lecture.lecturer_name} · 👁 {lecture.view_count}
        </p>
      </div>
      {showManage && (
        <div className="lecture-card-actions">
          <button className="btn btn-small" onClick={() => onEdit(lecture)}>
            تعديل
          </button>
          {onApprove && lecture.status === "draft" && (
            <button
              className="btn btn-small btn-success"
              onClick={() => onApprove(lecture, "approved")}
            >
              اعتماد
            </button>
          )}
          {onApprove && lecture.status === "approved" && (
            <button
              className="btn btn-small"
              onClick={() => onApprove(lecture, "draft")}
            >
              إرجاع لمسودة
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-small btn-danger"
              onClick={() => onDelete(lecture)}
            >
              حذف
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Trainee dashboard ---------------- */

function TraineeDashboard({ user }) {
  const [view, setView] = useState("lectures");
  const [showSchedule, setShowSchedule] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [programFilter, setProgramFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, l] = await Promise.all([
        api.getPrograms(),
        api.getLectures(programFilter || undefined),
      ]);
      setPrograms(p.programs);
      setLectures(l.lectures);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [programFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (selected)
    return (
      <LectureDetail
        lecture={selected}
        user={user}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );

  const currentProgram = programs.find((p) => String(p.id) === String(programFilter));

  return (
    <div className="panel">
      <div className="sub-tabs">
        <button className={view === "lectures" ? "tab active" : "tab"} onClick={() => setView("lectures")}>
          📚 المحاضرات
        </button>
        <button className={view === "report" ? "tab active" : "tab"} onClick={() => setView("report")}>
          📊 تقريري السنوي
        </button>
      </div>
      {view === "report" ? (
        <PersonalReport isAdmin={false} />
      ) : (
      <>
      <h2>المحاضرات المتاحة</h2>
      <div className="toolbar">
        <label>
          اختر البرنامج التدريبي
          <select
            value={programFilter}
            onChange={(e) => {
              setProgramFilter(e.target.value);
              setShowSchedule(false);
            }}
          >
            <option value="">جميع البرامج</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {currentProgram?.schedule && !showSchedule && (
          <button className="btn btn-primary btn-small" onClick={() => setShowSchedule(true)}>
            📅 جدول المحاضرات السنوي
          </button>
        )}
      </div>
      {currentProgram && !currentProgram.schedule && (
        <p className="hint">لم يُرفق جدول محاضرات لهذا البرنامج بعد.</p>
      )}
      {currentProgram?.schedule && showSchedule && (
        <ScheduleViewer program={currentProgram} onClose={() => setShowSchedule(false)} />
      )}
      {loading && <Spinner />}
      <ErrorBox message={error} />
      {!loading && lectures.length === 0 && (
        <p className="muted">لا توجد محاضرات متاحة حالياً.</p>
      )}
      <div className="lecture-grid">
        {lectures.map((l) => (
          <LectureCard
            key={l.id}
            lecture={l}
            programs={programs}
            onOpen={setSelected}
          />
        ))}
      </div>
      </>
      )}
    </div>
  );
}

/* ---------------- Lecturer dashboard ---------------- */

function LecturerDashboard({ user }) {
  const [programs, setPrograms] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null); // 'new' | lecture obj | null
  const [managingQuiz, setManagingQuiz] = useState(null); // lecture obj
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p, l] = await Promise.all([api.getPrograms(), api.getLectures()]);
      setPrograms(p.programs);
      setLectures(l.lectures);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(lecture) {
    if (!confirm(`هل تريد حذف المحاضرة "${lecture.title}"؟`)) return;
    try {
      await api.deleteLecture(lecture.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (selected)
    return (
      <LectureDetail
        lecture={selected}
        user={user}
        onBack={() => {
          setSelected(null);
          load();
        }}
      />
    );

  if (editing) {
    return (
      <div className="panel">
        <h2>{editing === "new" ? "محاضرة جديدة" : "تعديل المحاضرة"}</h2>
        <LectureForm
          programs={programs}
          initial={editing === "new" ? null : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  if (managingQuiz) {
    return (
      <div className="panel">
        <button className="btn btn-small" onClick={() => setManagingQuiz(null)}>
          → رجوع
        </button>
        <h2>اختبار: {managingQuiz.title}</h2>
        <QuizForm
          lectureId={managingQuiz.id}
          onSaved={() => setManagingQuiz(null)}
          onCancel={() => setManagingQuiz(null)}
        />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <h2>محاضراتي</h2>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + محاضرة جديدة
        </button>
      </div>
      {loading && <Spinner />}
      <ErrorBox message={error} />
      {!loading && lectures.length === 0 && (
        <p className="muted">لم تُنشئ أي محاضرات بعد.</p>
      )}
      <div className="lecture-grid">
        {lectures.map((l) => (
          <div key={l.id} className="lecture-card-with-extra">
            <LectureCard
              lecture={l}
              programs={programs}
              onOpen={setSelected}
              onEdit={setEditing}
              onDelete={handleDelete}
              showManage
            />
            <button
              className="btn btn-small"
              onClick={() => setManagingQuiz(l)}
            >
              📝 إدارة الاختبار
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Admin dashboard ---------------- */

function StatsCards({ stats }) {
  const items = [
    ["إجمالي المستخدمين", stats.totalUsers],
    ["المستخدمون المفعّلون", stats.activeUsers],
    ["بانتظار الموافقة", stats.pendingUsers],
    ["إجمالي المحاضرات", stats.totalLectures],
    ["المحاضرات المعتمدة", stats.approvedLectures],
    ["مسودات", stats.draftLectures],
    ["إجمالي المشاهدات", stats.totalViews],
    ["متوسط درجات الاختبارات", `${stats.avgQuizScore}%`],
    ["متوسط رضا المتدربين", `${stats.avgSatisfaction}/5`],
  ];
  return (
    <div className="stats-grid">
      {items.map(([label, value]) => (
        <div className="stat-card" key={label}>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getUsers();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(u, status) {
    try {
      await api.updateUser({ username: u.username, status });
      load();
    } catch (err) {
      alert(err.message);
    }
  }
  async function sendReset(u) {
    if (!window.confirm(`إرسال رابط إعادة تعيين كلمة المرور إلى ${u.email}؟`)) return;
    try {
      const res = await api.sendResetLink(u.username);
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  }
  async function deleteUser(u) {
    if (!window.confirm(`حذف حساب «${u.name}» (${u.username}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      const data = await api.deleteUser(u.username);
      if (data?.users) setUsers(data.users);
      else load();
    } catch (err) {
      alert(err.message);
    }
  }
  async function updateRole(u, role) {
    try {
      await api.updateUser({ username: u.username, role });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <ErrorBox message={error} />
      <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>اسم المستخدم</th>
            <th>الرقم الوظيفي</th>
            <th>البريد الإلكتروني</th>
            <th>المستشفى</th>
            <th>تاريخ التسجيل</th>
            <th>الدور</th>
            <th>الحالة</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.employee_id || "-"}</td>
              <td dir="ltr">{u.email || "-"}</td>
              <td>{u.hospital || "-"}</td>
              <td>{fmtDate(u.created_at)}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u, e.target.value)}
                >
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <Badge
                  tone={
                    u.status === "approved"
                      ? "success"
                      : u.status === "pending"
                        ? "warning"
                        : "danger"
                  }
                >
                  {USER_STATUS_LABELS[u.status]}
                </Badge>
              </td>
              <td>
                {u.status !== "approved" && (
                  <button
                    className="btn btn-small btn-success"
                    onClick={() => updateStatus(u, "approved")}
                  >
                    موافقة
                  </button>
                )}
                {u.status !== "rejected" && (
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => updateStatus(u, "rejected")}
                  >
                    رفض
                  </button>
                )}
                {u.status === "rejected" && (
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => deleteUser(u)}
                  >
                    🗑 حذف الحساب
                  </button>
                )}
                {u.email && u.status !== "rejected" && (
                  <button
                    className="btn btn-small"
                    title="إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم"
                    onClick={() => sendReset(u)}
                  >
                    🔑 إعادة تعيين كلمة المرور
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("تعذّرت قراءة الملف."));
    r.readAsDataURL(file);
  });
}

function ProgramsManagement() {
  const [programs, setPrograms] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(null); // {id, name, description}
  const [viewing, setViewing] = useState(null); // program with schedule being previewed
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPrograms();
      setPrograms(data.programs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function run(fn, okMsg) {
    setError("");
    setSuccess("");
    try {
      const data = await fn();
      if (data?.programs) setPrograms(data.programs);
      setSuccess(typeof okMsg === "function" ? okMsg(data) : okMsg);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return setError("اختر اسم البرنامج أو اكتبه.");
    const ok = await run(() => api.createProgram({ name: name.trim(), description }), "تمت إضافة البرنامج.");
    if (ok) {
      setName("");
      setDescription("");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editing.name.trim()) return setError("اسم البرنامج مطلوب.");
    const ok = await run(() => api.updateProgram(editing), "تم حفظ التعديل.");
    if (ok) setEditing(null);
  }

  async function handleDelete(p) {
    if (!window.confirm(`حذف البرنامج «${p.name}»؟ المحاضرات التابعة له ستبقى لكن بدون برنامج.`)) return;
    await run(
      () => api.deleteProgram(p.id),
      (d) =>
        d?.unlinked_lectures
          ? `تم حذف البرنامج. ${d.unlinked_lectures} محاضرة أصبحت بدون برنامج — عدّلها لاختيار برنامج جديد.`
          : "تم حذف البرنامج.",
    );
  }

  async function handleUpload(p, e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|xlsx|xls|csv)$/i.test(file.name)) return setError("الصيغ المسموحة: PDF أو Excel (xlsx / xls).");
    if (file.size > 8 * 1024 * 1024) return setError("حجم الملف أكبر من 8 ميجابايت.");
    setUploadingId(p.id);
    try {
      const data = await readFileAsDataUrl(file);
      await run(
        () => api.uploadSchedule({ program_id: p.id, filename: file.name, mime: file.type || null, data }),
        `تم إرفاق جدول «${p.name}».`,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId(null);
    }
  }

  async function handleRemoveSchedule(p) {
    if (!window.confirm(`حذف جدول برنامج «${p.name}»؟`)) return;
    await run(() => api.deleteSchedule(p.id), "تم حذف الجدول.");
    if (viewing?.id === p.id) setViewing(null);
  }

  return (
    <div className="programs-admin">
      <ErrorBox message={error} />
      <SuccessBox message={success} />
      {viewing && <ScheduleViewer program={viewing} onClose={() => setViewing(null)} />}
      {loading ? (
        <Spinner />
      ) : programs.length === 0 ? (
        <p className="muted">لا توجد برامج تدريبية بعد. أضف أول برنامج بالأسفل.</p>
      ) : (
        <ul className="program-list">
          {programs.map((p) =>
            editing?.id === p.id ? (
              <li key={p.id} className="program-item editing">
                <form className="form program-edit-form" onSubmit={handleSave}>
                  <label>
                    اسم البرنامج
                    <SelectOrOther
                      options={PROGRAM_PRESETS}
                      value={editing.name}
                      onChange={(v) => setEditing({ ...editing, name: v })}
                    />
                  </label>
                  <label>
                    الوصف
                    <input
                      placeholder="وصف مختصر (اختياري)"
                      value={editing.description || ""}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                  </label>
                  <div className="program-actions">
                    <button className="btn btn-primary btn-small" type="submit">
                      حفظ
                    </button>
                    <button className="btn btn-small" type="button" onClick={() => setEditing(null)}>
                      إلغاء
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={p.id} className="program-item">
                <div className="program-text">
                  <strong>{p.name}</strong>
                  <span className="muted program-desc">{p.description || "—"}</span>
                  <span className="program-schedule">
                    {p.schedule ? (
                      <>
                        📅 {p.schedule.filename}{" "}
                        <button className="link-btn danger-link inline" onClick={() => handleRemoveSchedule(p)}>
                          (حذف الجدول)
                        </button>
                      </>
                    ) : (
                      <span className="muted">لا يوجد جدول مرفق</span>
                    )}
                  </span>
                </div>
                <div className="program-actions">
                  <label className={`btn btn-small file-btn ${uploadingId === p.id ? "disabled" : ""}`}>
                    {uploadingId === p.id ? "…جارٍ الرفع" : p.schedule ? "📎 تغيير الجدول" : "📎 إرفاق الجدول"}
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv"
                      hidden
                      disabled={uploadingId === p.id}
                      onChange={(e) => handleUpload(p, e)}
                    />
                  </label>
                  <button
                    className="btn btn-small"
                    disabled={!p.schedule}
                    title={p.schedule ? "" : "لا يوجد جدول مرفق"}
                    onClick={() => setViewing(p)}
                  >
                    👁 عرض الجدول
                  </button>
                  <button
                    className="btn btn-small"
                    onClick={() => setEditing({ id: p.id, name: p.name, description: p.description || "" })}
                  >
                    ✏️ تعديل
                  </button>
                  <button className="btn btn-danger btn-small" onClick={() => handleDelete(p)}>
                    🗑 حذف
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      <h4 className="section-title">إضافة برنامج تدريبي</h4>
      <form className="form program-add-form" onSubmit={handleAdd}>
        <label>
          اسم البرنامج *
          <SelectOrOther
            required
            options={PROGRAM_PRESETS}
            value={name}
            onChange={setName}
            placeholder="— اختر البرنامج —"
          />
        </label>
        <label>
          الوصف
          <input
            placeholder="وصف مختصر (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          + إضافة البرنامج
        </button>
      </form>
      <p className="hint">
        بعد إضافة البرنامج استخدم «📎 إرفاق الجدول» لرفع جدول المحاضرات الشهري أو السنوي (PDF أو Excel) ليطّلع عليه المتدربون.
      </p>
    </div>
  );
}

function LecturesModeration({ user, onOpen }) {
  const [programs, setPrograms] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([api.getPrograms(), api.getLectures()]);
      setPrograms(p.programs);
      setLectures(l.lectures);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(lecture, status) {
    try {
      await api.approveLecture(lecture.id, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  }
  async function handleDelete(lecture) {
    if (!confirm(`حذف المحاضرة "${lecture.title}"؟`)) return;
    try {
      await api.deleteLecture(lecture.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (editing) {
    return (
      <div>
        <button className="btn btn-small" onClick={() => setEditing(null)}>
          → رجوع
        </button>
        <LectureForm
          programs={programs}
          initial={editing === "new" ? null : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar">
        <button
          className="btn btn-primary btn-small"
          onClick={() => setEditing("new")}
        >
          + إضافة محاضرة
        </button>
      </div>
      {loading && <Spinner />}
      <ErrorBox message={error} />
      <div className="lecture-grid">
        {lectures.map((l) => (
          <LectureCard
            key={l.id}
            lecture={l}
            programs={programs}
            onOpen={onOpen}
            onEdit={setEditing}
            onApprove={handleApprove}
            onDelete={handleDelete}
            showManage
          />
        ))}
      </div>
    </div>
  );
}

function AttendanceReport() {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminReport({ from, to });
      setRows(data.report || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);
  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    ["اسم المحاضرة", (r) => r.lecture_title],
    ["اسم المتدرب", (r) => r.trainee_name],
    ["الرقم الوظيفي", (r) => r.employee_id || "-"],
    ["المستشفى", (r) => r.hospital || "-"],
    ["تاريخ نزول المحاضرة", (r) => fmtDate(r.lecture_created_at)],
    ["متاحة حتى", (r) => fmtDay(r.available_until)],
    ["تاريخ الحضور", (r) => fmtDateTime(r.first_viewed_at)],
    ["آخر مشاهدة", (r) => fmtDateTime(r.last_viewed_at)],
    ["مدة المشاهدة (دقيقة)", (r) => r.watched_minutes],
    [
      "الشرائح المسموعة",
      (r) =>
        r.slides_total
          ? `${r.slides_percent}% (${r.slides_heard}/${r.slides_total})`
          : "-",
    ],
    [
      "نتيجة الاختبار",
      (r) =>
        r.best_score == null
          ? "-"
          : `${r.best_score}% ${r.passed ? "(ناجح)" : "(لم يجتز)"}`,
    ],
  ];

  function exportCsv() {
    const esc = (v) =>
      `"${String(v ?? "").replace(/[\u200e\u200f]/g, "").replace(/"/g, '""')}"`;
    const lines = [columns.map(([h]) => esc(h)).join(",")];
    rows.forEach((r) => lines.push(columns.map(([, f]) => esc(f(r))).join(",")));
    const blob = new Blob(["\ufeff" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const range = from || to ? `_${from || "..."}_${to || "..."}` : "";
    a.download = `تقرير_المتابعة${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <ErrorBox message={error} />
      <div className="toolbar report-toolbar">
        <div className="form report-filters">
          <label>
            من تاريخ
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            إلى تاريخ
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {(from || to) && (
            <button
              className="btn btn-small"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              مسح
            </button>
          )}
        </div>
        <div className="report-actions">
          <span className="muted">
            {rows.length} سجل · التواريخ بالتقويم الميلادي
          </span>
          <button
            className="btn btn-small"
            onClick={exportCsv}
            disabled={!rows.length}
          >
            ⬇ تصدير CSV
          </button>
        </div>
      </div>
      {loading && <Spinner />}
      {!loading && rows.length === 0 && (
        <p className="muted">لا توجد بيانات مشاهدة في هذه الفترة.</p>
      )}
      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(([h]) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map(([h, f]) => (
                    <td key={h}>{f(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ user }) {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab === "stats") {
      api
        .getStats()
        .then((d) => setStats(d.stats))
        .catch((e) => setError(e.message));
    }
  }, [tab]);

  if (selected)
    return (
      <LectureDetail
        lecture={selected}
        user={user}
        onBack={() => setSelected(null)}
      />
    );

  return (
    <div className="panel">
      <div className="sub-tabs">
        <button
          className={tab === "stats" ? "tab active" : "tab"}
          onClick={() => setTab("stats")}
        >
          لوحة الإحصائيات
        </button>
        <button
          className={tab === "users" ? "tab active" : "tab"}
          onClick={() => setTab("users")}
        >
          المستخدمون
        </button>
        <button
          className={tab === "programs" ? "tab active" : "tab"}
          onClick={() => setTab("programs")}
        >
          البرامج التدريبية
        </button>
        <button
          className={tab === "lectures" ? "tab active" : "tab"}
          onClick={() => setTab("lectures")}
        >
          المحاضرات
        </button>
        <button
          className={tab === "report" ? "tab active" : "tab"}
          onClick={() => setTab("report")}
        >
          تقرير المتابعة
        </button>
        <button
          className={tab === "personal" ? "tab active" : "tab"}
          onClick={() => setTab("personal")}
        >
          التقرير الشخصي السنوي
        </button>
      </div>
      <ErrorBox message={error} />
      {tab === "stats" && (stats ? <StatsCards stats={stats} /> : <Spinner />)}
      {tab === "stats" && <BackupPanel />}
      {tab === "users" && <UsersManagement />}
      {tab === "programs" && <ProgramsManagement />}
      {tab === "lectures" && (
        <LecturesModeration user={user} onOpen={setSelected} />
      )}
      {tab === "report" && <AttendanceReport />}
      {tab === "personal" && <PersonalReport isAdmin />}
    </div>
  );
}

/* ---------------- App shell ---------------- */

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [view, setView] = useState("home"); // home | profile

  useEffect(() => {
    async function restore() {
      if (!getToken()) {
        setCheckingSession(false);
        return;
      }
      try {
        const data = await api.me();
        setUser(data.user);
      } catch (e) {
        setToken(null);
      } finally {
        setCheckingSession(false);
      }
    }
    restore();
  }, []);

  const [resetToken, setResetToken] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("reset");
    } catch (e) {
      return null;
    }
  });

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setView("home");
  }, []);

  if (resetToken) {
    return (
      <ResetPasswordPage
        token={resetToken}
        onDone={() => {
          window.history.replaceState(null, "", window.location.pathname);
          setResetToken(null);
          setToken(null);
          setUser(null);
        }}
      />
    );
  }

  if (checkingSession) {
    return (
      <div className="app-loading">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLoggedIn={setUser} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-title">
          <span className="app-header-name">{PLATFORM_NAME}</span>
        </div>
        <nav className="app-header-nav">
          <button
            className={view === "home" ? "tab active" : "tab"}
            onClick={() => confirmLeave() && setView("home")}
          >
            الرئيسية
          </button>
          <button
            className={view === "profile" ? "tab active" : "tab"}
            onClick={() => confirmLeave() && setView("profile")}
          >
            الملف الشخصي
          </button>
        </nav>
        <div className="app-header-user">
          <div className="app-header-user-row">
            <span className="app-header-username">{user.name}</span>
            <Badge tone="info">{ROLE_LABELS[user.role]}</Badge>
            <LangToggle className="btn btn-small" />
            <button
              className="btn btn-small"
              onClick={() => confirmLeave() && handleLogout()}
            >
              خروج
            </button>
          </div>
          <CopyrightMark className="header-copyright" />
        </div>
      </header>

      <main className="app-main">
        {!user.email && <ProfilePage user={user} onUpdated={setUser} mustComplete />}
        {user.email && view === "profile" && <ProfilePage user={user} onUpdated={setUser} />}
        {user.email && view === "home" && user.role === "trainee" && (
          <TraineeDashboard user={user} />
        )}
        {user.email && view === "home" && user.role === "lecturer" && (
          <LecturerDashboard user={user} />
        )}
        {user.email && view === "home" && user.role === "admin" && (
          <AdminDashboard user={user} />
        )}
      </main>
    </div>
  );
}
