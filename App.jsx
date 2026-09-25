import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api, setToken, getToken } from "./api.js";

const PROGRAM_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAAB6CAMAAABJAgv8AAABIFBMVEX+/v6YpKbO6NS3xsfN19bl6uuttrjY5uVRpmsXOjijqq2q17bEycwwdk1PmGoXZTfa9eYnR0ZyuYeWx6YtaEczVlPQ89c5mldFmVlRh2ZLaGduh4h2lo+X1aqoyLO418mHxphzp4aIt5iVt6top3pWdXO1vcFmmXmEmpm45cUaQ0J2xI5YsnOIqJWt4boZXTQjWzckZDyXnqMaQT1Fd1bW3eE3oVpGhFxFpFxotHwiOzs4gllDWVlje3sdaEAiQD04mmNjhnlEZVzj+t06ZWM5omSN0ZcVP0Q8hGBesYAbVlJJX2JmeoC58scAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADfPnBAAAAYHRSTlP///////////////////////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAEoWZuAAAJGUlEQVR42u1aaXfiuBLFli1veLfBNph9h7CEkKWT7vQ+M+/N/P+/82QCRpZEeizmnfc+UCd9EgyRrqpu3SpVulK52tWudrWrXe1qV7va1a52tav935gjGi1DvGSF2rLjPXleWuNdQOw+2/bKtu+63DjSRT1SkdUjj2+NfrAymz2/NzBXwQ3fKbzPqj91Kk7N8CLV4IjEYHXnH35u3a0GDkcoPKuTv1iqUav0Cl3bOjlQUe3m/rvRG1txHFvNvnTm8KIkSeLbb3o/UhzSwirrC38dF16PNz2xY5m2bZuZZd+7bWJ/Y75Q7+vI7u9Vb278rHeK76tqOXrW7r4WieTcBeZ6E/da+8ei1Oo+rFbx6Wiiv/hx/0P1Op3USP2Op1pRtCD2TCO/pCN6JE1te1zE1R5vjo+mXlRX53gyO6kapSTN1EEpEFZAZpT4bJO4Km3LNtHhlp5leWS8l48qlZQdtUyeymZM47IZeeqbm8H8s9WhFzfuF/Sz+rRMgptjOl1WLLEQ45XJ1CE2CONSEHb/jJ6MWc+n0aUgFPML9Wxgn1lhYLNQ1B5VSt9a9WUZYj7ckSs4z8/nsnwc9BhPvYgigFdOKAZr8tjG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";

const PLATFORM_NAME = "منصة التعليم الالكتروني بطب الأسرة و المجتمع";
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

/* ---------------- date helpers ---------------- */

function fmtDate(s) {
  if (!s) return "-";
  try {
    const d = new Date(String(s).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (e) {
    return s;
  }
}
function fmtDateTime(s) {
  if (!s) return "-";
  try {
    const d = new Date(String(s).replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return s;
  }
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
    name: "",
    username: "",
    password: "",
    department: "",
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

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await api.signup(signupForm);
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
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
              />
            </label>
            <label>
              كلمة المرور
              <input
                required
                type="password"
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
          </form>
        ) : (
          <form onSubmit={handleSignup} className="form">
            <label>
              الاسم الكامل
              <input
                required
                value={signupForm.name}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, name: e.target.value })
                }
              />
            </label>
            <label>
              اسم المستخدم
              <input
                required
                value={signupForm.username}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, username: e.target.value })
                }
              />
            </label>
            <label>
              كلمة المرور
              <input
                required
                type="password"
                value={signupForm.password}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, password: e.target.value })
                }
              />
            </label>
            <label>
              القسم / الجهة
              <input
                value={signupForm.department}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, department: e.target.value })
                }
              />
            </label>
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
              <input
                value={signupForm.job_title}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, job_title: e.target.value })
                }
              />
            </label>
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

function ProfilePage({ user, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name || "",
    password: "",
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
          <input
            type="password"
            placeholder="اتركه فارغاً لعدم التغيير"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
          <input
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
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

function LectureForm({ programs, initial, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    id: initial?.id,
    title: initial?.title || "",
    description: initial?.description || "",
    program_id: initial?.program_id || (programs[0]?.id ?? ""),
    topic: initial?.topic || "",
    video_url: initial?.video_url || "",
    slides_url: initial?.slides_url || "",
    extra_links: initial?.extra_links?.length ? initial.extra_links : [],
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (form.id) {
        await api.updateLecture(form);
      } else {
        await api.createLecture(form);
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
        البرنامج التدريبي
        <select
          value={form.program_id}
          onChange={(e) => setForm({ ...form, program_id: e.target.value })}
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        الموضوع / المحور
        <input
          value={form.topic}
          onChange={(e) => setForm({ ...form, topic: e.target.value })}
        />
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
          value={form.video_url}
          onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          placeholder="https://..."
        />
      </label>
      <label>
        رابط الشرائح (PDF / PowerPoint)
        <input
          value={form.slides_url}
          onChange={(e) => setForm({ ...form, slides_url: e.target.value })}
          placeholder="https://..."
        />
      </label>

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

function TakeQuiz({ quiz, onSubmitted }) {
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
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/,
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function isDirectVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());
}

function LectureDetail({ lecture, user, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canModerate = user.role === "admin" || user.role === "lecturer";
  const embed = toEmbedUrl(lecture.video_url);
  const directVideo =
    !embed && isDirectVideoUrl(lecture.video_url) ? lecture.video_url : null;
  const videoRef = useRef(null);

  useWatchTimeTracker(lecture.id, user.role === "trainee" && !!embed);
  useVideoElementWatchTime(
    lecture.id,
    videoRef,
    user.role === "trainee" && !!directVideo,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await api.viewLecture(lecture.id);
      const q = await api.getQuizzes(lecture.id);
      setQuizzes(q.quizzes);
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

  return (
    <div className="panel">
      <button className="btn btn-small" onClick={onBack}>
        → رجوع
      </button>
      <h2>{lecture.title}</h2>
      <div className="meta-row">
        <Badge>{lecture.topic || "بدون موضوع محدد"}</Badge>
        <Badge tone={lecture.status === "approved" ? "success" : "warning"}>
          {STATUS_LABELS[lecture.status]}
        </Badge>
        <span className="muted">المحاضر: {lecture.lecturer_name}</span>
        <span className="muted">👁 {lecture.view_count}</span>
      </div>
      {lecture.description && (
        <p className="description">{lecture.description}</p>
      )}

      {embed && (
        <div className="video-wrap">
          <iframe src={embed} title="video" allowFullScreen />
        </div>
      )}
      {directVideo && (
        <div className="video-wrap">
          <video ref={videoRef} src={directVideo} controls preload="metadata" />
        </div>
      )}
      {!embed && !directVideo && lecture.video_url && (
        <p>
          <a href={lecture.video_url} target="_blank" rel="noreferrer">
            ▶ مشاهدة الفيديو
          </a>
        </p>
      )}
      {lecture.slides_url && (
        <p>
          <a href={lecture.slides_url} target="_blank" rel="noreferrer">
            📑 عرض الشرائح
          </a>
        </p>
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

      {!loading &&
        quizzes.map((quiz) => (
          <div key={quiz.id}>
            {user.role === "trainee" ? (
              <TakeQuiz quiz={quiz} />
            ) : (
              <QuizAnswerKey quiz={quiz} />
            )}
          </div>
        ))}

      {user.role === "trainee" && <FeedbackForm lectureId={lecture.id} />}

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

  return (
    <div className="panel">
      <h2>المحاضرات المتاحة</h2>
      <div className="toolbar">
        <label>
          تصفية حسب البرنامج
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
          >
            <option value="">جميع البرامج</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
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
    ["المحاضرات الممتمدة", stats.approvedLectures],
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
      <table className="data-table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>اسم المستخدم</th>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgramsManagement() {
  const [programs, setPrograms] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  async function handleAdd(e) {
    e.preventDefault();
    try {
      await api.createProgram({ name, description });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <ErrorBox message={error} />
      {loading ? (
        <Spinner />
      ) : (
        <ul className="simple-list">
          {programs.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong>
              {p.description ? ` — ${p.description}` : ""}
            </li>
          ))}
        </ul>
      )}
      <form className="form-inline" onSubmit={handleAdd}>
        <input
          placeholder="اسم برنامج جديد"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="وصف مختصر (اختياري)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="btn btn-primary btn-small" type="submit">
          إضافة
        </button>
      </form>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminReport();
      setRows(data.report || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const header = [
      "اسم المحاضرة",
      "اسم المتدرب",
      "تاريخ نزول المحاضرة",
      "تاريخ الحضور",
      "مدة المشاهدة (دقيقة)",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.map(esc).join(",")];
    rows.forEach((r) => {
      lines.push(
        [
          esc(r.lecture_title),
          esc(r.trainee_name),
          esc(fmtDate(r.lecture_created_at)),
          esc(fmtDateTime(r.first_viewed_at)),
          esc(r.watched_minutes),
        ].join(","),
      );
    });
    const blob = new Blob(["﻿" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "تقرير_المتابعة.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Spinner />;
  return (
    <div>
      <ErrorBox message={error} />
      <div className="toolbar">
        <span className="muted">{rows.length} سجل</span>
        <button
          className="btn btn-small"
          onClick={exportCsv}
          disabled={!rows.length}
        >
          ⬇ تصدير CSV
        </button>
      </div>
      {rows.length === 0 && <p className="muted">لا توجد بيانات مشاهدة بعد.</p>}
      {rows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>اسم المحاضرة</th>
              <th>اسم المتدرب</th>
              <th>تاريخ نزول المحاضرة</th>
              <th>تاريخ الحضور</th>
              <th>مدة المشاهدة (دقيقة)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.lecture_title}</td>
                <td>{r.trainee_name}</td>
                <td>{fmtDate(r.lecture_created_at)}</td>
                <td>{fmtDateTime(r.first_viewed_at)}</td>
                <td>{r.watched_minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
      </div>
      <ErrorBox message={error} />
      {tab === "stats" && (stats ? <StatsCards stats={stats} /> : <Spinner />)}
      {tab === "users" && <UsersManagement />}
      {tab === "programs" && <ProgramsManagement />}
      {tab === "lectures" && (
        <LecturesModeration user={user} onOpen={setSelected} />
      )}
      {tab === "report" && <AttendanceReport />}
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

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      /* ignore */
    }
    setToken(null);
    setUser(null);
  }, []);

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
          <span className="header-logo-badge">
            <img
              src={PROGRAM_LOGO}
              alt="شعار برنامج تطوير الرعاية الأولية والصحة المجتمعية"
              className="header-logo-img"
            />
          </span>
          <span>{PLATFORM_NAME}</span>
        </div>
        <nav className="app-header-nav">
          <button
            className={view === "home" ? "tab active" : "tab"}
            onClick={() => setView("home")}
          >
            الرئيسية
          </button>
          <button
            className={view === "profile" ? "tab active" : "tab"}
            onClick={() => setView("profile")}
          >
            الملف الشخصي
          </button>
        </nav>
        <div className="app-header-user">
          <div className="app-header-user-row">
            <span>{user.name}</span>
            <Badge tone="info">{ROLE_LABELS[user.role]}</Badge>
            <button className="btn btn-small" onClick={handleLogout}>
              خروج
            </button>
          </div>
          <CopyrightMark className="header-copyright" />
        </div>
      </header>

      <main className="app-main">
        {view === "profile" && <ProfilePage user={user} onUpdated={setUser} />}
        {view === "home" && user.role === "trainee" && (
          <TraineeDashboard user={user} />
        )}
        {view === "home" && user.role === "lecturer" && (
          <LecturerDashboard user={user} />
        )}
        {view === "home" && user.role === "admin" && (
          <AdminDashboard user={user} />
        )}
      </main>
    </div>
  );
}
