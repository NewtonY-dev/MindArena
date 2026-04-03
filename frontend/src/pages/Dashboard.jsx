import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({ points: 0, accuracy: 0, totalAttempted: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMotivationalMessage = () => {
    if (stats.accuracy >= 80) return "Outstanding accuracy! Keep it up!";
    if (stats.accuracy >= 60) return "Great job! You're doing well!";
    if (stats.accuracy >= 40) return "Good progress! Keep practicing!";
    return "Keep going! Every question helps you improve!";
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-welcome">
            <h1>
              Welcome back, {user?.displayName || 'Student'}!
              <span className="wave-hand">👋</span>
            </h1>
            <p>{getMotivationalMessage()}</p>
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat-pill">
              <span className="hero-stat-pill-icon">⭐</span>
              <span className="hero-stat-pill-value">{stats.points}</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-pill-icon">🎯</span>
              <span className="hero-stat-pill-value">{stats.accuracy.toFixed(1)}%</span>
            </div>
            <div className="hero-stat-pill">
              <span className="hero-stat-pill-icon">📝</span>
              <span className="hero-stat-pill-value">{stats.totalAttempted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/practice" className="action-btn">
          <span className="action-btn-icon">📚</span>
          <div className="action-btn-content">
            <h3>Practice Questions</h3>
            <p>Test your knowledge →</p>
          </div>
          <span className="action-btn-arrow">➜</span>
        </Link>

        <Link to="/leaderboard" className="action-btn">
          <span className="action-btn-icon">🏆</span>
          <div className="action-btn-content">
            <h3>Leaderboard</h3>
            <p>Check your rank →</p>
          </div>
          <span className="action-btn-arrow">➜</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <h2 className="section-title">Your Progress</h2>
        <div className="stats-grid">
          {/* Points Card */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-icon">⭐</span>
              <span className="stat-card-badge positive">+Points</span>
            </div>
            <div className="stat-card-value">{stats.points}</div>
            <div className="stat-card-label">Total Points</div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill" 
                style={{ width: `${Math.min((stats.points / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="stat-card-footer">
              <span className="stat-card-footer-text">Keep earning more points!</span>
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-icon">🎯</span>
              <span className="stat-card-badge neutral">Accuracy</span>
            </div>
            <div className="stat-card-value">{stats.accuracy.toFixed(1)}%</div>
            <div className="stat-card-label">Accuracy Rate</div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill" 
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <div className="stat-card-footer">
              <span className="stat-card-footer-text">
                {stats.accuracy >= 80 ? 'Excellent performance!' : 'Keep practicing!'}
              </span>
            </div>
          </div>

          {/* Questions Card */}
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-icon">📝</span>
              <span className="stat-card-badge neutral">Questions</span>
            </div>
            <div className="stat-card-value">{stats.totalAttempted}</div>
            <div className="stat-card-label">Questions Attempted</div>
            <div className="stat-progress-bar">
              <div 
                className="stat-progress-fill" 
                style={{ width: `${Math.min((stats.totalAttempted / 50) * 100, 100)}%` }}
              />
            </div>
            <div className="stat-card-footer">
              <span className="stat-card-footer-text">
                {stats.totalAttempted >= 50 ? '🏆 Milestone reached!' : 
                 stats.totalAttempted >= 25 ? '⭐ Almost there!' : 
                 stats.totalAttempted >= 10 ? '🚀 Keep going!' : '🌟 Just started!'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h3>💡 Quick Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-card-icon">🎯</span>
            <div className="tip-card-content">
              <h4>Focus on Accuracy</h4>
              <p>Practice regularly to improve your accuracy score</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-card-icon">⭐</span>
            <div className="tip-card-content">
              <h4>Earn Points</h4>
              <p>Complete questions correctly to earn more points</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-card-icon">🏆</span>
            <div className="tip-card-content">
              <h4>Climb Leaderboard</h4>
              <p>Compete with others by earning more points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
