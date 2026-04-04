import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Handshake, Gamepad2, Swords, Clock, Target, User, Users } from 'lucide-react';
import { challengeApi, challengeSocket } from '../services/challengeService';
import { api } from '../services/api';
import './Challenge.css';

import { useAuth } from '../context/AuthContext';

const Challenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Game states: 'lobby', 'waiting', 'countdown', 'playing', 'results'
  const [gameState, setGameState] = useState('lobby');
  const [error, setError] = useState('');
  
  // Room data
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // Game settings
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(10);
  
  // Game data
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [answer, setAnswer] = useState('');
  const [scores, setScores] = useState({ you: 0, opponent: 0 });
  const [playerNames, setPlayerNames] = useState({ you: 'You', opponent: 'Opponent' });
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameResult, setGameResult] = useState(null);
  const [countdownMessage, setCountdownMessage] = useState('');
  
  const timerRef = useRef(null);
  const hasAnsweredRef = useRef(false);

  // Load subjects on mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await api.getSubjects();
        if (data.subjects) {
          setSubjects(data.subjects);
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    loadSubjects();
  }, []);

  // Socket event listeners
  useEffect(() => {
    // Connect socket
    challengeSocket.connect();

    // Setup event listeners
    challengeSocket.onOpponentJoined((data) => {
      setOpponentName(data.opponentName || 'Opponent');
      setPlayerNames(prev => ({ ...prev, opponent: data.opponentName || 'Opponent' }));
    });

    challengeSocket.onGameReady((data) => {
      setCountdownMessage(data.message);
      setGameState('countdown');
    });

    challengeSocket.onCountdown((data) => {
      setCountdown(data.countdown);
    });

    challengeSocket.onGameStarted((data) => {
      setCurrentQuestion(data.firstQuestion);
      setQuestionNumber(1);
      setTotalQuestions(data.totalQuestions);
      setTimeLeft(data.timePerQuestion);
      setGameState('playing');
      hasAnsweredRef.current = false;
      setAnswer('');
    });

    challengeSocket.onNextQuestion((data) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTimeLeft(timePerQuestion);
      hasAnsweredRef.current = false;
      setAnswer('');
    });

    challengeSocket.onScoreUpdate((data) => {
      const currentUserId = user?.id;
      const you = data.scores.find(s => s.userId === currentUserId);
      const opponent = data.scores.find(s => s.userId !== currentUserId);
      
      setScores({
        you: you?.score || 0,
        opponent: opponent?.score || 0
      });
    });

    challengeSocket.onGameComplete((data) => {
      setGameResult(data);
      setGameState('results');
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    });

    challengeSocket.onOpponentLeft(() => {
      setError('Opponent left the challenge');
      setTimeout(() => {
        resetGame();
      }, 3000);
    });

    challengeSocket.onOpponentDisconnected(() => {
      setError('Opponent disconnected. You win by default!');
      setTimeout(() => {
        resetGame();
      }, 3000);
    });

    challengeSocket.onGameError((data) => {
      setError(data.error || 'Game error occurred');
    });

    // Cleanup
    return () => {
      challengeSocket.removeAllListeners();
      challengeSocket.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timePerQuestion]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && !hasAnsweredRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time up
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, timeLeft, currentQuestion]);

  const handleTimeUp = () => {
    if (!hasAnsweredRef.current && currentQuestion) {
      hasAnsweredRef.current = true;
      challengeSocket.timeUp(roomCode, currentQuestion.id);
    }
  };

  const createChallenge = async () => {
    try {
      setError('');
      const result = await challengeApi.createChallenge({
        subject: selectedSubject,
        difficulty,
        questionCount,
        timePerQuestion
      });

      if (result.success) {
        setRoomCode(result.data.roomCode);
        setIsHost(true);
        setGameState('waiting');
        
        // Join socket room (use room code from REST API)
        challengeSocket.createChallenge({
          roomCode: result.data.roomCode,
          subject: selectedSubject,
          difficulty,
          questionCount,
          timePerQuestion
        }, (response) => {
          if (!response.success) {
            setError(response.error || 'Failed to create challenge');
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create challenge');
    }
  };

  const joinChallenge = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    try {
      setError('');
      const result = await challengeApi.joinChallenge(joinCode.toUpperCase());

      if (result.success) {
        setRoomCode(joinCode.toUpperCase());
        setIsHost(false);
        setOpponentName(result.data.hostName);
        setPlayerNames(prev => ({ ...prev, opponent: result.data.hostName }));
        
        // Join socket room
        challengeSocket.joinChallenge(joinCode.toUpperCase(), (response) => {
          if (response.success) {
            setGameState('countdown');
          } else {
            setError(response.error || 'Failed to join challenge');
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to join challenge');
    }
  };

  const submitAnswer = () => {
    if (!answer.trim() || hasAnsweredRef.current || !currentQuestion) return;

    hasAnsweredRef.current = true;
    const timeTaken = timePerQuestion - timeLeft;
    
    challengeSocket.submitAnswer(
      roomCode,
      currentQuestion.id,
      answer,
      timeTaken,
      (response) => {
        if (!response.success) {
          setError(response.error || 'Failed to submit answer');
        }
      }
    );
  };

  const resetGame = () => {
    setGameState('lobby');
    setRoomCode('');
    setIsHost(false);
    setOpponentName('');
    setJoinCode('');
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setScores({ you: 0, opponent: 0 });
    setAnswer('');
    setError('');
    setGameResult(null);
    hasAnsweredRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    challengeSocket.removeAllListeners();
  };

  const leaveChallenge = () => {
    if (roomCode) {
      challengeSocket.leaveChallenge(roomCode);
    }
    resetGame();
  };

  // Render Lobby
  const renderLobby = () => (
    <div className="challenge-lobby">
      <div className="lobby-section create-section">
        <h2>Create Challenge</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Subject (optional)</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="form-group">
          <label>Questions</label>
          <select value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))}>
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
          </select>
        </div>

        <div className="form-group">
          <label>Time per Question (seconds)</label>
          <select value={timePerQuestion} onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={20}>20 seconds</option>
          </select>
        </div>

        <button className="btn-primary" onClick={createChallenge}>
          Create Challenge Room
        </button>
      </div>

      <div className="lobby-section join-section">
        <h2>Join Challenge</h2>
        
        <div className="form-group">
          <label>Room Code</label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code (e.g., A7K9P2)"
            maxLength={6}
          />
        </div>

        <button className="btn-primary" onClick={joinChallenge}>
          Join Challenge
        </button>
      </div>
    </div>
  );

  // Render Waiting Room
  const renderWaiting = () => (
    <div className="waiting-room">
      <div className="room-code-display">
        <h3>Your Room Code</h3>
        <div className="room-code">{roomCode}</div>
      </div>
      
      <div className="waiting-message">
        <div className="spinner"></div>
        <p>Waiting for opponent to join...</p>
        <p>Share this code with your friend!</p>
      </div>

      <button className="btn-secondary" onClick={leaveChallenge}>
        Cancel Challenge
      </button>
    </div>
  );

  // Render Countdown
  const renderCountdown = () => (
    <div className="countdown-overlay">
      <div className="countdown-message">{countdownMessage || 'Game starting...'}</div>
      <div className="countdown-number">{countdown}</div>
    </div>
  );

  // Render Game
  const renderGame = () => (
    <div className="challenge-game">
      <div className="game-header">
        <div className={`score-item you ${scores.you > scores.opponent ? 'winner' : ''}`}>
          <div className="score-label">You</div>
          <div className="score-value">{scores.you}</div>
        </div>
        
        <div className="timer">
          <div className={`timer-value ${timeLeft <= 3 ? 'warning' : ''}`}>
            {timeLeft}s
          </div>
          <div className="question-counter">
            Question {questionNumber} of {totalQuestions}
          </div>
        </div>
        
        <div className={`score-item opponent ${scores.opponent > scores.you ? 'winner' : ''}`}>
          <div className="score-label">{playerNames.opponent}</div>
          <div className="score-value">{scores.opponent}</div>
        </div>
      </div>

      {currentQuestion && (
        <div className="question-card">
          <span className="question-subject">{currentQuestion.subject}</span>
          <h3 className="question-text">{currentQuestion.content}</h3>
          
          <div className="answer-input-container">
            <input
              type="text"
              className="answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
              placeholder="Type your answer..."
              disabled={hasAnsweredRef.current}
              autoFocus
            />
            <button 
              className="submit-btn"
              onClick={submitAnswer}
              disabled={!answer.trim() || hasAnsweredRef.current}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render Results
  const renderResults = () => {
    const currentUserId = user?.id;
    const isWinner = gameResult?.winner?.id === currentUserId;
    const isTie = !gameResult?.winner;
    
    return (
      <div className="challenge-results">
        <div className="results-card">
          <div className="trophy-icon">
            {isWinner ? <Trophy size={80} color="white" /> : isTie ? <Handshake size={80} color="white" /> : <Gamepad2 size={80} color="white" />}
          </div>
          
          <h2 className={`result-title ${isWinner ? 'winner' : isTie ? 'tie' : 'loser'}`}>
            {isWinner ? 'You Won!' : isTie ? "It's a Tie!" : 'You Lost'}
          </h2>
          
          <div className="final-scores">
            <div className={`final-score-item ${scores.you >= scores.opponent ? 'winner' : ''}`}>
              <div className="final-score-name">You</div>
              <div className="final-score-value">{scores.you}</div>
            </div>
            <div className={`final-score-item ${scores.opponent > scores.you ? 'winner' : ''}`}>
              <div className="final-score-name">{playerNames.opponent}</div>
              <div className="final-score-value">{scores.opponent}</div>
            </div>
          </div>
          
          <p className="result-message">
            {gameResult?.message || 'Challenge completed!'}
          </p>
          
          <div className="action-buttons">
            <button className="btn-play-again" onClick={resetGame}>
              Play Again
            </button>
            <button className="btn-exit" onClick={() => navigate('/dashboard')}>
              Exit to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="challenge-page">
      <h1>1v1 Challenge</h1>
      
      {gameState === 'lobby' && renderLobby()}
      {gameState === 'waiting' && renderWaiting()}
      {gameState === 'countdown' && renderCountdown()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'results' && renderResults()}
    </div>
  );
};

export default Challenge;
