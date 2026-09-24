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

  getPrograms: () => request('/api/programs', { auth: false }),
  createProgram: (payload) => request('/api/programs', { method: 'POST', body: payload }),

  getLectures: (programId) => request(`/api/lectures${programId ? `?program_id=${programId}` : ''}`),
  createLecture: (payload) => request('/api/lectures', { method: 'POST', body: payload }),
  updateLecture: (payload) => request('/api/lectures/update', { method: 'POST', body: payload }),
  approveLecture: (id, status) => request('/api/lectures/approve', { method: 'POST', body: { id, status } }),
  deleteLecture: (id) => request('/api/lectures/delete', { method: 'POST', body: { id } }),
  viewLecture: (id) => request('/api/lectures/view', { method: 'POST', body: { id } }),
  heartbeatLecture: (id, seconds) => request('/api/lectures/heartbeat', { method: 'POST', body: { id, seconds } }),

  getQuizzes: (lectureId) => request(`/api/quizzes?lecture_id=${lectureId}`),
  createQuiz: (payload) => request('/api/quizzes', { method: 'POST', body: payload }),
  attemptQuiz: (payload) => request('/api/quizzes/attempt', { method: 'POST', body: payload }),
  getMyAttempts: () => request('/api/quizzes/attempts?mine=1'),
  getQuizAttempts: (quizId) => request(`/api/quizzes/attempts?quiz_id=${quizId}`),

  submitFeedback: (payload) => request('/api/feedback', { method: 'POST', body: payload }),
  getFeedback: (lectureId) => request(`/api/feedback?lecture_id=${lectureId}`),

  getStats: () => request('/api/stats'),
  getAdminReport: () => request('/api/admin/report'),
};

export { getToken };
