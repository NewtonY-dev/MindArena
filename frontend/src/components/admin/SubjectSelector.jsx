import { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function SubjectSelector({ gradeLevelId, value, onChange, error }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!gradeLevelId) {
      setSubjects([]);
      setLoadError('');
      return;
    }

    loadSubjects();
  }, [gradeLevelId]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const res = await fetch(`http://localhost:5000/api/subjects/grade/${gradeLevelId}`);
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      setLoadError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = !gradeLevelId;

  return (
    <div className="form-field">
      <label htmlFor="subject">Subject *</label>
      <select
        id="subject"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className={error ? 'error' : ''}
      >
        <option value="">
          {isDisabled ? 'Select a grade first...' : 'Select a subject...'}
        </option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
      {loading && <span className="field-loading">Loading...</span>}
      {loadError && !loading && (
        <span className="field-error">
          {loadError} <button onClick={loadSubjects} className="inline-retry">Retry</button>
        </span>
      )}
      {!loading && !loadError && subjects.length === 0 && gradeLevelId && (
        <span className="field-hint">No subjects available for this grade</span>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
