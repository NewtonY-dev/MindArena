import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
      const data = await api.getSubjects();
      setSubjects(data.subjects || []);
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
        <div className="practice-hero">
          <div className="hero-content">
            <div className="hero-title-section">
              <h1>Practice</h1>
              <p>Master your skills with interactive learning</p>
            </div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-card">
            <span className="filter-icon">🎯</span>
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
          
          <div className="filter-card">
            <span className="filter-icon">⚡</span>
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

        <div className="no-questions-container">
          <div className="no-questions-icon">📚</div>
          <h2>No Questions Found</h2>
          <p>There are no practice questions available for your selected criteria.</p>
          <p>Please select a different subject or check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-page">
      {/* Hero Header */}
      <div className="practice-hero">
        <div className="hero-content">
          <div className="hero-title-section">
            <h1>Practice</h1>
            <p>Master your skills with interactive learning</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-card">
              <span className="hero-stat-icon">📊</span>
              <div className="hero-stat-info">
                <span className="hero-stat-number">{questions.length}</span>
                <span className="hero-stat-label">Total Questions</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">📝</span>
              <div className="hero-stat-info">
                <span className="hero-stat-number">{currentIndex + 1}</span>
                <span className="hero-stat-label">Current</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">⭐</span>
              <div className="hero-stat-info">
                <span className="hero-stat-number">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
                <span className="hero-stat-label">Progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-card">
          <span className="filter-icon">🎯</span>
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
        
        <div className="filter-card">
          <span className="filter-icon">⚡</span>
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
                💡 Need a hint?
              </button>
            )}

            {showHint && currentQuestion.hint && (
              <div className="hint-content">
                <strong>Hint:</strong> {currentQuestion.hint}
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
              <div className={`feedback-section`}>
                <div className={`feedback-card ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="feedback-icon">
                    {feedback.isCorrect ? '🎉' : '❌'}
                  </div>
                  <div className="feedback-title">
                    {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                  </div>
                  <div className="feedback-details">
                    {!feedback.isCorrect && (
                      <p><strong>Correct Answer:</strong> {feedback.correctAnswer}</p>
                    )}
                    {currentQuestion.hint && (
                      <p><strong>Hint:</strong> {currentQuestion.hint}</p>
                    )}
                  </div>
                  <div className={`points-display ${feedback.pointsAwarded > 0 ? 'positive' : ''}`}>
                    {feedback.pointsAwarded > 0 
                      ? `+${feedback.pointsAwarded} point${feedback.pointsAwarded > 1 ? 's' : ''}!`
                      : 'Keep practicing!'}
                    <br />
                    <small>Total: {feedback.totalPoints} points</small>
                  </div>
                  <button className="next-question-btn" onClick={handleNext}>
                    {currentIndex < questions.length - 1 ? 'Next Question →' : 'Start Over ↺'}
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
              ← Previous
            </button>
            <button 
              className="nav-btn" 
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1 && !feedback}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
