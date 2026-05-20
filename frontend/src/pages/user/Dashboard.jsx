import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { FiBook, FiAward, FiTrendingUp, FiTarget, FiZap, FiBarChart2 } from 'react-icons/fi';
import './Dashboard.css';

function EmbeddedLeaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loadingLb, setLoadingLb] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        if (!mounted) return;
        setRankings(data.rankings || []);
      } catch (err) {
        console.error('Leaderboard load error:', err);
        if (mounted) setError(err.message || 'Failed to load leaderboard');
      } finally {
        if (mounted) setLoadingLb(false);
      }
    };
    loadLeaderboard();
    return () => { mounted = false; };
  }, []);

  if (loadingLb) {
    return (
      <div className="leaderboard-simple">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  const renderEmpty = (message) => (
    <div className="lb-empty-wrap">
      <div className="lb-empty-icon">📊</div>
      <div className="lb-empty-text">{message}</div>
    </div>
  );

  return (
    <div className="leaderboard-simple">
      <div className="lb-label">LEADERBOARD</div>
      <div className="lb-container">
        {error ? (
          <div className="lb-body">{renderEmpty(error.includes('grade level') ? 'Profile setup required to view leaderboard.' : 'Failed to load leaderboard')}</div>
        ) : (
          <div className="lb-body">
            <table className="lb-table">
              <thead>
                <tr className="lb-header-row">
                  <th className="col-rank">Rank</th>
                  <th className="col-student">Student</th>
                  <th className="col-points">Points</th>
                  <th className="col-accuracy">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {rankings.length === 0 ? (
                  <tr className="lb-row empty-row">
                    <td colSpan={4} className="empty-cell">No rankings yet — start practicing to appear here.</td>
                  </tr>
                ) : (
                  rankings.map((r, i) => {
                    const isYou = r.userId === user?.id;
                    const accuracy = Number(r.accuracy || 0);
                    const accClass = accuracy >= 50 ? 'acc-high' : 'acc-low';
                    return (
                      <tr key={r.userId || i} className={`lb-row ${isYou ? 'you' : ''}`}>
                        <td className="col-rank"><span className="rank-text">{i + 1}</span></td>
                        <td className="col-student">
                          <span className="student-name">{r.displayName || 'Anonymous'}</span>
                          {isYou && <span className="you-pill">you</span>}
                        </td>
                        <td className="col-points">{r.points}</td>
                        <td className={`col-accuracy ${accClass}`}>{accuracy.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

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
    if (stats.accuracy >= 80) return 'Outstanding accuracy! Keep it up!';
    if (stats.accuracy >= 60) return "Great job! You're doing well!";
    if (stats.accuracy >= 40) return 'Good progress! Keep practicing!';
    return 'Keep going! Every question helps you improve!';
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
      <div className="dashboard-header hero-bar">
        <div className="hero-identity">
          <div className="hero-avatar">
            <FiBook size={16} />
          </div>
          <div className="hero-text">
            <div className="hero-title-mini">Welcome back, {user?.displayName || 'Student'}!</div>
            <div className="hero-subtitle">Keep going! Every question helps you improve.</div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-pill">
            <div className="stat-value">{stats.points}</div>
            <div className="stat-label">Points</div>
          </div>

          <div className="stat-pill">
            <div className="stat-value">{stats.accuracy.toFixed(1)}%</div>
            <div className="stat-label">Accuracy</div>
          </div>

          <div className="stat-pill">
            <div className="stat-value">{stats.totalAttempted}</div>
            <div className="stat-label">Questions</div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions-grid">
        <Link to="/practice" className="dashboard-action-card primary full-width">
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
      </div>

      {/* Removed "Your Progress" stats section per request */}

      {/* Quick Tips moved to bottom per request */}

      <div className="dashboard-section leaderboard-embedded">
        <div className="embedded-leaderboard-wrap">
          <EmbeddedLeaderboard />
        </div>
      </div>
      {/* Quick Tips (moved to bottom) */}
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