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

  // Authentication middleware for socket connections
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
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}, Socket ID: ${socket.id}`);

    // Create Challenge Room (socket only joins to existing room created via REST)
    socket.on('create_challenge', async (data, callback) => {
      try {
        const { roomCode, subject, difficulty, questionCount, timePerQuestion } = data;
        
        // Just join the socket room - room already created via REST
        socket.join(roomCode);
        socket.currentRoom = roomCode;
        
        callback({ success: true, data: { roomCode } });
        
        // Notify room of new host
        socket.to(roomCode).emit('host_joined', {
          hostId: socket.userId,
          hostName: socket.user.displayName || 'Player 1'
        });
      } catch (error) {
        console.error('Create challenge socket error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Join Challenge Room (socket only - DB already updated via REST)
    socket.on('join_challenge', async (data, callback) => {
      try {
        const { roomCode } = data;
        
        // Get room info (doesn't modify DB - join already done via REST)
        const room = await challengeRoomManager.getRoomInfo(roomCode);
        if (!room) {
          throw new Error('Room not found');
        }

        socket.join(roomCode);
        socket.currentRoom = roomCode;

        callback({ success: true, data: { roomCode, status: room.status } });

        // Notify host that opponent joined
        socket.to(roomCode).emit('opponent_joined', {
          opponentId: socket.userId,
          opponentName: socket.user.displayName || 'Player 2'
        });

        // If room is full, automatically start the game
        if (room.opponent_id) {
          io.to(roomCode).emit('game_ready', {
            message: 'Both players joined! Game starting...',
            countdown: 3
          });

          // Start countdown and then begin game
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
        console.error('Join challenge socket error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Player ready status
    socket.on('player_ready', async (data, callback) => {
      try {
        const { roomCode, isReady } = data;
        const result = await challengeRoomManager.setPlayerReady({
          roomCode,
          userId: socket.userId,
          isReady
        });

        callback({ success: true, data: result });
        
        // Notify opponent of ready status
        socket.to(roomCode).emit('opponent_ready', {
          userId: socket.userId,
          isReady
        });

        // Check if both players are ready
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
        console.error('Player ready error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Submit Answer
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

        // Broadcast updated scores to both players
        io.to(roomCode).emit('score_update', {
          scores: result.scores,
          currentQuestion: result.currentQuestion
        });

        // Check if game is complete
        if (result.gameComplete) {
          io.to(roomCode).emit('game_complete', {
            finalScores: result.scores,
            winner: result.winner,
            message: result.winner ? 
              `${result.winner.name} wins!` : 
              "It's a tie!"
          });
        } else if (result.nextQuestion) {
          // Move to next question after short delay
          setTimeout(() => {
            io.to(roomCode).emit('next_question', {
              question: result.nextQuestion,
              questionNumber: result.currentQuestion + 1,
              totalQuestions: result.totalQuestions
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Submit answer error:', error);
        callback({ success: false, error: error.message });
      }
    });

    // Time up for question
    socket.on('time_up', async (data) => {
      try {
        const { roomCode, questionId } = data;
        const result = await challengeRoomManager.handleTimeUp({
          roomCode,
          userId: socket.userId,
          questionId
        });

        // Broadcast updated scores
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
        console.error('Time up error:', error);
      }
    });

    // Leave Room / Disconnect
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
        console.error('Leave challenge error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
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
          console.error('Disconnect handling error:', error);
        }
      }
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
};

// Helper function to start the game
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
    console.error('Start game error:', error);
    io.to(roomCode).emit('game_error', {
      error: 'Failed to start game'
    });
  }
};

// Get io instance (for use in other modules)
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export default { initializeSocketServer, getIO };
