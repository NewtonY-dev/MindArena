import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { FiBook, FiAward, FiTrendingUp, FiTarget, FiZap, FiBarChart2 } from 'react-icons/fi';
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
      {/* Modern Header */}
      <div className="dashboard-header">
        <div className="header-icon-large">
          <FiBook size={40} />
        </div>
        <h1>Welcome back, {user?.displayName || 'Student'}!</h1>
        <p>{getMotivationalMessage()}</p>
        
        {/* Quick Stats Row */}
        <div className="header-stats-row">
          <div className="header-stat-pill">
            <FiAward size={20} />
            <span className="header-stat-value">{stats.points}</span>
            <span className="header-stat-label">Points</span>
          </div>
          <div className="header-stat-pill">
            <FiTarget size={20} />
            <span className="header-stat-value">{stats.accuracy.toFixed(1)}%</span>
            <span className="header-stat-label">Accuracy</span>
          </div>
          <div className="header-stat-pill">
            <FiBarChart2 size={20} />
            <span className="header-stat-value">{stats.totalAttempted}</span>
            <span className="header-stat-label">Questions</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions-grid">
        <Link to="/practice" className="dashboard-action-card primary">
          <div className="action-icon-wrapper">
            <FiBook size={32} />
          </div>
          <div className="action-content">
            <h3>Practice Questions</h3>
            <p>Test your knowledge and earn points</p>
          </div>
          <div className="action-arrow-wrapper">
            <FiTrendingUp size={20} />
          </div>
        </Link>

        <Link to="/leaderboard" className="dashboard-action-card secondary">
          <div className="action-icon-wrapper">
            <FiAward size={32} />
          </div>
          <div className="action-content">
            <h3>Leaderboard</h3>
            <p>Check your rank and compete with others</p>
          </div>
          <div className="action-arrow-wrapper">
            <FiTrendingUp size={20} />
          </div>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <FiBarChart2 className="section-icon" />
          Your Progress
        </h2>
        <div className="dashboard-stats-grid">
          {/* Points Card */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon points-icon">
                <FiAward size={24} />
              </div>
              <span className="dashboard-stat-badge">Points</span>
            </div>
            <div className="dashboard-stat-value">{stats.points}</div>
            <div className="dashboard-stat-label">Total Points Earned</div>
            <div className="dashboard-progress-bar">
              <div 
                className="dashboard-progress-fill points-fill" 
                style={{ width: `${Math.min((stats.points / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="dashboard-stat-footer">
              Keep earning more points!
            </div>
          </div>

          {/* Accuracy Card */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon accuracy-icon">
                <FiTarget size={24} />
              </div>
              <span className="dashboard-stat-badge">Accuracy</span>
            </div>
            <div className="dashboard-stat-value">{stats.accuracy.toFixed(1)}%</div>
            <div className="dashboard-stat-label">Answer Accuracy</div>
            <div className="dashboard-progress-bar">
              <div 
                className="dashboard-progress-fill accuracy-fill" 
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <div className="dashboard-stat-footer">
              {stats.accuracy >= 80 ? 'Excellent performance!' : 'Keep practicing!'}
            </div>
          </div>

          {/* Questions Card */}
          <div className="dashboard-stat-card">
            <div className="dashboard-stat-header">
              <div className="dashboard-stat-icon questions-icon">
                <FiBook size={24} />
              </div>
              <span className="dashboard-stat-badge">Questions</span>
            </div>
            <div className="dashboard-stat-value">{stats.totalAttempted}</div>
            <div className="dashboard-stat-label">Questions Attempted</div>
            <div className="dashboard-progress-bar">
              <div 
                className="dashboard-progress-fill questions-fill" 
                style={{ width: `${Math.min((stats.totalAttempted / 50) * 100, 100)}%` }}
              />
            </div>
            <div className="dashboard-stat-footer">
              {stats.totalAttempted >= 50 ? 'Milestone reached!' : 
               stats.totalAttempted >= 25 ? 'Almost there!' : 
               stats.totalAttempted >= 10 ? 'Keep going!' : 'Just started!'}
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <FiZap className="section-icon" />
          Quick Tips
        </h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon-wrapper">
              <FiTarget size={24} />
            </div>
            <div className="tip-content">
              <h4>Focus on Accuracy</h4>
              <p>Practice regularly to improve your accuracy score</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon-wrapper">
              <FiAward size={24} />
            </div>
            <div className="tip-content">
              <h4>Earn Points</h4>
              <p>Complete questions correctly to earn more points</p>
            </div>
          </div>
          <div className="tip-card">
            <div className="tip-icon-wrapper">
              <FiTrendingUp size={24} />
            </div>
            <div className="tip-content">
              <h4>Climb Leaderboard</h4>
              <p>Compete with others by earning more points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
