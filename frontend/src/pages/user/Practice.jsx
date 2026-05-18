import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiFilter, FiZap, FiBarChart2, FiCheckCircle, FiXCircle, FiSun, FiArrowRight, FiArrowLeft, FiRotateCcw, FiLayers } from 'react-icons/fi';
import './Practice.css';

export default function Practice() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      loadQuestions(selectedSubject, selectedDifficulty);
    }
  }, [selectedSubject, selectedDifficulty, subjects]);

const loadSubjects = async () => {
  try {
    const userData = await api.getCurrentUser();

    // Fetch all subjects, then filter to user's enrolled ones
    const allSubjectsData = await api.getSubjects();
    const enrolledSubjectIds = userData.subjectIds || [];

    const filtered = (allSubjectsData.subjects || []).filter(
      s => enrolledSubjectIds.includes(s.id)
    );

    setSubjects(filtered);
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
};

  const loadQuestions = async (subjectId, difficulty) => {
    setLoading(true);
    setFeedback(null);
    setAnswer('');
    setShowHint(false);
    setCurrentIndex(0);
    
    try {
      const data = await api.getQuestions(subjectId, difficulty);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim() || !questions[currentIndex]) return;

    setSubmitting(true);
    try {
      const result = await api.gradeAnswer(questions[currentIndex].id, answer);
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
      setShowHint(false);
    } else {
      // Restart
      setCurrentIndex(0);
      setAnswer('');
      setFeedback(null);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAnswer('');
      setFeedback(null);
      setShowHint(false);
    }
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    setAnswer('');
    setFeedback(null);
    setShowHint(false);
  };

  const currentQuestion = questions[currentIndex];

  if (loading) {
    return (
      <div className="practice-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="practice-page">
        <div className="practice-header">
          <div className="header-icon-large">
            <FiBook size={40} />
          </div>
          <h1>Practice</h1>
          <p>Master your skills with interactive learning</p>
        </div>

        <div className="filters-section">
          <div className="filter-card">
            <div className="filter-icon-wrapper">
              <FiFilter size={20} />
            </div>
            <div className="filter-content">
              <span className="filter-label">Subject</span>
              <select 
                className="filter-select" 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-card">
            <div className="filter-icon-wrapper">
              <FiZap size={20} />
            </div>
            <div className="filter-content">
              <span className="filter-label">Difficulty</span>
              <select 
                className="filter-select" 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        <div className="no-questions-container">
          <div className="no-questions-icon">
            <FiBook size={64} />
          </div>
          <h2>No Practice Questions Found</h2>
          <p>There are no practice questions available for your selected criteria.</p>
          <p>Practice questions are those not assigned to contests. Try selecting a different subject or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      {/* Modern Header */}
      <div className="practice-header">
        <div className="header-icon-large">
          <FiBook size={40} />
        </div>
        <h1>Practice</h1>
        <p>Master your skills with interactive learning</p>
        
        {/* Header Stats Row */}
        <div className="header-stats-row">
          <div className="header-stat-pill">
            <FiLayers size={20} />
            <span className="header-stat-value">{questions.length}</span>
            <span className="header-stat-label">Total</span>
          </div>
          <div className="header-stat-pill">
            <FiBarChart2 size={20} />
            <span className="header-stat-value">{currentIndex + 1}</span>
            <span className="header-stat-label">Current</span>
          </div>
          <div className="header-stat-pill">
            <FiCheckCircle size={20} />
            <span className="header-stat-value">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            <span className="header-stat-label">Progress</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-card">
          <div className="filter-icon-wrapper">
            <FiFilter size={20} />
          </div>
          <div className="filter-content">
            <span className="filter-label">Subject</span>
            <select 
              className="filter-select" 
              value={selectedSubject} 
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="filter-card">
          <div className="filter-icon-wrapper">
            <FiZap size={20} />
          </div>
          <div className="filter-content">
            <span className="filter-label">Difficulty</span>
            <select 
              className="filter-select" 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
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
      <div className="question-container">
        {/* Main Question Card */}
        <div className="question-main">
          <div className="question-header">
            <span className="question-number">Question #{currentIndex + 1}</span>
            <span className={`difficulty-tag ${currentQuestion.difficultyLevel}`}>
              {currentQuestion.difficultyLevel}
            </span>
          </div>
          
          <div className="question-text">
            {currentQuestion.content}
          </div>

          <div className="answer-section">
            {!feedback && currentQuestion.hint && !showHint && (
              <button className="hint-toggle" onClick={() => setShowHint(true)}>
                <FiSun size={18} />
                <span>Need a hint?</span>
              </button>
            )}

            {showHint && currentQuestion.hint && (
              <div className="hint-content">
                <div className="hint-icon-wrapper">
                  <FiSun size={20} />
                </div>
                <div className="hint-text">
                  <strong>Hint:</strong> {currentQuestion.hint}
                </div>
              </div>
            )}

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
              <div className={`feedback-section simplified`}>
                <div className={`feedback-card ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                  {/* Result Status */}
                  <div className="result-status">
                    <div className="feedback-icon">
                      {feedback.isCorrect ? <FiCheckCircle size={48} /> : <FiXCircle size={48} />}
                    </div>
                    <div className="feedback-title">
                      {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                  
                  {/* Correct Answer Section - Always shown for both correct and incorrect */}
                  <div className="correct-answer-section">
                    <div className="section-label">Correct Answer</div>
                    <div className="correct-answer-text">{feedback.correctAnswer}</div>
                  </div>
                  
                  {/* AI Explanation - Only for incorrect answers */}
                  {!feedback.isCorrect && feedback.explanation && (
                    <div className="ai-explanation-section">
                      <div className="section-label explanation-label">
                        <span className="label-icon">💡</span>
                        Why This is the Correct Answer
                      </div>
                      <div className="explanation-content">
                        {feedback.explanation}
                      </div>
                    </div>
                  )}
                  
                  {/* Next Button */}
                  <button className="next-question-btn" onClick={handleNext}>
                    <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Start Over'}</span>
                    {currentIndex < questions.length - 1 ? <FiArrowRight size={20} /> : <FiRotateCcw size={20} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question Navigator Sidebar */}
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
                onClick={() => handleDotClick(index)}
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
    </div>
  );
}
