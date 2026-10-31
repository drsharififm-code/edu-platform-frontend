import { getLang } from './i18n.js';

const API_BASE = 'https://edu-platform-api.dr-sharififm.workers.dev';

function getToken() {
  try {
    return sessionStorage.getItem('edu_token') || localStorage.getItem('edu_token') || '';
  } catch (e) {
    return '';
  }
}

// "Keep me signed in" → localStorage; otherwise the token lives only for this browser tab.
export function setToken(token, keep = true) {
  try {
    localStorage.removeItem('edu_token');
    sessionStorage.removeItem('edu_token');
    if (token) (keep ? localStorage : sessionStorage).setItem('edu_token', token);
  } catch (e) {
    /* storage unavailable */
  }
}

const isEn = () => getLang() === 'en';
const T = (ar, en) => (isEn() ? en : ar);

// Bilingual, user-friendly errors. Internal details are never shown.
function apiError(data, status) {
  let msg = data && (isEn() ? data.message_en || data.message : data.message);
  if (!msg) msg = T('حدث خطأ غير متوقع. حاول مرة أخرى لاحقاً.', 'An unexpected error occurred. Please try again later.');
  if (data && data.ref) msg += T(` (رقم المرجع: ${data.ref})`, ` (Reference: ${data.ref})`);
  const err = new Error(msg);
  err.status = status;
  err.code = data && data.code;
  return err;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw apiError({
      message: 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم حاول مجدداً.',
      message_en: 'Could not reach the server. Check your internet connection and try again.',
      code: 'network',
    }, 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    throw apiError({
      message: 'استجابة غير متوقعة من الخادم. حاول مرة أخرى لاحقاً.',
      message_en: 'Unexpected response from the server. Please try again later.',
      code: 'bad_response',
    }, res.status);
  }
  if (!res.ok || data.ok === false) {
    if (res.status === 401 && auth && getToken() && data && data.code === 'unauthenticated') {
      setToken(null);
      window.dispatchEvent(new Event('edu-session-expired'));
    }
    throw apiError(data, res.status);
  }
  // Success messages may be bilingual too.
  if (data && data.message_en && isEn()) data.message = data.message_en;
  return data;
}

/* ---------- password transport encryption (RSA-OAEP with the server's public key) ---------- */

let keyPromise = null;
function transportKey() {
  if (!keyPromise) {
    const sentAt = Date.now();
    keyPromise = request('/api/auth/key', { auth: false })
      .then(async (d) => ({
        kid: d.kid,
        skew: d.now ? d.now - Math.round((sentAt + Date.now()) / 2) : 0,
        key: await crypto.subtle.importKey('jwk', d.jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']),
      }))
      .catch((e) => {
        keyPromise = null;
        throw e;
      });
  }
  return keyPromise;
}
function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
export async function encryptPassword(p) {
  const k = await transportKey();
  const payload = new TextEncoder().encode(JSON.stringify({ p: String(p), t: Date.now() + k.skew }));
  return toB64(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, k.key, payload));
}
// Replaces plain password fields with encrypted ones; retries once if the server key changed.
async function withEncrypted(path, payload, fields, opts = {}) {
  const build = async () => {
    const body = { ...payload };
    for (const f of fields) {
      if (body[f]) body[`${f}_enc`] = await encryptPassword(body[f]);
      delete body[f];
    }
    return body;
  };
  try {
    return await request(path, { method: 'POST', body: await build(), ...opts });
  } catch (e) {
    if (e.code !== 'password_payload') throw e;
    keyPromise = null;
    return request(path, { method: 'POST', body: await build(), ...opts });
  }
}

export const api = {
  signup: (payload) => withEncrypted('/api/signup', payload, ['password'], { auth: false }),
  login: (payload) => withEncrypted('/api/login', payload, ['password'], { auth: false }),
  loginMfa: (payload) => request('/api/login/mfa', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/api/logout', { method: 'POST' }),
  me: () => request('/api/me'),
  updateProfile: (payload) => withEncrypted('/api/profile', payload, ['new_password', 'current_password']),

  getUsers: () => request('/api/users'),
  updateUser: (payload) => request('/api/users', { method: 'POST', body: payload }),
  deleteUser: (username) => request('/api/users/delete', { method: 'POST', body: { username } }),
  resetUserMfa: (username) => request('/api/users/reset-mfa', { method: 'POST', body: { username } }),
  getLecturers: () => request('/api/lecturers'),
  sendResetLink: (username) => request('/api/users/send-reset', { method: 'POST', body: { username } }),
  forgotPassword: (identifier, cf_turnstile) => request('/api/password/forgot', { method: 'POST', body: { identifier, cf_turnstile }, auth: false }),
  resetPassword: (token, password) => withEncrypted('/api/password/reset', { token, password }, ['password'], { auth: false }),
  getPersonalReport: ({ employee_id, year } = {}) => {
    const q = new URLSearchParams();
    if (employee_id) q.set('employee_id', employee_id);
    if (year) q.set('year', year);
    return request(`/api/reports/personal?${q.toString()}`);
  },
  uploadSchedule: (payload) => request('/api/programs/schedule', { method: 'POST', body: payload }),
  deleteSchedule: (program_id) => request('/api/programs/schedule/delete', { method: 'POST', body: { program_id } }),

  getPrograms: () => request('/api/programs'),
  createProgram: (payload) => request('/api/programs', { method: 'POST', body: payload }),
  updateProgram: (payload) => request('/api/programs/update', { method: 'POST', body: payload }),
  deleteProgram: (id) => request('/api/programs/delete', { method: 'POST', body: { id } }),

  getLectures: (programId) => request(`/api/lectures${programId ? `?program_id=${encodeURIComponent(programId)}` : ''}`),
  createLecture: (payload) => request('/api/lectures', { method: 'POST', body: payload }),
  updateLecture: (payload) => request('/api/lectures/update', { method: 'POST', body: payload }),
  approveLecture: (id, status) => request('/api/lectures/approve', { method: 'POST', body: { id, status } }),
  deleteLecture: (id) => request('/api/lectures/delete', { method: 'POST', body: { id } }),
  viewLecture: (id) => request('/api/lectures/view', { method: 'POST', body: { id } }),
  heartbeatLecture: (id, seconds) => request('/api/lectures/heartbeat', { method: 'POST', body: { id, seconds } }),
  slideProgress: (id, slide_index) => request('/api/lectures/slide-progress', { method: 'POST', body: { id, slide_index } }),

  getQuizzes: (lectureId) => request(`/api/quizzes?lecture_id=${encodeURIComponent(lectureId)}`),
  createQuiz: (payload) => request('/api/quizzes', { method: 'POST', body: payload }),
  deleteQuiz: (id) => request('/api/quizzes/delete', { method: 'POST', body: { id } }),
  updateQuiz: (payload) => request('/api/quizzes/update', { method: 'POST', body: payload }),
  generateQuiz: (payload) => request('/api/quizzes/generate', { method: 'POST', body: payload }),
  attemptQuiz: (payload) => request('/api/quizzes/attempt', { method: 'POST', body: payload }),
  getMyAttempts: () => request('/api/quizzes/attempts?mine=1'),
  getQuizAttempts: (quizId) => request(`/api/quizzes/attempts?quiz_id=${encodeURIComponent(quizId)}`),

  submitFeedback: (payload) => request('/api/feedback', { method: 'POST', body: payload }),
  getFeedback: (lectureId) => request(`/api/feedback?lecture_id=${encodeURIComponent(lectureId)}`),

  getMyCertificates: () => request('/api/certificates/mine'),
  verifyCertificate: (code) => request(`/api/certificates/verify?code=${encodeURIComponent(code)}`, { auth: false }),
  adminCertificates: ({ q, status } = {}) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (status) qs.set('status', status);
    return request(`/api/admin/certificates?${qs.toString()}`);
  },
  revokeCertificate: (code, reason, action = 'revoke') => request('/api/admin/certificates/revoke', { method: 'POST', body: { code, reason, action } }),
  getAudit: () => request('/api/admin/audit'),

  getStats: () => request('/api/stats'),
  emailBackup: () => request('/api/admin/backup?email=1'),
  downloadBackup: async () => {
    const res = await fetch(`${API_BASE}/api/admin/backup`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch (e) { /* ignore */ }
      throw apiError(data || { code: 'backup_failed', message: 'تعذّر تنزيل النسخة الاحتياطية.', message_en: 'The backup could not be downloaded.' }, res.status);
    }
    const cd = res.headers.get('Content-Disposition') || '';
    const name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'edu-platform-backup.json.gz';
    return { blob: await res.blob(), name };
  },
  getAdminReport: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const q = qs.toString();
    return request(`/api/admin/report${q ? `?${q}` : ''}`);
  },

  ttsStatus: () => request('/api/tts/status', { auth: false }),
  // Returns an audio Blob, or throws an Error with .code === 'tts_disabled'.
  // Trainees send the lecture id + slide index; the server reads the slide text itself.
  tts: async (text, voice, ctx = {}) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text, voice, lecture_id: ctx.lectureId, slide_index: ctx.slideIndex }),
      });
    } catch (e) {
      throw apiError({ message: 'تعذّر الاتصال بخدمة الصوت.', message_en: 'Could not reach the voice service.', code: 'network' }, 0);
    }
    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch (e) { /* ignore */ }
      const err = apiError(data, res.status);
      err.code = data.code === 'tts_disabled' || res.status === 404 || res.status === 501 ? 'tts_not_configured' : data.code || 'tts_error';
      throw err;
    }
    return res.blob();
  },
};

export { getToken, API_BASE };
