import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiFlag, FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiZap, FiAward, FiBook, FiCalendar, FiCheckSquare, FiLayers, FiFilter, FiBell, FiBellOff, FiPlay, FiRotateCcw, FiClock as FiTimer } from 'react-icons/fi';
import { formatContestDateTime, getTimeRemaining, getCountdownText } from '../utils/dateUtils';
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
  const [completedContests, setCompletedContests] = useState(new Set());
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, showCancel: false });
  const [countdowns, setCountdowns] = useState({});
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadContests();
    loadUserRegistrations();
  }, []);

  const loadUserRegistrations = async () => {
    try {
      const data = await api.getUserContestRegistrations();
      // Extract contestId from registration objects
      const registeredIds = new Set((data.registrations || []).map(r => r.contestId || r.contest_id || r.id));
      // Extract completed contests (those with finished_at)
      const completedIds = new Set((data.registrations || []).filter(r => r.finishedAt || r.finished_at).map(r => r.contestId || r.contest_id || r.id));
      setRegisteredContests(registeredIds);
      setCompletedContests(completedIds);
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

  // Countdown effect for contest cards
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns = {};
      contests.forEach(contest => {
        const timeInfo = getTimeRemaining(contest.start_time, contest.end_time);
        newCountdowns[contest.id] = timeInfo;
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const timer = setInterval(updateCountdowns, 1000);
    return () => clearInterval(timer);
  }, [contests]);

  const loadContests = async () => {
    console.log('[Contest.jsx] loadContests: Starting...');
    setLoading(true);
    try {
      console.log('[Contest.jsx] loadContests: Calling API getContests');
      const response = await api.getContests();
      console.log('[Contest.jsx] loadContests: API response:', response);
      console.log('[Contest.jsx] loadContests: Contests count:', response.contests?.length || 0);
      console.log('[Contest.jsx] loadContests: Grouped:', response.grouped);
      setContests(response.contests || []);
    } catch (error) {
      console.error('[Contest.jsx] loadContests: Failed to load contests:', error);
      console.error('[Contest.jsx] loadContests: Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const startContest = async (contest) => {
    // Check if contest is already completed
    if (isContestCompleted(contest.id)) {
      setModal({ 
        isOpen: true, 
        title: 'Contest Already Completed', 
        message: 'You have already completed this contest. Check the "Past" tab to see your results.', 
        onConfirm: () => setModal(m => ({ ...m, isOpen: false })) 
      });
      return;
    }
    
    console.log('[Contest.jsx] startContest: Starting contest:', contest.id);
    try {
      const response = await api.startContest(contest.id);
      console.log('[Contest.jsx] startContest: API response:', response);
      
      if (!response.success) {
        setModal({ isOpen: true, title: 'Error', message: response.error || 'Failed to start contest', onConfirm: () => setModal(m => ({ ...m, isOpen: false })) });
        return;
      }
      
      setActiveContest({
        id: contest.id,
        title: response.contest.title,
        description: response.contest.description,
        timePerQuestion: response.contest.timePerQuestion,
        questionCount: response.contest.questionCount
      });
      setQuestions(response.questions || []);
      setContestStarted(true);
      setCurrentIndex(response.contest.currentQuestion || 0);
      const totalTime = (response.questions?.length || response.contest.questionCount) * response.contest.timePerQuestion;
      setTimeLeft(totalTime);
    } catch (error) {
      console.error('[Contest.jsx] startContest: Failed:', error);
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to start contest. Please try again.', onConfirm: () => setModal(m => ({ ...m, isOpen: false })) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !questions[currentIndex] || !activeContest) return;

    setSubmitting(true);
    try {
      // Calculate time taken for this question (time per question - time left for this question)
      const timePerQuestion = activeContest.timePerQuestion || 30;
      const timeTaken = timePerQuestion - (timeLeft % timePerQuestion || timePerQuestion);
      
      console.log('[Contest.jsx] handleSubmit: Submitting answer for contest:', activeContest.id, 'timeTaken:', timeTaken);
      const result = await api.submitContestAnswer(activeContest.id, questions[currentIndex].id, answer, timeTaken);
      console.log('[Contest.jsx] handleSubmit: Result:', result);
      setFeedback(result);
      await refreshUser();
    } catch (error) {
      console.error('[Contest.jsx] handleSubmit: Failed:', error);
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

  const handleContestEnd = async () => {
    const finishedContestId = activeContest?.id;
    
    setContestStarted(false);
    setActiveContest(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswer('');
    setFeedback(null);
    setTimeLeft(null);
    
    // Mark contest as completed in backend
    if (finishedContestId) {
      try {
        await api.finishContest(finishedContestId);
        setCompletedContests(prev => new Set([...prev, finishedContestId]));
      } catch (error) {
        console.error('Failed to finish contest:', error);
      }
    }
    
    setModal({ 
      isOpen: true, 
      title: 'Thank You!', 
      message: 'Thank you for your participation! You have completed this contest.', 
      onConfirm: () => setModal(m => ({ ...m, isOpen: false })) 
    });
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
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to update registration', onConfirm: () => setModal(m => ({ ...m, isOpen: false })) });
    }
  };

  const isRegistered = (contestId) => {
    return registeredContests.has(contestId);
  };

  const isContestCompleted = (contestId) => {
    return completedContests.has(contestId);
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
              {filterByDifficulty(contests.filter(c => c.status === 'active' && !isContestCompleted(c.id))).length}
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
              {filterByDifficulty(contests.filter(c => c.status === 'passed')).length}
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
            {filterByDifficulty(contests.filter(c => c.status === 'active' && !isContestCompleted(c.id))).length}
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
            {filterByDifficulty(contests.filter(c => c.status === 'passed')).length}
          </span>
        </button>
      </div>

      {/* Contests based on active tab */}
      {activeTab === 'available' && (
        <>
          {filterByDifficulty(contests.filter(c => c.status === 'active' && !isContestCompleted(c.id))).length > 0 ? (
            <div className="contests-grid">
              {filterByDifficulty(contests.filter(c => c.status === 'active' && !isContestCompleted(c.id))).map((contest) => (
                <div key={contest.id} className="contest-card">
                  <div className="contest-card-header">
                    <div className="contest-icon-wrapper">
                      <FiFlag size={28} />
                    </div>
                    <span className={`difficulty-tag ${contest.grade_level_name?.toLowerCase() || 'all'}`}>
                      {contest.grade_level_name || 'All Levels'}
                    </span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject_name || 'General'}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{Math.ceil((contest.time_per_question * contest.question_count)/60)} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.question_count} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.time_per_question}s per question</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-value">
                        {formatContestDateTime(contest.start_time)}
                      </span>
                      <span className="date-countdown">
                        {countdowns[contest.id] && getCountdownText(countdowns[contest.id])}
                      </span>
                    </div>
                  </div>
                  <button className="start-contest-btn" onClick={() => startContest(contest)}>
                    <span>Start Contest</span>
                    <FiPlay size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon"><FiFlag size={64} /></div>
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
                    <div className="contest-icon-wrapper"><FiClock size={28} /></div>
                    <span className={`status-badge upcoming`}>Upcoming</span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject_name || 'General'}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{Math.ceil((contest.time_per_question * contest.question_count)/60)} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.question_count} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.time_per_question}s per question</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-value">
                        {formatContestDateTime(contest.start_time)}
                      </span>
                      <span className="date-countdown">
                        {countdowns[contest.id] && getCountdownText(countdowns[contest.id])}
                      </span>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon"><FiClock size={64} /></div>
              <h2>No Upcoming Contests</h2>
              <p>Check back later for new contests!</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'ended' && (
        <>
          {filterByDifficulty(contests.filter(c => c.status === 'passed' || isContestCompleted(c.id))).length > 0 ? (
            <div className="contests-grid">
              {filterByDifficulty(contests.filter(c => c.status === 'passed' || isContestCompleted(c.id))).map((contest) => (
                <div key={contest.id} className="contest-card ended">
                  <div className="contest-card-header">
                    <div className="contest-icon-wrapper"><FiCheckSquare size={28} /></div>
                    <span className={`status-badge ended`}>{isContestCompleted(contest.id) ? 'Completed' : 'Ended'}</span>
                  </div>
                  <h3 className="contest-title">{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  <div className="contest-details">
                    <div className="contest-detail">
                      <FiBook size={16} />
                      <span>{contest.subject_name || 'General'}</span>
                    </div>
                    <div className="contest-detail">
                      <FiClock size={16} />
                      <span>{Math.ceil((contest.time_per_question * contest.question_count)/60)} min</span>
                    </div>
                    <div className="contest-detail">
                      <FiLayers size={16} />
                      <span>{contest.question_count} questions</span>
                    </div>
                    <div className="contest-detail prize">
                      <FiAward size={16} />
                      <span>{contest.time_per_question}s per question</span>
                    </div>
                  </div>
                  <div className="contest-dates">
                    <div className="contest-date">
                      <span className="date-value">
                        {formatContestDateTime(contest.start_time)}
                      </span>
                      <span className="date-countdown">
                        Contest Ended
                      </span>
                    </div>
                  </div>
                  <button className="contest-ended-btn" disabled>
                    <FiCheckCircle size={18} />
                    <span>{isContestCompleted(contest.id) ? 'You Completed' : 'Contest Ended'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-contests-container">
              <div className="no-contests-icon"><FiCheckSquare size={64} /></div>
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

      {/* Modal */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal(m => ({ ...m, isOpen: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal.title}</h3>
              <button 
                className="modal-close" 
                onClick={() => setModal(m => ({ ...m, isOpen: false }))}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{modal.message}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  setModal(m => ({ ...m, isOpen: false }));
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}