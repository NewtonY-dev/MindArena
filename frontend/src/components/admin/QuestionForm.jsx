import { useState } from 'react';
import { api } from '../../services/api';
import GradeSelector from './GradeSelector';
import SubjectSelector from './SubjectSelector';
import FormInput from './FormInput';

export default function QuestionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    gradeLevelId: '',
    subjectId: '',
    content: '',
    correctAnswer: '',
    hint: '',
    explanation: '',
    difficultyLevel: 'medium'
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setSubmitError('');
  };

  const validate = () => {
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

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSuccessMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        gradeLevelId: parseInt(formData.gradeLevelId),
        subjectId: parseInt(formData.subjectId),
        content: formData.content.trim(),
        correctAnswer: formData.correctAnswer.trim(),
        hint: formData.hint.trim() || undefined,
        explanation: formData.explanation.trim() || undefined,
        difficultyLevel: formData.difficultyLevel
      };

      await api.createQuestion(payload);
      setSuccessMessage('Question created successfully!');
      
      setFormData({
        gradeLevelId: '',
        subjectId: '',
        content: '',
        correctAnswer: '',
        hint: '',
        explanation: '',
        difficultyLevel: 'medium'
      });

      if (onSuccess) onSuccess();
    } catch (err) {
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

      <FormInput
        label="Question Text"
        name="content"
        type="textarea"
        rows={4}
        value={formData.content}
        onChange={(e) => handleChange('content', e.target.value)}
        required
        error={errors.content}
        placeholder="Enter your question here..."
      />

      <FormInput
        label="Hint"
        name="hint"
        type="textarea"
        rows={2}
        value={formData.hint}
        onChange={(e) => handleChange('hint', e.target.value)}
        placeholder="Optional hint for students..."
      />

      <FormInput
        label="Correct Answer"
        name="correctAnswer"
        value={formData.correctAnswer}
        onChange={(e) => handleChange('correctAnswer', e.target.value)}
        required
        error={errors.correctAnswer}
        placeholder="Enter the correct answer..."
      />

      <FormInput
        label="Explanation"
        name="explanation"
        type="textarea"
        rows={3}
        value={formData.explanation}
        onChange={(e) => handleChange('explanation', e.target.value)}
        placeholder="Explain why this is the correct answer (optional)..."
      />

      <div className="form-field">
        <label htmlFor="difficultyLevel">Difficulty *</label>
        <select
          id="difficultyLevel"
          value={formData.difficultyLevel}
          onChange={(e) => handleChange('difficultyLevel', e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <button 
        type="submit" 
        className="submit-btn"
        disabled={saving}
      >
        {saving ? 'Creating...' : 'Create Question'}
      </button>
    </form>
  );
}
