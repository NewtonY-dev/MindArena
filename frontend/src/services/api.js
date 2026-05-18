const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  async register(email, password, gradeLevelId) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, gradeLevelId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // User
  async getCurrentUser() {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get user');
    return data;
  },

  async updateProfile(gradeLevelId, subjectIds) {
    const res = await fetch(`${API_BASE_URL}/users/me/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ gradeLevelId, subjectIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async getStats() {
    const res = await fetch(`${API_BASE_URL}/users/me/stats`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get stats');
    return data;
  },

  // Subjects
  async getSubjects() {
    const res = await fetch(`${API_BASE_URL}/subjects`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get subjects');
    return data;
  },

  // Grade Levels
  async getGradeLevels() {
    const res = await fetch(`${API_BASE_URL}/grade-levels`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get grade levels');
    return data;
  },

  // Grade Level Subjects
  async getGradeLevelSubjects(gradeLevelId) {
    const res = await fetch(`${API_BASE_URL}/grade-levels/${gradeLevelId}/subjects`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get grade subjects');
    return data;
 },

  // Practice Questions
  async getQuestions(subjectId = null) {
    const url = subjectId 
      ? `${API_BASE_URL}/practice/questions?subjectId=${subjectId}`
      : `${API_BASE_URL}/practice/questions`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get questions');
    return data;
  },

  // Submit Answer (legacy - for MCQ, true/false)
  async submitAnswer(questionId, answerGiven) {
    const res = await fetch(`${API_BASE_URL}/practice/submit`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer: answerGiven })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit answer');
    return data;
  },

  // Grade Short Answer (AI-powered grading)
  async gradeAnswer(questionId, answer) {
    const res = await fetch(`${API_BASE_URL}/questions/${questionId}/grade`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grade answer');
    return data;
  },

  // Contest Methods
  async getContests(difficulty = null) {
    const url = difficulty 
      ? `${API_BASE_URL}/contests?difficulty=${difficulty}`
      : `${API_BASE_URL}/contests`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contests');
    return data;
  },

  async getContestById(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contest');
    return data;
  },

  async startContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}/start`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to start contest');
    return data;
  },

  async submitContestAnswer(contestId, questionId, answer, timeTaken = 0) {
    const res = await fetch(`${API_BASE_URL}/contests/submit`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ contestId, questionId, answer, timeTaken })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit contest answer');
    return data;
  },

  async getContestLeaderboard(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}/leaderboard`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contest leaderboard');
    return data;
  },

  // Contest Registration Methods
  async registerForContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}/register`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register for contest');
    return data;
  },

  async unregisterFromContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}/register`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to unregister from contest');
    return data;
  },

  async getUserContestRegistrations() {
    const res = await fetch(`${API_BASE_URL}/contests/registrations/my`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contest registrations');
    return data;
  },

  async finishContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/contests/${contestId}/finish`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to finish contest');
    return data;
  },

  // Leaderboard
  async getLeaderboard() {
    const res = await fetch(`${API_BASE_URL}/leaderboard`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get leaderboard');
    return data;
  },

  // Admin - Create Question
  async createQuestion(questionData) {
    console.log('API createQuestion called with:', questionData);
    console.log('API createQuestion URL:', `${API_BASE_URL}/questions`);
    console.log('API createQuestion auth headers:', getAuthHeaders());
    
    const res = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(questionData)
    });
    
    console.log('API createQuestion response status:', res.status, res.statusText);
    
    const data = await res.json();
    console.log('API createQuestion response data:', data);
    
    if (!res.ok) {
      console.error('API createQuestion failed:', data);
      throw new Error(data.error || 'Failed to create question');
    }
    return data;
  },

  // Admin - Get All Questions
  async getAllQuestions() {
    const res = await fetch(`${API_BASE_URL}/questions`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get questions');
    return data;
  },

  // Admin - Update Question
  async updateQuestion(questionId, questionData) {
    const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(questionData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update question');
    return data;
  },

  // Admin - Delete Question
  async deleteQuestion(questionId) {
    const res = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete question');
    return data;
  },

  // Admin - Contest Methods
  async getAdminContests() {
    const res = await fetch(`${API_BASE_URL}/admin/contests`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contests');
    return data;
  },

  async createContest(contestData) {
    const res = await fetch(`${API_BASE_URL}/admin/contests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(contestData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create contest');
    return data;
  },

  async deleteContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/admin/contests/${contestId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete contest');
    return data;
  },

  async getAdminContest(contestId) {
    const res = await fetch(`${API_BASE_URL}/admin/contests/${contestId}`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get contest');
    return data;
  },

  async updateContestQuestions(contestId, questionIds) {
    const res = await fetch(`${API_BASE_URL}/admin/contests/${contestId}/questions`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify({ questionIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update contest questions');
    return data;
  },

  async updateContest(contestId, contestData) {
    const res = await fetch(`${API_BASE_URL}/admin/contests/${contestId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(contestData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update contest');
    return data;
  },
};
