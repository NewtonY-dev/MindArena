import { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiClock, FiList, FiArrowLeft, FiTrash2, FiEdit2, FiUsers, FiFilter, FiCheckSquare, FiSquare, FiX, FiSave } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './AdminContests.css';

export default function AdminContests() {
  const [contests, setContests] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    content: '',
    questionType: 'multiple_choice',
    correctAnswer: '',
    hint: '',
    difficultyLevel: 'medium',
    options: ['', '', '', '']
  });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    gradeLevelId: '',
    subjectId: '',
    timePerQuestion: 30,
    startTime: '',
    endTime: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContests();
    fetchGradeLevels();
    fetchSubjects();
  }, []);

  const fetchContests = async () => {
    try {
      const data = await api.getAdminContests();
      setContests(data.contests || []);
    } catch (err) {
      console.error('Error fetching contests:', err);
      setError('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const fetchGradeLevels = async () => {
    try {
      const data = await api.getGradeLevels();
      setGradeLevels(data.gradeLevels || []);
    } catch (err) {
      console.error('Error fetching grade levels:', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const addQuestion = () => {
    // Validation
    if (!currentQuestion.content.trim()) {
      setError('Question content is required');
      return;
    }
    if (!currentQuestion.correctAnswer.trim()) {
      setError('Correct answer is required');
      return;
    }
    if (currentQuestion.questionType === 'multiple_choice') {
      const validOptions = currentQuestion.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        setError('Multiple choice questions need at least 2 options');
        return;
      }
    }

    const questionToAdd = {
      ...currentQuestion,
      id: Date.now(), // temporary ID
      gradeLevelId: formData.gradeLevelId,
      subjectId: formData.subjectId
    };

    setNewQuestions(prev => [...prev, questionToAdd]);
    
    // Reset current question
    setCurrentQuestion({
      content: '',
      questionType: 'multiple_choice',
      correctAnswer: '',
      hint: '',
      difficultyLevel: 'medium',
      options: ['', '', '', '']
    });
    setError('');
  };

  const removeQuestion = (id) => {
    setNewQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.startTime || !formData.endTime) {
      setError('Title, start time, and end time are required');
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError('End time must be after start time');
      return;
    }

    if (newQuestions.length === 0) {
      setError('Please add at least one question to the contest');
      return;
    }

    try {
      // First create all questions
      const createdQuestionIds = [];
      for (const question of newQuestions) {
        const questionData = {
          content: question.content,
          correctAnswer: question.correctAnswer,
          hint: question.hint,
          difficultyLevel: question.difficultyLevel,
          questionType: question.questionType,
          gradeLevelId: formData.gradeLevelId ? parseInt(formData.gradeLevelId) : null,
          subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
          options: question.questionType === 'multiple_choice' ? question.options.filter(o => o.trim()) : null
        };
        
        const result = await api.createQuestion(questionData);
        createdQuestionIds.push(result.questionId || result.id);
      }

      // Then create contest with question IDs
      const contestData = {
        title: formData.title,
        description: formData.description,
        gradeLevelId: formData.gradeLevelId ? parseInt(formData.gradeLevelId) : null,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        questionCount: newQuestions.length,
        timePerQuestion: parseInt(formData.timePerQuestion) || 30,
        startTime: formData.startTime,
        endTime: formData.endTime,
        questionIds: createdQuestionIds
      };

      await api.createContest(contestData);
      
      setSuccess(`Contest created successfully with ${newQuestions.length} questions!`);
      setFormData({
        title: '',
        description: '',
        gradeLevelId: '',
        subjectId: '',
        timePerQuestion: 30,
        startTime: '',
        endTime: ''
      });
      setNewQuestions([]);
      setShowCreateForm(false);
      fetchContests();
    } catch (err) {
      console.error('Error creating contest:', err);
      setError(err.message || 'Failed to create contest');
    }
  };

  const handleDelete = async (contestId) => {
    if (!window.confirm('Are you sure you want to delete this contest?')) {
      return;
    }

    try {
      await api.deleteContest(contestId);
      setSuccess('Contest deleted successfully!');
      fetchContests();
    } catch (err) {
      console.error('Error deleting contest:', err);
      setError(err.message || 'Failed to delete contest');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'upcoming':
        return 'status-upcoming';
      case 'passed':
        return 'status-passed';
      default:
        return '';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="loading-state">Loading contests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-icon-large">
            <FiCalendar size={40} />
          </div>
          <h1>Contest Management</h1>
          <p>Create and manage contests for students</p>
        </div>

        {/* Back Link */}
        <Link to="/admin" className="back-link">
          <FiArrowLeft /> Back to Dashboard
        </Link>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Actions */}
        <div className="contest-actions">
          <button
            className={`action-button ${showCreateForm ? 'secondary' : 'primary'}`}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : <><FiPlus /> Create New Contest</>}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="contest-form-container">
            <h2>Create New Contest</h2>
            <form onSubmit={handleSubmit} className="contest-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Contest Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter contest title"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter contest description"
                  rows="3"
                />
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="gradeLevelId">Grade Level</label>
                  <select
                    id="gradeLevelId"
                    name="gradeLevelId"
                    value={formData.gradeLevelId}
                    onChange={handleInputChange}
                  >
                    <option value="">All Grade Levels</option>
                    {gradeLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subjectId">Subject</label>
                  <select
                    id="subjectId"
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="questionCount">
                    <FiList /> Number of Questions
                  </label>
                  <input
                    type="number"
                    id="questionCount"
                    name="questionCount"
                    value={formData.questionCount}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="timePerQuestion">
                    <FiClock /> Time per Question (seconds)
                  </label>
                  <input
                    type="number"
                    id="timePerQuestion"
                    name="timePerQuestion"
                    value={formData.timePerQuestion}
                    onChange={handleInputChange}
                    min="5"
                    max="300"
                  />
                </div>
              </div>

              <div className="form-row two-columns">
                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Question Creation */}
              <div className="question-selection-section">
                <h3><FiPlus /> Create Questions for Contest</h3>
                
                {/* Added Questions List */}
                {newQuestions.length > 0 && (
                  <div className="added-questions">
                    <h4>Added Questions ({newQuestions.length})</h4>
                    <div className="questions-grid">
                      {newQuestions.map((q, index) => (
                        <div key={q.id} className="question-item added">
                          <div className="question-number">#{index + 1}</div>
                          <div className="question-content">
                            <p className="question-text">{q.content.substring(0, 80)}...</p>
                            <div className="question-meta">
                              <span className={`type-tag ${q.questionType}`}>{q.questionType}</span>
                              <span className="difficulty-tag">{q.difficultyLevel}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="remove-btn"
                            onClick={() => removeQuestion(q.id)}
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Question Form */}
                <div className="new-question-form">
                  <h4>Add New Question</h4>
                  
                  <div className="form-row two-columns">
                    <div className="form-group">
                      <label>Question Type</label>
                      <select
                        value={currentQuestion.questionType}
                        onChange={(e) => handleQuestionChange('questionType', e.target.value)}
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={currentQuestion.difficultyLevel}
                        onChange={(e) => handleQuestionChange('difficultyLevel', e.target.value)}
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Question Content *</label>
                    <textarea
                      value={currentQuestion.content}
                      onChange={(e) => handleQuestionChange('content', e.target.value)}
                      placeholder="Enter your question here..."
                      rows="3"
                    />
                  </div>

                  {/* Options for Multiple Choice */}
                  {currentQuestion.questionType === 'multiple_choice' && (
                    <div className="options-section">
                      <label>Answer Options (at least 2 required)</label>
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="option-input-row">
                          <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct Answer */}
                  <div className="form-group">
                    <label>
                      Correct Answer *
                      {currentQuestion.questionType === 'multiple_choice' && (
                        <small> (Enter A, B, C, or D)</small>
                      )}
                      {currentQuestion.questionType === 'true_false' && (
                        <small> (Enter "true" or "false")</small>
                      )}
                    </label>
                    {currentQuestion.questionType === 'true_false' ? (
                      <select
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                        placeholder={
                          currentQuestion.questionType === 'multiple_choice' 
                            ? "Enter A, B, C, or D" 
                            : "Enter the correct answer"
                        }
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label>Hint (Optional)</label>
                    <input
                      type="text"
                      value={currentQuestion.hint}
                      onChange={(e) => handleQuestionChange('hint', e.target.value)}
                      placeholder="Give a hint to help students..."
                    />
                  </div>

                  <button
                    type="button"
                    className="action-button secondary add-question-btn"
                    onClick={addQuestion}
                  >
                    <FiPlus /> Add Question to Contest
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  <FiSave /> Create Contest with {newQuestions.length} Questions
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contests List */}
        <div className="contests-list">
          <h2>All Contests ({contests.length})</h2>
          
          {contests.length === 0 ? (
            <div className="empty-state">
              <FiCalendar size={48} />
              <p>No contests created yet</p>
              <button onClick={() => setShowCreateForm(true)} className="action-button primary">
                Create Your First Contest
              </button>
            </div>
          ) : (
            <div className="contest-cards">
              {contests.map(contest => (
                <div key={contest.id} className={`contest-card ${getStatusColor(contest.status)}`}>
                  <div className="contest-header">
                    <h3>{contest.title}</h3>
                    <span className={`status-badge ${contest.status}`}>
                      {contest.status}
                    </span>
                  </div>
                  
                  <p className="contest-description">{contest.description}</p>
                  
                  <div className="contest-details">
                    <div className="detail-item">
                      <FiCalendar />
                      <span>Start: {formatDateTime(contest.start_time)}</span>
                    </div>
                    <div className="detail-item">
                      <FiCalendar />
                      <span>End: {formatDateTime(contest.end_time)}</span>
                    </div>
                    <div className="detail-item">
                      <FiClock />
                      <span>{contest.time_per_question}s per question</span>
                    </div>
                    <div className="detail-item">
                      <FiList />
                      <span>{contest.question_count} questions</span>
                    </div>
                    <div className="detail-item">
                      <FiUsers />
                      <span>{contest.participant_count || 0} participants</span>
                    </div>
                  </div>
                  
                  <div className="contest-meta">
                    <span className="grade-level">{contest.grade_level_name || 'All Grades'}</span>
                    <span className="subject">{contest.subject_name || 'All Subjects'}</span>
                  </div>
                  
                  <div className="contest-actions-row">
                    <button className="icon-button edit" title="Edit Contest">
                      <FiEdit2 />
                    </button>
                    <button 
                      className="icon-button delete" 
                      title="Delete Contest"
                      onClick={() => handleDelete(contest.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
