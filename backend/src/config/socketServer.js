import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './index.js';
import challengeRoomManager from '../services/challengeRoomManager.js';

let io = null;

export const initializeSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsConfig.origin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch (error) {
      globalThis.appLogger.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('create_challenge', async (data, callback) => {
      try {
        const { roomCode } = data;

        socket.join(roomCode);
        socket.currentRoom = roomCode;

        callback({ success: true, data: { roomCode } });

        socket.to(roomCode).emit('host_joined', {
          hostId: socket.userId,
          hostName: socket.user.displayName || 'Player 1'
        });
      } catch (error) {
        globalThis.appLogger.error('Create challenge socket error:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('join_challenge', async (data, callback) => {
      try {
        const { roomCode } = data;
        const room = await challengeRoomManager.getRoomInfo(roomCode);
        if (!room) {
          throw new Error('Room not found');
        }

        socket.join(roomCode);
        socket.currentRoom = roomCode;

        callback({ success: true, data: { roomCode, status: room.status } });

        socket.to(roomCode).emit('opponent_joined', {
          opponentId: socket.userId,
          opponentName: socket.user.displayName || 'Player 2'
        });

        if (room.opponent_id) {
          io.to(roomCode).emit('game_ready', {
            message: 'Both players joined! Game starting...',
            countdown: 3
          });

          let countdown = 3;
          const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              io.to(roomCode).emit('countdown', { countdown });
            } else {
              clearInterval(countdownInterval);
              startGame(roomCode);
            }
          }, 1000);
        }
      } catch (error) {
        globalThis.appLogger.error('Join challenge socket error:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('player_ready', async (data, callback) => {
      try {
        const { roomCode, isReady } = data;
        const result = await challengeRoomManager.setPlayerReady({
          roomCode,
          userId: socket.userId,
          isReady
        });

        callback({ success: true, data: result });

        socket.to(roomCode).emit('opponent_ready', {
          userId: socket.userId,
          isReady
        });

        if (result.bothReady) {
          io.to(roomCode).emit('game_ready', {
            message: 'Both players ready! Starting game...',
            countdown: 3
          });

          let countdown = 3;
          const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
              io.to(roomCode).emit('countdown', { countdown });
            } else {
              clearInterval(countdownInterval);
              startGame(roomCode);
            }
          }, 1000);
        }
      } catch (error) {
        globalThis.appLogger.error('Player ready error:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('submit_answer', async (data, callback) => {
      try {
        const { roomCode, questionId, answer, timeTaken } = data;
        const result = await challengeRoomManager.submitAnswer({
          roomCode,
          userId: socket.userId,
          questionId,
          answer,
          timeTaken
        });

        callback({ success: true, data: result });

        io.to(roomCode).emit('score_update', {
          scores: result.scores,
          currentQuestion: result.currentQuestion
        });

        if (result.gameComplete) {
          io.to(roomCode).emit('game_complete', {
            finalScores: result.scores,
            winner: result.winner,
            message: result.winner ? `${result.winner.name} wins!` : "It's a tie!"
          });
        } else if (result.nextQuestion) {
          setTimeout(() => {
            io.to(roomCode).emit('next_question', {
              question: result.nextQuestion,
              questionNumber: result.currentQuestion + 1,
              totalQuestions: result.totalQuestions
            });
          }, 2000);
        }
      } catch (error) {
        globalThis.appLogger.error('Submit answer error:', error);
        callback({ success: false, error: error.message });
      }
    });

    socket.on('time_up', async (data) => {
      try {
        const { roomCode, questionId } = data;
        const result = await challengeRoomManager.handleTimeUp({
          roomCode,
          userId: socket.userId,
          questionId
        });

        io.to(roomCode).emit('score_update', {
          scores: result.scores,
          currentQuestion: result.currentQuestion
        });

        if (result.nextQuestion) {
          setTimeout(() => {
            io.to(roomCode).emit('next_question', {
              question: result.nextQuestion,
              questionNumber: result.currentQuestion + 1,
              totalQuestions: result.totalQuestions
            });
          }, 2000);
        }
      } catch (error) {
        globalThis.appLogger.error('Time up error:', error);
      }
    });

    socket.on('leave_challenge', async (data) => {
      try {
        const { roomCode } = data;
        await challengeRoomManager.leaveRoom({
          roomCode,
          userId: socket.userId
        });

        socket.leave(roomCode);
        socket.to(roomCode).emit('opponent_left', {
          message: 'Opponent left the challenge'
        });
      } catch (error) {
        globalThis.appLogger.error('Leave challenge error:', error);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.currentRoom) {
        try {
          await challengeRoomManager.handleDisconnect({
            roomCode: socket.currentRoom,
            userId: socket.userId
          });

          socket.to(socket.currentRoom).emit('opponent_disconnected', {
            message: 'Opponent disconnected'
          });
        } catch (error) {
          globalThis.appLogger.error('Disconnect handling error:', error);
        }
      }
    });
  });

  return io;
};

const startGame = async (roomCode) => {
  try {
    const result = await challengeRoomManager.startGame(roomCode);

    io.to(roomCode).emit('game_started', {
      message: 'Game started!',
      firstQuestion: result.firstQuestion,
      questionNumber: 1,
      totalQuestions: result.totalQuestions,
      timePerQuestion: result.timePerQuestion
    });
  } catch (error) {
    globalThis.appLogger.error('Start game error:', error);
    io.to(roomCode).emit('game_error', {
      error: 'Failed to start game'
    });
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export default { initializeSocketServer, getIO };
