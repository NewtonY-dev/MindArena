import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function GradeSelector({ value, onChange, error }) {
  const [gradeLevels, setGradeLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadGradeLevels();
  }, []);

  const loadGradeLevels = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await api.getGradeLevels();
      setGradeLevels(data.gradeLevels || []);
    } catch (err) {
      setLoadError('Failed to load grade levels');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="form-field">
        <label>Grade Level *</label>
        <div className="select-loading">Loading grade levels...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="form-field">
        <label>Grade Level *</label>
        <div className="select-error">
          {loadError}
          <button onClick={loadGradeLevels} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-field">
      <label htmlFor="gradeLevel">Grade Level *</label>
      <select
        id="gradeLevel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'error' : ''}
      >
        <option value="">Select a grade level...</option>
        {gradeLevels.map((grade) => (
          <option key={grade.id} value={grade.id}>
            {grade.name}
          </option>
        ))}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
