import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './AdminManageQuestions.css';
import { FiEdit2, FiTrash2, FiX, FiFilter, FiPlus, FiFileText, FiCheck, FiAlertCircle, FiHelpCircle, FiCheckCircle, FiBarChart2, FiZap, FiBookOpen, FiSave } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AdminManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter states
  const [gradeLevels, setGradeLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const [formData, setFormData] = useState({
    content: '',
    correctAnswer: '',
    hint: '',
    explanation: '',
    difficultyLevel: 'medium'
  });

  useEffect(() => {
    loadQuestions();
    loadGradeLevels();
  }, []);

  // Load subjects when grade changes
  useEffect(() => {
    if (selectedGrade) {
      loadSubjects(selectedGrade);
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedGrade]);

  // Filter questions when filters change
  useEffect(() => {
    filterQuestions();
  }, [selectedGrade, selectedSubject, selectedDifficulty, questions]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await api.getAllQuestions();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadGradeLevels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/grade-levels`);
      const data = await res.json();
      setGradeLevels(data.gradeLevels || []);
    } catch (err) {
      console.error('Failed to load grade levels:', err);
    }
  };

  const loadSubjects = async (gradeLevelId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/subjects/grade/${gradeLevelId}`);
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (selectedGrade) {
      filtered = filtered.filter(q => q.grade_level_id === parseInt(selectedGrade));
    }

    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject_id === parseInt(selectedSubject));
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty_level === selectedDifficulty);
    }

    setFilteredQuestions(filtered);
  };

  const clearFilters = () => {
    setSelectedGrade('');
    setSelectedSubject('');
    setSelectedDifficulty('');
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      content: question.content || '',
      correctAnswer: question.correct_answer || '',
      hint: question.hint || '',
      explanation: question.explanation || '',
      difficultyLevel: question.difficulty_level || 'medium'
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateQuestion(editingQuestion.id, {
        content: formData.content.trim(),
        correctAnswer: formData.correctAnswer.trim(),
        hint: formData.hint.trim() || null,
        explanation: formData.explanation.trim() || null,
        difficultyLevel: formData.difficultyLevel
      });
      setSuccessMessage('Question updated successfully!');
      setEditingQuestion(null);
      loadQuestions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update question');
    }
  };

  const handleDelete = async (questionId) => {
    try {
      await api.deleteQuestion(questionId);
      setSuccessMessage('Question deleted successfully!');
      setDeleteConfirm(null);
      loadQuestions();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete question');
    }
  };

  const getDifficultyClass = (level) => {
    switch (level) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="manage-questions-page">
        <div className="loading-state">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="manage-questions-page">
      {/* Modern Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="header-text">
            <h1>Manage Questions</h1>
            <p>View, edit, and organize your question library</p>
          </div>
        </div>
        <a href="/admin/questions/create" className="header-action-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Create New
        </a>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{questions.length}</span>
          <span className="stat-label">Total Questions</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">{filteredQuestions.length}</span>
          <span className="stat-label">Filtered</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">
            {questions.filter(q => q.difficulty_level === 'easy').length}
          </span>
          <span className="stat-label">Easy</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">
            {questions.filter(q => q.difficulty_level === 'medium').length}
          </span>
          <span className="stat-label">Medium</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-value">
            {questions.filter(q => q.difficulty_level === 'hard').length}
          </span>
          <span className="stat-label">Hard</span>
        </div>
      </div>

      {successMessage && (
        <div className="success-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {/* Modern Filter Section */}
      <div className="filter-card">
        <div className="filter-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Filter Questions</span>
        </div>
        <div className="filter-row">
          <div className="filter-field">
            <label>Grade Level</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="">All Grades</option>
              {gradeLevels.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedGrade}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label>Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="easy">● Easy</option>
              <option value="medium">● Medium</option>
              <option value="hard">● Hard</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="questions-container">
        {filteredQuestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3>No questions found</h3>
            <p>{questions.length > 0 ? 'Try adjusting your filters.' : 'Create your first question to get started.'}</p>
            <a href="/admin/questions/create" className="create-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Question
            </a>
          </div>
        ) : (
          <div className="questions-grid">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="question-card">
                <div className="card-header">
                  <div className="card-badges">
                    <span className={`difficulty-badge ${getDifficultyClass(question.difficulty_level)}`}>
                      {question.difficulty_level}
                    </span>
                    <span className="id-badge">#{question.id}</span>
                  </div>
                  <div className="card-menu">
                    <button className="menu-btn" title="Edit" onClick={() => handleEdit(question)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button className="menu-btn delete" title="Delete" onClick={() => setDeleteConfirm(question)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <p className="question-text">{question.content}</p>
                  
                  <div className="answer-box">
                    <span className="answer-label">Answer:</span>
                    <span className="answer-value">{question.correct_answer}</span>
                  </div>

                  {(question.hint || question.explanation) && (
                    <div className="extra-info">
                      {question.hint && (
                        <div className="info-row">
                          <span className="info-label">💡 Hint:</span>
                          <span className="info-text">{question.hint}</span>
                        </div>
                      )}
                      {question.explanation && (
                        <div className="info-row">
                          <span className="info-label">📖 Explanation:</span>
                          <span className="info-text">{question.explanation}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <div className="meta-tags">
                    <span className="meta-tag">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                      </svg>
                      {question.grade_level_name}
                    </span>
                    <span className="meta-tag">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      {question.subject_name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="modal-overlay" onClick={() => setEditingQuestion(null)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon edit-icon">
                <FiEdit2 size={28} />
              </div>
              <h2>Edit Question</h2>
              <p className="modal-subtitle">Update question details</p>
            </div>
            
            <form onSubmit={handleUpdate}>
              <div className="form-section">
                <label className="form-label">
                  <FiHelpCircle className="label-icon" />
                  Question Text
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-section half">
                  <label className="form-label">
                    <FiCheckCircle className="label-icon" />
                    Correct Answer
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({...formData, correctAnswer: e.target.value})}
                    placeholder="Answer"
                    required
                  />
                </div>
                <div className="form-section half">
                  <label className="form-label">
                    <FiBarChart2 className="label-icon" />
                    Difficulty
                  </label>
                  <select
                    className="form-select"
                    value={formData.difficultyLevel}
                    onChange={(e) => setFormData({...formData, difficultyLevel: e.target.value})}
                  >
                    <option value="easy">● Easy</option>
                    <option value="medium">● Medium</option>
                    <option value="hard">● Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">
                  <FiZap className="label-icon" />
                  Hint <span className="optional">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.hint}
                  onChange={(e) => setFormData({...formData, hint: e.target.value})}
                  placeholder="Provide a hint to help students..."
                />
              </div>

              <div className="form-section">
                <label className="form-label">
                  <FiBookOpen className="label-icon" />
                  Explanation <span className="optional">(Optional)</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <FiSave style={{marginRight: '8px'}} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon delete-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h2>Delete Question</h2>
              <p className="modal-subtitle">This action cannot be undone</p>
            </div>

            <div className="delete-content">
              <div className="delete-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span>Are you sure you want to permanently delete this question?</span>
              </div>
              
              <div className="delete-preview-card">
                <div className="preview-header">
                  <span className={`preview-badge ${getDifficultyClass(deleteConfirm.difficulty_level)}`}>
                    {deleteConfirm.difficulty_level}
                  </span>
                  <span className="preview-id">ID: {deleteConfirm.id}</span>
                </div>
                <p className="preview-content">{deleteConfirm.content}</p>
                <div className="preview-meta">
                  <span>Grade: {deleteConfirm.grade_level_name}</span>
                  <span>Subject: {deleteConfirm.subject_name}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions delete-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Keep Question
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
