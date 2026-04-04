import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FiLayers } from 'react-icons/fi';

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

  const isDisabled = loading || loadError;

  return (
    <div className="form-section">
      <label htmlFor="gradeLevel" className="form-label">
        <FiLayers className="label-icon" />
        Grade Level
      </label>
      <select
        id="gradeLevel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`form-select ${error ? 'error' : ''}`}
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
