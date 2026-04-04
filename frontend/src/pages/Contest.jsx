import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiFlag, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiZap, FiAward, FiBook, FiCalendar, FiCheckSquare, FiLayers, FiFilter, FiBell, FiBellOff, FiPlay, FiRotateCcw, FiClock as FiTimer } from 'react-icons/fi';
import './Contest.css';

export default function Contest() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContest, setActiveContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [contestStarted, setContestStarted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [activeTab, setActiveTab] = useState('available');
  const [registeredContests, setRegisteredContests] = useState(new Set());
  const { refreshUser } = useAuth();

  // Mock contest data - in a real app, this would come from the backend
  const mockContests = [
    {
      id: 1,
      title: 'Weekly Math Challenge',
      description: 'Test your math skills in this timed challenge!',
      subject: 'Mathematics',
      difficulty: 'medium',
      duration: 10, // minutes
      questionCount: 10,
      startDate: '2026-04-01',
      endDate: '2026-04-07',
      status: 'available',
      prize: '50 points'
    },
    {
      id: 2,
      title: 'Science Olympiad',
      description: 'Comprehensive science quiz covering physics, chemistry, and biology.',
      subject: 'Science',
      difficulty: 'hard',
      duration: 15,
      questionCount: 15,
      startDate: '2026-04-10',
      endDate: '2026-04-20',
      status: 'upcoming',
      prize: '100 points'
    },
    {
      id: 3,
      title: 'Quick Quiz - Easy',
      description: 'A quick warm-up quiz for beginners.',
      subject: 'General',
      difficulty: 'easy',
      duration: 5,
      questionCount: 5,
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      status: 'ended',
      prize: '20 points'
    },
    {
      id: 4,
      title: 'Coding Challenge',
      description: 'Test your programming skills with coding problems.',
      subject: 'Computer Science',
      difficulty: 'hard',
      duration: 20,
      questionCount: 8,
      startDate: '2026-04-15',
      endDate: '2026-04-25',
      status: 'upcoming',
      prize: '150 points'
    },
    {
      id: 5,
      title: 'History Bee',
      description: 'Test your knowledge of world history!',
      subject: 'History',
      difficulty: 'medium',
      duration: 12,
      questionCount: 12,
      startDate: '2026-03-15',
      endDate: '2026-03-25',
      status: 'ended',
      prize: '75 points'
    }
  ];

  useEffect(() => {
    loadContests();
    loadUserRegistrations();
  }, []);

  const loadUserRegistrations = async () => {
    try {
      const data = await api.getUserContestRegistrations();
      const registeredIds = new Set(data.registrations || []);
      setRegisteredContests(registeredIds);
    } catch (error) {
      console.error('Failed to load user registrations:', error);
    }
  };

  useEffect(() => {
    if (contestStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleContestEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [contestStarted, timeLeft]);

  const loadContests = async () => {
    setLoading(true);
    try {
      // In a real app, we'd fetch from the API
      // For now, use mock data
      setTimeout(() => {
        setContests(mockContests);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load contests:', error);
      setLoading(false);
    }
  };

  const startContest = (contest) => {
    setActiveContest(contest);
    setContestStarted(true);
    setTimeLeft(contest.duration * 60); // Convert to seconds
    loadContestQuestions(contest);
  };

  const loadContestQuestions = async (contest) => {
    try {
      // Load questions based on subject and difficulty
      const subjectMap = {
        'Mathematics': 1,
        'Science': 2,
        'General': null
      };
      
      const subjectId = subjectMap[contest.subject] || null;
      const data = await api.getQuestions(subjectId);
      
      // Filter by difficulty if needed
      let filteredQuestions = data.questions || [];
      if (contest.difficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter(
          q => q.difficultyLevel === contest.difficulty
        );
      }
      
      // Take only the number of questions needed
      setQuestions(filteredQuestions.slice(0, contest.questionCount));
    } catch (error) {
      console.error('Failed to load contest questions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !questions[currentIndex]) return;

    setSubmitting(true);
    try {
      const result = await api.submitAnswer(questions[currentIndex].id, answer);
      setFeedback(result);
      await refreshUser();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
      setFeedback(null);
    } else {
      handleContestEnd();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswer('');
      setFeedback(null);
    }
  };

  const handleContestEnd = () => {
    setContestStarted(false);
    setActiveContest(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setFeedback(null);
    setTimeLeft(null);
    alert('Contest has ended! Thanks for participating.');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRegisterContest = async (contestId) => {
    try {
      if (isRegistered(contestId)) {
        // Unregister
        await api.unregisterFromContest(contestId);
        setRegisteredContests(prev => {
          const newSet = new Set(prev);
          newSet.delete(contestId);
          return newSet;
        });
      } else {
        // Register
        await api.registerForContest(contestId);
        setRegisteredContests(prev => {
          const newSet = new Set(prev);
          newSet.add(contestId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to update registration:', error);
      // Show error message to user
      alert(error.message || 'Failed to update registration');
    }
  };

  const isRegistered = (contestId) => {
    return registeredContests.has(contestId);
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="contest-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // If a contest is active, show the contest interface
  if (contestStarted && activeContest) {
    return (
      <div className="contest-page">
        {/* Modern Contest Header */}
        <div className="contest-header">
          <div className="header-icon-large">
            <FiFlag size={40} />
          </div>
          <h1>{activeContest.title}</h1>
          <p>{activeContest.description}</p>
          
          {/* Timer */}
          <div className="header-stats-row">
            <div className="header-stat-pill timer-pill">
              <FiTimer size={20} />
              <span className={`timer-value ${timeLeft < 60 ? 'warning' : ''}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="header-stat-label">Remaining</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-info">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Container */}
        {questions.length === 0 ? (
          <div className="no-questions-container">
            <div className="no-questions-icon">
              <FiLayers size={64} />
            </div>
            <h2>Loading Questions...</h2>
          </div>
        ) : (
          <div className="question-container">
            {/* Main Question Card */}
            <div className="question-main">
              <div className="question-header">
                <span className="question-number">Question #{currentIndex + 1}</span>
                <span className={`difficulty-tag ${currentQuestion?.difficultyLevel}`}>
                  {currentQuestion?.difficultyLevel}
                </span>
              </div>
              
              <div className="question-text">
                {currentQuestion?.content}
              </div>

              <div className="answer-section">
                {!feedback ? (
                  <form onSubmit={handleSubmit}>
                    <div className="answer-input-wrapper">
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="answer-input-field"
                        disabled={submitting}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="submit-answer-btn"
                      disabled={submitting || !answer.trim()}
                    >
                      {submitting ? 'Checking...' : 'Submit Answer'}
                    </button>
                  </form>
                ) : (
                  <div className={`feedback-section`}>
                    <div className={`feedback-card ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                      <div className="feedback-icon">
                        {feedback.isCorrect ? <FiCheckCircle size={64} /> : <FiXCircle size={64} />}
                      </div>
                      <div className="feedback-title">
                        {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                      </div>
                      <div className="feedback-details">
                        {!feedback.isCorrect && (
                          <p><strong>Correct Answer:</strong> {feedback.correctAnswer}</p>
                        )}
                      </div>
                      <div className={`points-display ${feedback.pointsAwarded > 0 ? 'positive' : ''}`}>
                        {feedback.pointsAwarded > 0 
                          ? `+${feedback.pointsAwarded} point${feedback.pointsAwarded > 1 ? 's' : ''}!`
                          : 'Keep going!'}
                        <br />
                        <small>Total: {feedback.totalPoints} points</small>
                      </div>
                      <button className="next-question-btn" onClick={handleNext}>
                        <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Contest'}</span>
                        {currentIndex < questions.length - 1 ? <FiArrowRight size={20} /> : <FiFlag size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Question Navigator */}
            <div className="question-nav">
              <h3>Question Navigator</h3>
              <div className="question-dots">
                {questions.map((_, index) => (
                  <div 
                    key={index}
                    className={`question-dot ${
                      index === currentIndex 
                        ? 'current' 
                        : feedback && index === currentIndex
                          ? feedback.isCorrect ? 'correct' : 'incorrect'
                          : 'unanswered'
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              <div className="nav-buttons">
                <button 
                  className="nav-btn" 
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <FiArrowLeft size={18} />
                  <span>Previous</span>
                </button>
                <button 
                  className="nav-btn" 
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1 && !feedback}
                >
                  <span>Next</span>
                  <FiArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filter contests based on difficulty
  const filterByDifficulty = (contestList) => {
    if (!selectedDifficulty) return contestList;
    return contestList.filter(c => c.difficulty === selectedDifficulty);
  };

  // Show available contests
  return (
    <div className="contest-page">
      {/* Modern Header */}
      <div className="contest-header">
        <div className="header-icon-large">
          <FiAward size={48} />
        </div>
        <h1>Contests</h1>
        <p className="header-subtitle">Compete with others and win exciting prizes!</p>
        
        {/* Stats Row */}
        <div className="header-stats-row">
          <div className="header-stat-pill">
            <FiFlag size={18} />
            <span className="header-stat-value">
              {filterByDifficulty(contests.filter(c => c.status === 'available')).length}
            </span>
            <span className="header-stat-label">Available</span>
          </div>
          <div className="header-stat-pill">
            <FiClock size={18} />
            <span className="header-stat-value">
              {filterByDifficulty(contests.filter(c => c.status === 'upcoming')).length}
            </span>
            <span className="header-stat-label">Upcoming</span>
          </div>
          <div className="header-stat-pill">
            <FiCheckSquare size={18} />
            <span className="header-stat-value">
              {filterByDifficulty(contests.filter(c => c.status === 'ended')).length}
            </span>
            <span className="header-stat-label">Completed</span>
          </div>
        </div>

        {/* Filter */}
        <div className="header-filter-row">
          <div className="filter-card-inline">
            <div className="filter-icon-wrapper">
              <FiFilter size={18} />
            </div>
            <select 
              className="filter-select-inline" 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="contest-tabs">
        <button 
          className={`contest-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          <FiFlag size={20} />
          <span className="tab-label">Available</span>
          <span className="tab-count">
            {filterByDifficulty(contests.filter(c => c.status === 'available')).length}
          </span>
        </button>
        <button 
          className={`contest-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <FiClock size={20} />
          <span className="tab-label">Coming Soon</span>
          <span className="tab-count">
            {filterByDifficulty(contests.filter(c => c.status === 'upcoming')).length}
          </span>
        </button>
        <button 
          className={`contest-tab ${activeTab === 'ended' ? 'active' : ''}`}
          onClick={() => setActiveTab('ended')}
        >
          <FiCheckSquare size={20} />
          <span className="tab-label">Past</span>
          <span className="tab-count">
            {filterByDifficulty(contests.filter(c => c.status === 'ended')).length}
          </span>
        </button>
      </div>

      {/* Contests based on active tab */}
      {activeTab === 'available' && (
        <>
          {filterByDifficulty(contests.filter(c => c.status === 'available')).length > 0 ? (
            <div className="contests-grid">
              {filterByDifficulty(contests.filter(c => c.status === 'available')).map((contest) => (
                <div key={contest.id} className="contest-card">
                  <div className="contest-card-header">
                    <div className="contest-icon-wrapper">
                      <FiFlag size={28} />
                    </div>
                    <span className={`difficulty-tag ${contest.difficulty}`}>
                      {contest.difficulty}
                    </span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{contest.duration} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.questionCount} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.prize}</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-label">Start:</span>
                      <span className="date-value">{new Date(contest.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="contest-date">
                      <span className="date-label">End:</span>
                      <span className="date-value">{new Date(contest.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    className="start-contest-btn"
                    onClick={() => startContest(contest)}
                  >
                    <span>Start Contest</span>
                    <FiPlay size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon">
                <FiFlag size={64} />
              </div>
              <h2>No Available Contests</h2>
              <p>Check the upcoming contests!</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'upcoming' && (
        <>
          {filterByDifficulty(contests.filter(c => c.status === 'upcoming')).length > 0 ? (
            <div className="contests-grid">
              {filterByDifficulty(contests.filter(c => c.status === 'upcoming')).map((contest) => (
                <div key={contest.id} className="contest-card upcoming">
                  <div className="contest-card-header">
                    <div className="contest-icon-wrapper">
                      <FiClock size={28} />
                    </div>
                    <span className={`status-badge upcoming`}>Upcoming</span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{contest.duration} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.questionCount} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.prize}</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-label">Starts:</span>
                      <span className="date-value">{new Date(contest.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="contest-date">
                      <span className="date-label">Ends:</span>
                      <span className="date-value">{new Date(contest.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="contest-actions">
                    <button 
                      className={`register-btn ${isRegistered(contest.id) ? 'registered' : ''}`}
                      onClick={() => handleRegisterContest(contest.id)}
                    >
                      <span className="register-btn-icon">
                        {isRegistered(contest.id) ? <FiCheckCircle size={20} /> : <FiBell size={20} />}
                      </span>
                      <span className="register-btn-text">
                        {isRegistered(contest.id) ? 'Registered' : 'Register for Contest'}
                      </span>
                    </button>
                    <div className="stay-tuned">
                      <FiClock size={16} />
                      <span>
                        {isRegistered(contest.id) 
                          ? "We'll notify you when it starts!" 
                          : "Get notified when this contest begins!"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon">
                <FiClock size={64} />
              </div>
              <h2>No Upcoming Contests</h2>
              <p>Check back later for new contests!</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'ended' && (
        <>
          {filterByDifficulty(contests.filter(c => c.status === 'ended')).length > 0 ? (
            <div className="contests-grid">
              {filterByDifficulty(contests.filter(c => c.status === 'ended')).map((contest) => (
                <div key={contest.id} className="contest-card ended">
                  <div className="contest-card-header">
                    <div className="contest-icon-wrapper">
                      <FiCheckSquare size={28} />
                    </div>
                    <span className={`status-badge ended`}>Ended</span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{contest.duration} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.questionCount} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.prize}</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-label">Started:</span>
                      <span className="date-value">{new Date(contest.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="contest-date">
                      <span className="date-label">Ended:</span>
                      <span className="date-value">{new Date(contest.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="contest-ended-btn" disabled>
                    <FiCheckCircle size={18} />
                    <span>Contest Ended</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon">
                <FiCheckSquare size={64} />
              </div>
              <h2>No Past Contests</h2>
              <p>No contests have ended yet!</p>
            </div>
          )}
        </>
      )}

      {contests.length === 0 && (
        <div className="no-contests-container">
          <div className="no-contests-icon">
            <FiAward size={64} />
          </div>
          <h2>No Contests Available</h2>
          <p>Check back later for upcoming competitions!</p>
        </div>
      )}
    </div>
  );
}