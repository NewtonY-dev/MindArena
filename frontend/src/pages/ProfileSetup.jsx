import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './ProfileSetup.css';

export default function ProfileSetup() {
  const [gradeLevels, setGradeLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gradesResponse = await fetch('http://localhost:5000/api/grade-levels');
      const gradesData = await gradesResponse.json();
      
      const subjectsResponse = await fetch('http://localhost:5000/api/subjects');
      const subjectsData = await subjectsResponse.json();
      
      setGradeLevels(gradesData.gradeLevels || []);
      setSubjects(subjectsData.subjects || []);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects((prev) => 
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedGrade) {
      setError('Please select a grade level');
      return;
    }

    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setSaving(true);

    try {
      await api.updateProfile(selectedGrade, selectedSubjects);
      const user = await api.getCurrentUser();
      updateUser(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-setup-container loading-state">
        <div className="loading-spinner"></div>
        <p>Setting up your profile...</p>
      </div>
    );
  }

  if (error && gradeLevels.length === 0 && subjects.length === 0) {
    return (
      <div className="profile-setup-container">
        <div className="profile-setup-card">
          <div className="profile-setup-header">
            <h1>Oops!</h1>
            <p>Something went wrong while loading the data.</p>
          </div>
          <div className="setup-error">{error}</div>
          <button onClick={loadData} className="setup-button">Try Again</button>
        </div>
      </div>
    );
  }

  if (gradeLevels.length === 0 && subjects.length === 0) {
    return (
      <div className="profile-setup-container">
        <div className="profile-setup-card">
          <div className="profile-setup-header">
            <h1>No Data Available</h1>
            <p>Grade levels or subjects could not be loaded. Please check your connection.</p>
          </div>
          <button onClick={loadData} className="setup-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="profile-setup-header">
          <h1>Set Up Your Profile</h1>
          <p>Tell us about yourself to personalize your learning experience</p>
        </div>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-setup-form">
          <div className="form-section">
            <h2>Select Your Grade</h2>
            <div className="grade-options">
              {gradeLevels.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  className={`grade-option ${selectedGrade === grade.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGrade(grade.id)}
                >
                  {grade.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>Choose Your Subjects</h2>
            <p className="section-hint">Select one or more subjects you want to practice</p>
            <div className="subject-grid">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  className={`subject-option ${selectedSubjects.includes(subject.id) ? 'selected' : ''}`}
                  onClick={() => handleSubjectToggle(subject.id)}
                >
                  <span className="subject-icon">{getSubjectIcon(subject.name)}</span>
                  <span className="subject-name">{subject.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="setup-button" disabled={saving}>
            {saving ? 'Saving...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}

function getSubjectIcon(subjectName) {
  const icons = {
    Math: '🔢',
    English: '📝',
    Science: '🔬',
    History: '📜',
    Geography: '🌍',
    Physics: '⚛️',
    Chemistry: '🧪',
    Biology: '🧬',
  };
  return icons[subjectName] || '📚';
}
