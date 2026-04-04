import { useState } from 'react';
import { api } from '../../services/api';
import GradeSelector from './GradeSelector';
import SubjectSelector from './SubjectSelector';
import { FiHelpCircle, FiCheckCircle, FiBarChart2, FiZap, FiBookOpen, FiSave, FiList, FiPlus } from 'react-icons/fi';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuestionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    gradeLevelId: '',
    subjectId: '',
    questionType: 'short_answer',
    content: '',
    correctAnswer: '',
    options: ['', '', '', ''],
    hint: '',
    explanation: '',
    difficultyLevel: 'medium'
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    console.log('QuestionForm handleChange:', { field, value });
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('QuestionForm formData updated:', newData);
      // Reset correct answer and options when question type changes
      if (field === 'questionType') {
        newData.correctAnswer = '';
        if (value === 'multiple_choice') {
          newData.options = ['', '', '', ''];
        } else {
          newData.options = [];
        }
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSubmitError('');
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: '' }));
    }
  };

  const validate = () => {
    console.log('QuestionForm validate called with formData:', formData);
    const newErrors = {};

    if (!formData.gradeLevelId) {
      newErrors.gradeLevelId = 'Please select a grade level';
    }
    if (!formData.subjectId) {
      newErrors.subjectId = 'Please select a subject';
    }
    if (!formData.content || formData.content.trim().length < 10) {
      newErrors.content = 'Question text must be at least 10 characters';
    }
    if (!formData.correctAnswer || !formData.correctAnswer.trim()) {
      newErrors.correctAnswer = 'Correct answer is required';
    }
    // Validate multiple choice options
    if (formData.questionType === 'multiple_choice') {
      const emptyOptions = formData.options.filter(opt => !opt.trim()).length;
      if (emptyOptions > 0) {
        newErrors.options = 'All 4 options must be filled';
      }
      // Validate that correct answer matches one of the options
      const validAnswers = ['A', 'B', 'C', 'D'];
      if (!validAnswers.includes(formData.correctAnswer.toUpperCase())) {
        newErrors.correctAnswer = 'Correct answer must be A, B, C, or D';
      }
    }

    console.log('QuestionForm validation errors:', newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('QuestionForm handleSubmit called');
    setSubmitError('');
    setSuccessMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      console.log('QuestionForm validation failed:', validationErrors);
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    console.log('QuestionForm preparing payload...');

    try {
      const payload = {
        gradeLevelId: parseInt(formData.gradeLevelId),
        subjectId: parseInt(formData.subjectId),
        content: formData.content.trim(),
        correctAnswer: formData.correctAnswer.trim(),
        hint: formData.hint.trim() || undefined,
        explanation: formData.explanation.trim() || undefined,
        difficultyLevel: formData.difficultyLevel,
        questionType: formData.questionType,
        options: formData.questionType === 'multiple_choice' ? formData.options : undefined
      };

      console.log('QuestionForm sending payload:', payload);
      const response = await api.createQuestion(payload);
      console.log('QuestionForm API response:', response);
      
      setSuccessMessage('Question created successfully!');
      
      setFormData({
        gradeLevelId: '',
        subjectId: '',
        questionType: 'short_answer',
        content: '',
        correctAnswer: '',
        options: ['', '', '', ''],
        hint: '',
        explanation: '',
        difficultyLevel: 'medium'
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('QuestionForm error:', err);
      setSubmitError(err.message || 'Failed to create question. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="question-form">
      {submitError && (
        <div className="form-error-banner">{submitError}</div>
      )}
      {successMessage && (
        <div className="form-success-banner">
          {successMessage}
          <div className="success-actions">
            <button 
              type="button" 
              className="secondary-btn"
              onClick={() => window.location.href = '/admin/questions'}
            >
              Manage Questions
            </button>
          </div>
        </div>
      )}

      <GradeSelector
        value={formData.gradeLevelId}
        onChange={(value) => {
          handleChange('gradeLevelId', value);
          handleChange('subjectId', '');
        }}
        error={errors.gradeLevelId}
      />

      <SubjectSelector
        gradeLevelId={formData.gradeLevelId}
        value={formData.subjectId}
        onChange={(value) => handleChange('subjectId', value)}
        error={errors.subjectId}
      />

      <div className="form-row">
        <div className="form-section half">
          <label className="form-label">
            <FiList className="label-icon" />
            Question Type
          </label>
          <select
            className="form-select"
            value={formData.questionType}
            onChange={(e) => handleChange('questionType', e.target.value)}
          >
            <option value="short_answer">Short Answer</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
          </select>
        </div>

        <div className="form-section half">
          <label className="form-label">
            <FiBarChart2 className="label-icon" />
            Difficulty
          </label>
          <select
            className="form-select"
            value={formData.difficultyLevel}
            onChange={(e) => handleChange('difficultyLevel', e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="form-section">
        <label className="form-label">
          <FiHelpCircle className="label-icon" />
          Question Text
        </label>
        <textarea
          className="form-textarea"
          rows={4}
          value={formData.content}
          onChange={(e) => handleChange('content', e.target.value)}
          placeholder="Enter your question here..."
          required
        />
        {errors.content && <span className="field-error">{errors.content}</span>}
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
          onChange={(e) => handleChange('hint', e.target.value)}
          placeholder="Optional hint for students..."
        />
      </div>

      {/* Dynamic Answer Input based on Question Type */}
      {formData.questionType === 'short_answer' && (
        <div className="form-section">
          <label className="form-label">
            <FiCheckCircle className="label-icon" />
            Correct Answer
          </label>
          <input
            type="text"
            className="form-input"
            value={formData.correctAnswer}
            onChange={(e) => handleChange('correctAnswer', e.target.value)}
            placeholder="Enter the correct answer..."
            required
          />
          {errors.correctAnswer && <span className="field-error">{errors.correctAnswer}</span>}
        </div>
      )}

      {formData.questionType === 'multiple_choice' && (
        <div className="form-section">
          <label className="form-label">Answer Options</label>
          {errors.options && <span className="field-error">{errors.options}</span>}
          <div className="options-grid">
            {OPTION_LABELS.map((label, index) => (
              <div key={label} className="option-input-row">
                <span className="option-label">{label}.</span>
                <input
                  type="text"
                  className="form-input"
                  value={formData.options[index] || ''}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${label}`}
                />
              </div>
            ))}
          </div>
          <div className="correct-answer-select">
            <label className="form-label">
              <FiCheckCircle className="label-icon" />
              Correct Answer
            </label>
            <select
              className="form-select"
              value={formData.correctAnswer}
              onChange={(e) => handleChange('correctAnswer', e.target.value)}
            >
              <option value="">Select correct answer</option>
              {OPTION_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label} - {formData.options[OPTION_LABELS.indexOf(label)] || `Option ${label}`}
                </option>
              ))}
            </select>
            {errors.correctAnswer && <span className="field-error">{errors.correctAnswer}</span>}
          </div>
        </div>
      )}

      {formData.questionType === 'true_false' && (
        <div className="form-section">
          <label className="form-label">
            <FiCheckCircle className="label-icon" />
            Correct Answer
          </label>
          <div className="true-false-options">
            <label className={`radio-option ${formData.correctAnswer === 'true' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="correctAnswer"
                value="true"
                checked={formData.correctAnswer === 'true'}
                onChange={(e) => handleChange('correctAnswer', e.target.value)}
              />
              <span className="radio-label">True</span>
            </label>
            <label className={`radio-option ${formData.correctAnswer === 'false' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="correctAnswer"
                value="false"
                checked={formData.correctAnswer === 'false'}
                onChange={(e) => handleChange('correctAnswer', e.target.value)}
              />
              <span className="radio-label">False</span>
            </label>
          </div>
          {errors.correctAnswer && <span className="field-error">{errors.correctAnswer}</span>}
        </div>
      )}

      <div className="form-section">
        <label className="form-label">
          <FiBookOpen className="label-icon" />
          Explanation <span className="optional">(Optional)</span>
        </label>
        <textarea
          className="form-textarea"
          rows={3}
          value={formData.explanation}
          onChange={(e) => handleChange('explanation', e.target.value)}
          placeholder="Explain why this is the correct answer..."
        />
      </div>

      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={saving}
        >
          <FiSave style={{marginRight: '8px'}} />
          {saving ? 'Creating...' : 'Create Question'}
        </button>
      </div>
    </form>
  );
}
