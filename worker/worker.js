// edu-platform-api — Cloudflare Worker
// Bindings required:
//   DB              → D1 database "edu-platform-db"
// Optional secret (for professional AI voice on slides):
//   OPENAI_API_KEY  → OpenAI API key (Settings → Variables and Secrets → type "Secret")
// Optional plain variables:
//   TTS_MODEL       → defaults to "gpt-4o-mini-tts"

const ALLOWED_ORIGINS = ["https://edu.sharififcm.com", "https://edu-platform-fcm.netlify.app"];
const ITERATIONS = 100000;
const TOKEN_LIFETIME_DAYS_LONG = 30;
const TOKEN_LIFETIME_DAYS_SHORT = 1;
// Saudi Arabia is UTC+3 — availability dates are compared against local date.
const LOCAL_TODAY_SQL = "date('now','+3 hours')";
const TTS_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"];

/* ---------------- helpers ---------------- */

function corsHeaders(request) {
  const origin = request && request.headers ? request.headers.get("Origin") : null;
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

function withCors(response, request) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request))) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function fromB64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function pbkdf2(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, keyMaterial, 256);
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(password, salt);
  return `${toB64(salt)}:${toB64(bits)}`;
}

async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [saltB64, hashB64] = stored.split(":");
  const bits = await pbkdf2(password, fromB64(saltB64));
  return toB64(bits) === hashB64;
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function publicUser(u) {
  return {
    username: u.username,
    name: u.name,
    role: u.role,
    status: u.status,
    department: u.department,
    specialty: u.specialty,
    job_title: u.job_title,
    employee_id: u.employee_id,
    email: u.email,
    hospital: u.hospital,
    created_at: u.created_at,
  };
}

function bearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

async function getUserFromRequest(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT users.* FROM sessions
     JOIN users ON users.username = sessions.username
     WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
  )
    .bind(token)
    .first();
  return row || null;
}

function cleanDate(v) {
  if (!v) return null;
  const s = String(v).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// A trainee may not use a lecture after its availability date.
async function lectureOpenForTrainee(env, lectureId) {
  const row = await env.DB.prepare(
    `SELECT id FROM lectures WHERE id = ? AND status = 'approved'
       AND (available_until IS NULL OR available_until = '' OR available_until >= ${LOCAL_TODAY_SQL})`
  )
    .bind(lectureId)
    .first();
  return !!row;
}

const CLOSED_MSG = "انتهت فترة إتاحة هذه المحاضرة.";

/* ---------------- auth ---------------- */

async function handleSignup(request, env) {
  const body = await readJson(request);
  const { first_name, last_name, username, password, employee_id, email, hospital, department, specialty, job_title } = body || {};
  const fn = (first_name || "").trim();
  const ln = (last_name || "").trim();
  const name = (body?.name || `${fn} ${ln}`).trim();
  if (!fn || !ln) return json({ ok: false, message: "الرجاء إدخال الاسم الأول واسم العائلة على الأقل." }, 400);
  if (!username || !username.trim() || !password || !password.trim())
    return json({ ok: false, message: "الرجاء تعبئة اسم المستخدم وكلمة المرور." }, 400);
  if (!employee_id || !String(employee_id).trim()) return json({ ok: false, message: "الرقم الوظيفي مطلوب." }, 400);
  if (!isValidEmail(email)) return json({ ok: false, message: "الرجاء إدخال بريد إلكتروني صحيح." }, 400);
  if (!hospital || !hospital.trim()) return json({ ok: false, message: "اسم المستشفى مطلوب." }, 400);

  const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username.trim()).first();
  if (existing) return json({ ok: false, message: "اسم المستخدم هذا مستخدم بالفعل." }, 409);
  const dupEmp = await env.DB.prepare("SELECT username FROM users WHERE employee_id = ?").bind(String(employee_id).trim()).first();
  if (dupEmp) return json({ ok: false, message: "الرقم الوظيفي مسجل مسبقاً." }, 409);
  const dupEmail = await env.DB.prepare("SELECT username FROM users WHERE lower(email) = lower(?)").bind(email.trim()).first();
  if (dupEmail) return json({ ok: false, message: "البريد الإلكتروني مسجل مسبقاً." }, 409);

  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    `INSERT INTO users (username, name, password_hash, role, department, specialty, job_title, employee_id, email, hospital, status)
     VALUES (?, ?, ?, 'trainee', ?, ?, ?, ?, ?, ?, 'pending')`
  )
    .bind(
      username.trim(),
      name,
      passwordHash,
      department || null,
      specialty || null,
      job_title || null,
      String(employee_id).trim(),
      email.trim(),
      hospital.trim()
    )
    .run();
  return json({ ok: true, message: "تم إرسال طلب التسجيل. يجب أن يوافق المشرف على حسابك قبل تسجيل الدخول." });
}

async function handleLogin(request, env) {
  const body = await readJson(request);
  const { username, password, keepSignedIn } = body || {};
  if (!username || !password) return json({ ok: false, message: "اسم المستخدم وكلمة المرور مطلوبان." }, 400);
  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username.trim()).first();
  if (!user) return json({ ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return json({ ok: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
  if (user.status === "pending") return json({ ok: false, message: "حسابك بانتظار موافقة المشرف." }, 403);
  if (user.status === "rejected") return json({ ok: false, message: "تم رفض طلب تسجيلك. تواصل مع المشرف." }, 403);
  const token = newToken();
  const lifetimeDays = keepSignedIn ? TOKEN_LIFETIME_DAYS_LONG : TOKEN_LIFETIME_DAYS_SHORT;
  const expiresAt = new Date(Date.now() + lifetimeDays * 86400000).toISOString().replace("T", " ").slice(0, 19);
  await env.DB.prepare("INSERT INTO sessions (token, username, expires_at) VALUES (?, ?, ?)").bind(token, user.username, expiresAt).run();
  return json({ ok: true, user: publicUser(user), token });
}

async function handleLogout(request, env) {
  const token = bearerToken(request);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return json({ ok: true });
}

async function handleMe(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ ok: false }, 401);
  return json({ ok: true, user: publicUser(user) });
}

async function handleProfile(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const body = (await readJson(request)) || {};
  const sets = [];
  const values = [];
  if (body.name && body.name.trim()) {
    sets.push("name = ?");
    values.push(body.name.trim());
  }
  if (body.password && body.password.trim()) {
    sets.push("password_hash = ?");
    values.push(await hashPassword(body.password));
  }
  if (body.email !== undefined && body.email !== "") {
    if (!isValidEmail(body.email)) return json({ ok: false, message: "الرجاء إدخال بريد إلكتروني صحيح." }, 400);
    sets.push("email = ?");
    values.push(body.email.trim());
  }
  for (const key of ["department", "specialty", "job_title", "employee_id", "hospital"]) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(body[key] ? String(body[key]).trim() : null);
    }
  }
  if (!sets.length) return json({ ok: true, user: publicUser(user) });
  values.push(user.username);
  await env.DB.prepare(`UPDATE users SET ${sets.join(", ")} WHERE username = ?`).bind(...values).run();
  const updated = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(user.username).first();
  return json({ ok: true, user: publicUser(updated) });
}

/* ---------------- users / programs ---------------- */

async function handleUsersGet(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return json({ ok: true, users: results.map(publicUser) });
}

async function handleUsersPost(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const { username, status, role } = (await readJson(request)) || {};
  if (!username) return json({ ok: false, message: "اسم المستخدم مطلوب." }, 400);
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    await env.DB.prepare("UPDATE users SET status = ? WHERE username = ?").bind(status, username).run();
  }
  if (role && ["trainee", "lecturer", "admin"].includes(role)) {
    await env.DB.prepare("UPDATE users SET role = ? WHERE username = ?").bind(role, username).run();
  }
  const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  return json({ ok: true, users: results.map(publicUser) });
}

async function handleProgramsGet(env) {
  const { results } = await env.DB.prepare("SELECT * FROM programs ORDER BY name").all();
  return json({ ok: true, programs: results });
}

async function handleProgramsPost(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const { name, description } = (await readJson(request)) || {};
  if (!name || !name.trim()) return json({ ok: false, message: "اسم البرنامج مطلوب." }, 400);
  await env.DB.prepare("INSERT INTO programs (name, description) VALUES (?, ?)").bind(name.trim(), description || null).run();
  const { results } = await env.DB.prepare("SELECT * FROM programs ORDER BY name").all();
  return json({ ok: true, programs: results });
}

/* ---------------- lectures ---------------- */

function safeParse(s, fallback) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch (e) {
    return fallback;
  }
}

function parseLectureRow(row) {
  const { slides_json, ...rest } = row;
  return {
    ...rest,
    extra_links: safeParse(row.extra_links, []),
    slides: safeParse(slides_json, null),
  };
}

function normalizeSlides(slides) {
  if (!slides || typeof slides !== "object") return null;
  const list = Array.isArray(slides.slides) ? slides.slides : [];
  if (!list.length) return null;
  const voice = TTS_VOICES.includes(slides.voice) ? slides.voice : "onyx";
  return JSON.stringify({
    voice,
    file_name: slides.file_name ? String(slides.file_name).slice(0, 200) : null,
    slides: list.slice(0, 200).map((s) => ({
      title: String(s.title || "").slice(0, 500),
      bullets: Array.isArray(s.bullets) ? s.bullets.slice(0, 40).map((b) => String(b).slice(0, 1000)) : [],
      narration: String(s.narration || "").slice(0, 4000),
    })),
  });
}

async function handleLecturesGet(request, env) {
  const caller = await getUserFromRequest(request, env);
  const url = new URL(request.url);
  const programId = url.searchParams.get("program_id");
  let sql = "SELECT * FROM lectures";
  const conds = [];
  const params = [];
  if (!caller || caller.role === "trainee") {
    conds.push("status = 'approved'");
    conds.push(`(available_until IS NULL OR available_until = '' OR available_until >= ${LOCAL_TODAY_SQL})`);
  } else if (caller.role === "lecturer") {
    conds.push("(status = 'approved' OR lecturer_username = ?)");
    params.push(caller.username);
  }
  if (programId) {
    conds.push("program_id = ?");
    params.push(programId);
  }
  if (conds.length) sql += " WHERE " + conds.join(" AND ");
  sql += " ORDER BY created_at DESC";
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ ok: true, lectures: results.map(parseLectureRow) });
}

async function handleLecturesCreate(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || (caller.role !== "lecturer" && caller.role !== "admin")) return json({ ok: false, message: "ممنوع." }, 403);
  const body = (await readJson(request)) || {};
  const { title, description, program_id, topic, video_url, slides_url, extra_links, available_until, slides } = body;
  if (!title || !title.trim()) return json({ ok: false, message: "عنوان المحاضرة مطلوب." }, 400);
  const result = await env.DB.prepare(
    `INSERT INTO lectures (title, description, program_id, topic, lecturer_username, lecturer_name, video_url, slides_url, extra_links, available_until, slides_json, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  )
    .bind(
      title.trim(),
      description || null,
      program_id || null,
      topic || null,
      caller.username,
      caller.name,
      video_url || null,
      slides_url || null,
      JSON.stringify(extra_links || []),
      cleanDate(available_until),
      normalizeSlides(slides)
    )
    .run();
  return json({ ok: true, id: result.meta.last_row_id });
}

async function handleLecturesUpdate(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const body = (await readJson(request)) || {};
  const { id, title, description, program_id, topic, video_url, slides_url, extra_links } = body;
  if (!id) return json({ ok: false, message: "المعرف مطلوب." }, 400);
  const lecture = await env.DB.prepare("SELECT * FROM lectures WHERE id = ?").bind(id).first();
  if (!lecture) return json({ ok: false, message: "غير موجود." }, 404);
  const isOwner = lecture.lecturer_username === caller.username;
  if (!isOwner && caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const newStatus = caller.role === "admin" ? lecture.status : "draft";
  const availableUntil = "available_until" in body ? cleanDate(body.available_until) : lecture.available_until;
  const slidesJson = "slides" in body ? normalizeSlides(body.slides) : lecture.slides_json;
  await env.DB.prepare(
    `UPDATE lectures SET title = ?, description = ?, program_id = ?, topic = ?, video_url = ?, slides_url = ?, extra_links = ?,
       available_until = ?, slides_json = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(
      title || lecture.title,
      description ?? lecture.description,
      program_id ?? lecture.program_id,
      topic ?? lecture.topic,
      video_url ?? lecture.video_url,
      slides_url ?? lecture.slides_url,
      JSON.stringify(extra_links ?? safeParse(lecture.extra_links, [])),
      availableUntil,
      slidesJson,
      newStatus,
      id
    )
    .run();
  return json({ ok: true });
}

async function handleLecturesApprove(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const { id, status } = (await readJson(request)) || {};
  if (!id || !["draft", "approved"].includes(status)) return json({ ok: false, message: "بيانات غير صحيحة." }, 400);
  await env.DB.prepare("UPDATE lectures SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run();
  return json({ ok: true });
}

async function handleLecturesDelete(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const { id } = (await readJson(request)) || {};
  if (!id) return json({ ok: false, message: "المعرف مطلوب." }, 400);
  const lecture = await env.DB.prepare("SELECT * FROM lectures WHERE id = ?").bind(id).first();
  if (!lecture) return json({ ok: true });
  if (lecture.lecturer_username !== caller.username && caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const { results: qz } = await env.DB.prepare("SELECT id FROM quizzes WHERE lecture_id = ?").bind(id).all();
  for (const q of qz) await env.DB.prepare("DELETE FROM quiz_questions WHERE quiz_id = ?").bind(q.id).run();
  await env.DB.prepare("DELETE FROM quizzes WHERE lecture_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM lectures WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function handleLectureView(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const { id } = (await readJson(request)) || {};
  if (!id) return json({ ok: false, message: "المعرف مطلوب." }, 400);
  if (caller.role === "trainee" && !(await lectureOpenForTrainee(env, id))) return json({ ok: false, message: CLOSED_MSG }, 403);
  const insert = await env.DB.prepare("INSERT OR IGNORE INTO lecture_views (lecture_id, username) VALUES (?, ?)").bind(id, caller.username).run();
  if (insert.meta.changes > 0) {
    await env.DB.prepare("UPDATE lectures SET view_count = view_count + 1 WHERE id = ?").bind(id).run();
  }
  return json({ ok: true });
}

async function handleLectureHeartbeat(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const { id, seconds } = (await readJson(request)) || {};
  const secs = Math.max(0, Math.min(3600, Math.round(Number(seconds) || 0)));
  if (!id || !secs) return json({ ok: false, message: "بيانات غير صحيحة." }, 400);
  if (caller.role === "trainee" && !(await lectureOpenForTrainee(env, id))) return json({ ok: false, message: CLOSED_MSG }, 403);
  await env.DB.prepare(
    `INSERT INTO lecture_views (lecture_id, username, watched_seconds, last_viewed_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(lecture_id, username) DO UPDATE SET
       watched_seconds = watched_seconds + excluded.watched_seconds,
       last_viewed_at = excluded.last_viewed_at`
  )
    .bind(id, caller.username, secs)
    .run();
  return json({ ok: true });
}

/* ---------------- quizzes ---------------- */

async function handleQuizzesGet(request, env) {
  const caller = await getUserFromRequest(request, env);
  const lectureId = new URL(request.url).searchParams.get("lecture_id");
  if (!lectureId) return json({ ok: false, message: "lecture_id مطلوب." }, 400);
  const { results: quizzes } = await env.DB.prepare("SELECT * FROM quizzes WHERE lecture_id = ?").bind(lectureId).all();
  const canSeeAnswers = caller && (caller.role === "admin" || caller.role === "lecturer");
  const out = [];
  for (const q of quizzes) {
    const { results: questions } = await env.DB.prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index").bind(q.id).all();
    out.push({
      ...q,
      questions: questions.map((qq) => {
        const opts = safeParse(qq.options, []);
        return {
          id: qq.id,
          question_text: qq.question_text,
          type: qq.type,
          options: canSeeAnswers ? opts : opts.map((o) => ({ text: o.text })),
        };
      }),
    });
  }
  return json({ ok: true, quizzes: out });
}

async function handleQuizzesCreate(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || (caller.role !== "lecturer" && caller.role !== "admin")) return json({ ok: false, message: "ممنوع." }, 403);
  const { lecture_id, title, pass_score, allow_retake, questions } = (await readJson(request)) || {};
  if (!lecture_id || !title || !Array.isArray(questions) || !questions.length) {
    return json({ ok: false, message: "بيانات الاختبار غير مكتملة." }, 400);
  }
  const result = await env.DB.prepare("INSERT INTO quizzes (lecture_id, title, pass_score, allow_retake) VALUES (?, ?, ?, ?)")
    .bind(lecture_id, title.trim(), pass_score || 60, allow_retake === false ? 0 : 1)
    .run();
  const quizId = result.meta.last_row_id;
  let idx = 0;
  for (const q of questions) {
    await env.DB.prepare("INSERT INTO quiz_questions (quiz_id, question_text, type, options, order_index) VALUES (?, ?, ?, ?, ?)")
      .bind(quizId, q.question_text, q.type || "single", JSON.stringify(q.options || []), idx++)
      .run();
  }
  return json({ ok: true, id: quizId });
}

async function handleQuizDelete(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || (caller.role !== "lecturer" && caller.role !== "admin")) return json({ ok: false, message: "ممنوع." }, 403);
  const { id } = (await readJson(request)) || {};
  if (!id) return json({ ok: false, message: "المعرف مطلوب." }, 400);
  const quiz = await env.DB.prepare("SELECT q.id, l.lecturer_username FROM quizzes q JOIN lectures l ON l.id = q.lecture_id WHERE q.id = ?").bind(id).first();
  if (!quiz) return json({ ok: true });
  if (caller.role !== "admin" && quiz.lecturer_username !== caller.username) return json({ ok: false, message: "ممنوع." }, 403);
  await env.DB.prepare("DELETE FROM quiz_questions WHERE quiz_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM quizzes WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

async function handleQuizAttempt(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const { quiz_id, answers } = (await readJson(request)) || {};
  if (!quiz_id || !answers) return json({ ok: false, message: "بيانات غير مكتملة." }, 400);
  const quiz = await env.DB.prepare("SELECT * FROM quizzes WHERE id = ?").bind(quiz_id).first();
  if (!quiz) return json({ ok: false, message: "الاختبار غير موجود." }, 404);
  if (caller.role === "trainee" && !(await lectureOpenForTrainee(env, quiz.lecture_id))) return json({ ok: false, message: CLOSED_MSG }, 403);
  if (!quiz.allow_retake) {
    const prev = await env.DB.prepare("SELECT id FROM quiz_attempts WHERE quiz_id = ? AND username = ?").bind(quiz_id, caller.username).first();
    if (prev) return json({ ok: false, message: "لا يمكن إعادة هذا الاختبار." }, 403);
  }
  const { results: questions } = await env.DB.prepare("SELECT * FROM quiz_questions WHERE quiz_id = ?").bind(quiz_id).all();
  let correctCount = 0;
  for (const q of questions) {
    const opts = safeParse(q.options, []);
    const correctIdx = opts.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0).sort();
    const given = (answers[q.id] || []).slice().sort();
    if (JSON.stringify(correctIdx) === JSON.stringify(given)) correctCount++;
  }
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= quiz.pass_score ? 1 : 0;
  await env.DB.prepare("INSERT INTO quiz_attempts (quiz_id, username, score, passed, answers) VALUES (?, ?, ?, ?, ?)")
    .bind(quiz_id, caller.username, score, passed, JSON.stringify(answers))
    .run();
  return json({ ok: true, score, passed: !!passed, correctCount, total: questions.length });
}

async function handleQuizAttemptsGet(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const url = new URL(request.url);
  const quizId = url.searchParams.get("quiz_id");
  if (url.searchParams.get("mine")) {
    const { results } = await env.DB.prepare("SELECT * FROM quiz_attempts WHERE username = ? ORDER BY attempted_at DESC").bind(caller.username).all();
    return json({ ok: true, attempts: results });
  }
  if (!quizId) return json({ ok: false, message: "quiz_id مطلوب." }, 400);
  if (caller.role !== "admin" && caller.role !== "lecturer") return json({ ok: false, message: "ممنوع." }, 403);
  const { results } = await env.DB.prepare("SELECT * FROM quiz_attempts WHERE quiz_id = ? ORDER BY attempted_at DESC").bind(quizId).all();
  return json({ ok: true, attempts: results });
}

/* ---------------- feedback / stats / report ---------------- */

async function handleFeedbackPost(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  const { lecture_id, content_rating, lecturer_rating, clarity_rating, comment } = (await readJson(request)) || {};
  if (!lecture_id) return json({ ok: false, message: "lecture_id مطلوب." }, 400);
  await env.DB.prepare(
    `INSERT INTO feedback (lecture_id, username, content_rating, lecturer_rating, clarity_rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(lecture_id, username) DO UPDATE SET
       content_rating = excluded.content_rating, lecturer_rating = excluded.lecturer_rating,
       clarity_rating = excluded.clarity_rating, comment = excluded.comment`
  )
    .bind(lecture_id, caller.username, content_rating || null, lecturer_rating || null, clarity_rating || null, comment || null)
    .run();
  return json({ ok: true });
}

async function handleFeedbackGet(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || (caller.role !== "admin" && caller.role !== "lecturer")) return json({ ok: false, message: "ممنوع." }, 403);
  const lectureId = new URL(request.url).searchParams.get("lecture_id");
  if (!lectureId) return json({ ok: false, message: "lecture_id مطلوب." }, 400);
  const { results } = await env.DB.prepare("SELECT * FROM feedback WHERE lecture_id = ? ORDER BY created_at DESC").bind(lectureId).all();
  return json({ ok: true, feedback: results });
}

async function handleStats(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const one = (sql) => env.DB.prepare(sql).first();
  const [totalUsers, activeUsers, pendingUsers, totalLectures, approvedLectures, draftLectures, totalViews, avgScore, avgSatisfaction] = await Promise.all([
    one("SELECT COUNT(*) c FROM users"),
    one("SELECT COUNT(*) c FROM users WHERE status = 'approved'"),
    one("SELECT COUNT(*) c FROM users WHERE status = 'pending'"),
    one("SELECT COUNT(*) c FROM lectures"),
    one("SELECT COUNT(*) c FROM lectures WHERE status = 'approved'"),
    one("SELECT COUNT(*) c FROM lectures WHERE status = 'draft'"),
    one("SELECT COALESCE(SUM(view_count),0) c FROM lectures"),
    one("SELECT COALESCE(AVG(score),0) c FROM quiz_attempts"),
    one(
      "SELECT COALESCE(AVG((COALESCE(content_rating,0)+COALESCE(lecturer_rating,0)+COALESCE(clarity_rating,0)) * 1.0 / NULLIF((CASE WHEN content_rating IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN lecturer_rating IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN clarity_rating IS NOT NULL THEN 1 ELSE 0 END),0)),0) c FROM feedback"
    ),
  ]);
  return json({
    ok: true,
    stats: {
      totalUsers: totalUsers.c,
      activeUsers: activeUsers.c,
      pendingUsers: pendingUsers.c,
      totalLectures: totalLectures.c,
      approvedLectures: approvedLectures.c,
      draftLectures: draftLectures.c,
      totalViews: totalViews.c,
      avgQuizScore: Math.round(avgScore.c || 0),
      avgSatisfaction: Math.round((avgSatisfaction.c || 0) * 10) / 10,
    },
  });
}

async function handleAdminReport(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller || caller.role !== "admin") return json({ ok: false, message: "ممنوع." }, 403);
  const url = new URL(request.url);
  const from = cleanDate(url.searchParams.get("from"));
  const to = cleanDate(url.searchParams.get("to"));
  const conds = [];
  const params = [];
  // Filter on the trainee's attendance date (Saudi local date).
  if (from) {
    conds.push("date(v.viewed_at,'+3 hours') >= ?");
    params.push(from);
  }
  if (to) {
    conds.push("date(v.viewed_at,'+3 hours') <= ?");
    params.push(to);
  }
  const where = conds.length ? "WHERE " + conds.join(" AND ") : "";
  const { results } = await env.DB.prepare(
    `SELECT l.id AS lecture_id, l.title AS lecture_title, l.created_at AS lecture_created_at, l.available_until,
            u.name AS trainee_name, u.employee_id, u.hospital, u.email,
            v.viewed_at AS first_viewed_at, v.last_viewed_at, v.watched_seconds,
            (SELECT MAX(a.score) FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
               WHERE q.lecture_id = l.id AND a.username = u.username) AS best_score,
            (SELECT MAX(a.passed) FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
               WHERE q.lecture_id = l.id AND a.username = u.username) AS passed
     FROM lecture_views v
     JOIN lectures l ON l.id = v.lecture_id
     JOIN users u ON u.username = v.username
     ${where}
     ORDER BY v.viewed_at DESC, l.title, u.name`
  )
    .bind(...params)
    .all();
  const report = results.map((r) => ({
    lecture_title: r.lecture_title,
    trainee_name: r.trainee_name,
    employee_id: r.employee_id,
    hospital: r.hospital,
    email: r.email,
    lecture_created_at: r.lecture_created_at,
    available_until: r.available_until,
    first_viewed_at: r.first_viewed_at,
    last_viewed_at: r.last_viewed_at,
    watched_minutes: Math.round(((r.watched_seconds || 0) / 60) * 10) / 10,
    best_score: r.best_score,
    passed: r.passed == null ? null : !!r.passed,
  }));
  return json({ ok: true, report });
}

/* ---------------- AI voice (text-to-speech) ---------------- */

async function handleTts(request, env) {
  const caller = await getUserFromRequest(request, env);
  if (!caller) return json({ ok: false, message: "غير مسجل الدخول." }, 401);
  if (!env.OPENAI_API_KEY) return json({ ok: false, code: "tts_not_configured", message: "لم يتم إعداد خدمة الصوت." }, 501);
  const body = (await readJson(request)) || {};
  const text = String(body.text || "").trim().slice(0, 4000);
  if (!text) return json({ ok: false, message: "النص مطلوب." }, 400);
  const voice = TTS_VOICES.includes(body.voice) ? body.voice : "onyx";
  const model = env.TTS_MODEL || "gpt-4o-mini-tts";
  const instructions =
    "You are narrating a medical lecture slide for family and community medicine trainees. " +
    "Speak clearly and warmly at a moderate teaching pace. If the text is Arabic, use Modern Standard Arabic with a Gulf/Saudi accent; " +
    "pronounce medical terms and abbreviations correctly.";
  const hash = await sha256Hex(`${model}|${voice}|${text}`);

  const cached = await env.DB.prepare("SELECT audio FROM tts_cache WHERE hash = ?").bind(hash).first();
  if (cached) {
    return new Response(fromB64(cached.audio), {
      headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400", "x-tts-cache": "hit" },
    });
  }

  const payload = { model, voice, input: text, response_format: "mp3" };
  if (model.includes("gpt-4o")) payload.instructions = instructions;
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return json({ ok: false, message: "تعذّر توليد الصوت.", detail: detail.slice(0, 300) }, 502);
  }
  const audio = await res.arrayBuffer();
  // Cache (D1 rows are limited to ~2MB; skip caching very long audio).
  if (audio.byteLength < 1400000) {
    try {
      await env.DB.prepare("INSERT OR REPLACE INTO tts_cache (hash, audio) VALUES (?, ?)").bind(hash, toB64(audio)).run();
    } catch (e) {
      /* ignore cache errors */
    }
  }
  return new Response(audio, {
    headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=86400", "x-tts-cache": "miss" },
  });
}

async function handleTtsStatus(env) {
  return json({ ok: true, enabled: !!env.OPENAI_API_KEY, voices: TTS_VOICES });
}

/* ---------------- router ---------------- */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }), request);
    const { pathname } = new URL(request.url);
    const method = request.method;
    const routes = {
      "POST /api/signup": () => handleSignup(request, env),
      "POST /api/login": () => handleLogin(request, env),
      "POST /api/logout": () => handleLogout(request, env),
      "GET /api/me": () => handleMe(request, env),
      "POST /api/profile": () => handleProfile(request, env),
      "GET /api/users": () => handleUsersGet(request, env),
      "POST /api/users": () => handleUsersPost(request, env),
      "GET /api/programs": () => handleProgramsGet(env),
      "POST /api/programs": () => handleProgramsPost(request, env),
      "GET /api/lectures": () => handleLecturesGet(request, env),
      "POST /api/lectures": () => handleLecturesCreate(request, env),
      "POST /api/lectures/update": () => handleLecturesUpdate(request, env),
      "POST /api/lectures/approve": () => handleLecturesApprove(request, env),
      "POST /api/lectures/delete": () => handleLecturesDelete(request, env),
      "POST /api/lectures/view": () => handleLectureView(request, env),
      "POST /api/lectures/heartbeat": () => handleLectureHeartbeat(request, env),
      "GET /api/quizzes": () => handleQuizzesGet(request, env),
      "POST /api/quizzes": () => handleQuizzesCreate(request, env),
      "POST /api/quizzes/delete": () => handleQuizDelete(request, env),
      "POST /api/quizzes/attempt": () => handleQuizAttempt(request, env),
      "GET /api/quizzes/attempts": () => handleQuizAttemptsGet(request, env),
      "POST /api/feedback": () => handleFeedbackPost(request, env),
      "GET /api/feedback": () => handleFeedbackGet(request, env),
      "GET /api/stats": () => handleStats(request, env),
      "GET /api/admin/report": () => handleAdminReport(request, env),
      "POST /api/tts": () => handleTts(request, env),
      "GET /api/tts/status": () => handleTtsStatus(env),
    };
    try {
      const handler = routes[`${method} ${pathname}`];
      const response = handler ? await handler() : json({ ok: false, message: "Not found." }, 404);
      return withCors(response, request);
    } catch (err) {
      return withCors(json({ ok: false, message: "خطأ في الخادم.", error: String((err && err.message) || err) }, 500), request);
    }
  },
};
