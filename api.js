const API_BASE = 'https://edu-platform-api.dr-sharififm.workers.dev';

function getToken() {
  return localStorage.getItem('edu_token') || '';
}

export function setToken(token) {
  if (token) localStorage.setItem('edu_token', token);
  else localStorage.removeItem('edu_token');
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
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error('استجابة غير صالحة من الخادم.');
  }
  if (!res.ok || data.ok === false) {
    const err = new Error(data.message || 'حدث خطأ غير متوقع.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  signup: (payload) => request('/api/signup', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/api/login', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/api/logout', { method: 'POST' }),
  me: () => request('/api/me'),
  updateProfile: (payload) => request('/api/profile', { method: 'POST', body: payload }),

  getUsers: () => request('/api/users'),
  updateUser: (payload) => request('/api/users', { method: 'POST', body: payload }),
  deleteUser: (username) => request('/api/users/delete', { method: 'POST', body: { username } }),
  getLecturers: () => request('/api/lecturers'),

  getPrograms: () => request('/api/programs', { auth: false }),
  createProgram: (payload) => request('/api/programs', { method: 'POST', body: payload }),
  updateProgram: (payload) => request('/api/programs/update', { method: 'POST', body: payload }),
  deleteProgram: (id) => request('/api/programs/delete', { method: 'POST', body: { id } }),

  getLectures: (programId) => request(`/api/lectures${programId ? `?program_id=${programId}` : ''}`),
  createLecture: (payload) => request('/api/lectures', { method: 'POST', body: payload }),
  updateLecture: (payload) => request('/api/lectures/update', { method: 'POST', body: payload }),
  approveLecture: (id, status) => request('/api/lectures/approve', { method: 'POST', body: { id, status } }),
  deleteLecture: (id) => request('/api/lectures/delete', { method: 'POST', body: { id } }),
  viewLecture: (id) => request('/api/lectures/view', { method: 'POST', body: { id } }),
  heartbeatLecture: (id, seconds) => request('/api/lectures/heartbeat', { method: 'POST', body: { id, seconds } }),
  slideProgress: (id, slide_index) => request('/api/lectures/slide-progress', { method: 'POST', body: { id, slide_index } }),

  getQuizzes: (lectureId) => request(`/api/quizzes?lecture_id=${lectureId}`),
  createQuiz: (payload) => request('/api/quizzes', { method: 'POST', body: payload }),
  deleteQuiz: (id) => request('/api/quizzes/delete', { method: 'POST', body: { id } }),
  updateQuiz: (payload) => request('/api/quizzes/update', { method: 'POST', body: payload }),
  generateQuiz: (payload) => request('/api/quizzes/generate', { method: 'POST', body: payload }),
  attemptQuiz: (payload) => request('/api/quizzes/attempt', { method: 'POST', body: payload }),
  getMyAttempts: () => request('/api/quizzes/attempts?mine=1'),
  getQuizAttempts: (quizId) => request(`/api/quizzes/attempts?quiz_id=${quizId}`),

  submitFeedback: (payload) => request('/api/feedback', { method: 'POST', body: payload }),
  getFeedback: (lectureId) => request(`/api/feedback?lecture_id=${lectureId}`),

  getStats: () => request('/api/stats'),
  getAdminReport: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const q = qs.toString();
    return request(`/api/admin/report${q ? `?${q}` : ''}`);
  },

  ttsStatus: () => request('/api/tts/status', { auth: false }),
  // Returns an audio Blob, or throws an Error with .code === 'tts_not_configured'.
  tts: async (text, voice) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ text, voice }),
      });
    } catch (e) {
      throw new Error('تعذّر الاتصال بخدمة الصوت.');
    }
    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch (e) { /* ignore */ }
      const err = new Error(data.message || 'تعذّر توليد الصوت.');
      err.code = data.code || (res.status === 404 ? 'tts_not_configured' : 'tts_error');
      throw err;
    }
    return res.blob();
  },
};

export { getToken };
