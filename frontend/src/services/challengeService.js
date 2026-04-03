import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getToken = () => localStorage.getItem('token');

// Socket.io instance
let socket = null;

// Challenge API methods
export const challengeApi = {
  // Create challenge room
  async createChallenge(settings) {
    const res = await fetch(`${API_BASE_URL}/challenges/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create challenge');
    return data;
  },

  // Join challenge room
  async joinChallenge(roomCode) {
    const res = await fetch(`${API_BASE_URL}/challenges/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ roomCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join challenge');
    return data;
  },

  // Validate room code
  async validateRoomCode(roomCode) {
    const res = await fetch(`${API_BASE_URL}/challenges/validate/${roomCode}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to validate room code');
    return data;
  },

  // Get room info
  async getRoomInfo(roomCode) {
    const res = await fetch(`${API_BASE_URL}/challenges/room/${roomCode}`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get room info');
    return data;
  },

  // Get active challenges
  async getActiveChallenges() {
    const res = await fetch(`${API_BASE_URL}/challenges/active`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get active challenges');
    return data;
  },

  // Get challenge history
  async getChallengeHistory() {
    const res = await fetch(`${API_BASE_URL}/challenges/history`, {
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get challenge history');
    return data;
  },

  // Leave challenge
  async leaveChallenge(roomCode) {
    const res = await fetch(`${API_BASE_URL}/challenges/leave/${roomCode}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to leave challenge');
    return data;
  }
};

// Socket.io connection and event handlers
export const challengeSocket = {
  // Connect to socket server
  connect() {
    if (socket) return socket;

    const token = getToken();
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    return socket;
  },

  // Disconnect
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Get socket instance
  getSocket() {
    if (!socket) {
      return this.connect();
    }
    return socket;
  },

  // Event emitters
  createChallenge(settings, callback) {
    const s = this.getSocket();
    s.emit('create_challenge', settings, callback);
  },

  joinChallenge(roomCode, callback) {
    const s = this.getSocket();
    s.emit('join_challenge', { roomCode }, callback);
  },

  playerReady(roomCode, isReady, callback) {
    const s = this.getSocket();
    s.emit('player_ready', { roomCode, isReady }, callback);
  },

  submitAnswer(roomCode, questionId, answer, timeTaken, callback) {
    const s = this.getSocket();
    s.emit('submit_answer', { roomCode, questionId, answer, timeTaken }, callback);
  },

  timeUp(roomCode, questionId) {
    const s = this.getSocket();
    s.emit('time_up', { roomCode, questionId });
  },

  leaveChallenge(roomCode) {
    const s = this.getSocket();
    s.emit('leave_challenge', { roomCode });
  },

  // Event listeners
  onOpponentJoined(callback) {
    const s = this.getSocket();
    s.on('opponent_joined', callback);
  },

  onOpponentReady(callback) {
    const s = this.getSocket();
    s.on('opponent_ready', callback);
  },

  onGameReady(callback) {
    const s = this.getSocket();
    s.on('game_ready', callback);
  },

  onCountdown(callback) {
    const s = this.getSocket();
    s.on('countdown', callback);
  },

  onGameStarted(callback) {
    const s = this.getSocket();
    s.on('game_started', callback);
  },

  onNextQuestion(callback) {
    const s = this.getSocket();
    s.on('next_question', callback);
  },

  onScoreUpdate(callback) {
    const s = this.getSocket();
    s.on('score_update', callback);
  },

  onGameComplete(callback) {
    const s = this.getSocket();
    s.on('game_complete', callback);
  },

  onOpponentLeft(callback) {
    const s = this.getSocket();
    s.on('opponent_left', callback);
  },

  onOpponentDisconnected(callback) {
    const s = this.getSocket();
    s.on('opponent_disconnected', callback);
  },

  onGameError(callback) {
    const s = this.getSocket();
    s.on('game_error', callback);
  },

  // Remove all listeners
  removeAllListeners() {
    if (socket) {
      socket.removeAllListeners();
    }
  },

  // Unsubscribe specific events
  offOpponentJoined() {
    if (socket) socket.off('opponent_joined');
  },
  offOpponentReady() {
    if (socket) socket.off('opponent_ready');
  },
  offGameReady() {
    if (socket) socket.off('game_ready');
  },
  offCountdown() {
    if (socket) socket.off('countdown');
  },
  offGameStarted() {
    if (socket) socket.off('game_started');
  },
  offNextQuestion() {
    if (socket) socket.off('next_question');
  },
  offScoreUpdate() {
    if (socket) socket.off('score_update');
  },
  offGameComplete() {
    if (socket) socket.off('game_complete');
  },
  offOpponentLeft() {
    if (socket) socket.off('opponent_left');
  },
  offOpponentDisconnected() {
    if (socket) socket.off('opponent_disconnected');
  },
  offGameError() {
    if (socket) socket.off('game_error');
  }
};
