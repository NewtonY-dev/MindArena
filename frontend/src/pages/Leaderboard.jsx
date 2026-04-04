import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setRankings(data.rankings || []);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getCurrentUserRank = () => {
    const rankIndex = rankings.findIndex(r => r.userId === user?.id);
    return rankIndex >= 0 ? rankIndex + 1 : null;
  };

  const currentUserRank = getCurrentUserRank();
  
  // Get top 3 for podium
  const topThree = rankings.slice(0, 3);
  // Get rest of rankings
  const restRankings = rankings.slice(3);

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isGradeLevelError = error.includes('grade level');
    return (
      <div className="leaderboard-page">
        <div className="error-container">
          {isGradeLevelError ? (
            <>
              <div className="no-rankings-icon">⚙️</div>
              <h2>Profile Setup Required</h2>
              <p>You need to set up your profile with a grade level to view the leaderboard.</p>
              <Link to="/profile-setup" className="setup-profile-btn">Set Up Profile</Link>
            </>
          ) : (
            <>
              <div className="no-rankings-icon">⚠️</div>
              <h2>Error</h2>
              <p>{error}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="leaderboard-page">
        {/* Hero Header */}
        <div className="leaderboard-hero">
          <div className="hero-content">
            <div className="hero-title">
              <h1>
                <span className="trophy-icon">🏆</span>
                Leaderboard
              </h1>
              <p>See how you rank against other students</p>
            </div>
          </div>
        </div>

        <div className="no-rankings-container">
          <div className="no-rankings-icon">📊</div>
          <h2>No Rankings Yet</h2>
          <p>Start practicing to appear on the leaderboard!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      {/* Hero Header */}
      <div className="leaderboard-hero">
        <div className="hero-content">
          <div className="hero-title">
            <h1>
              <span className="trophy-icon">🏆</span>
              Leaderboard
            </h1>
            <p>See how you rank against other students</p>
          </div>
          {currentUserRank && (
            <div className="your-rank-card">
              <div className="rank-label">Your Rank</div>
              <div className="rank-value">{getRankIcon(currentUserRank)}</div>
              <div className="rank-detail">
                #{currentUserRank} of {rankings.length}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Podium Section - Top 3 */}
      {topThree.length > 0 && (
        <div className="podium-section">
          {topThree.map((entry, index) => {
            const isCurrentUser = entry.userId === user?.id;
            return (
              <div 
                key={entry.userId} 
                className={`podium-card ${index === 0 ? 'first' : index === 1 ? 'second' : 'third'}`}
              >
                <div className="podium-rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="podium-name">
                  {entry.displayName || 'Anonymous'}
                  {isCurrentUser && <span className="you-tag">You</span>}
                </div>
                <div className="podium-points">{entry.points}</div>
                <div className="podium-accuracy">{entry.accuracy.toFixed(1)}% Accuracy</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rankings Table */}
      <div className="rankings-section">
        <h2>All Rankings</h2>
        <div className="rankings-table">
          <div className="table-header-row">
            <div>Rank</div>
            <div>Student</div>
            <div>Points</div>
            <div>Accuracy</div>
          </div>
          <div className="table-body">
            {restRankings.map((entry, index) => {
              const isCurrentUser = entry.userId === user?.id;
              const rank = index + 4;
              return (
                <div 
                  key={entry.userId} 
                  className={`table-row ${isCurrentUser ? 'current-user' : ''}`}
                >
                  <div className="rank-number">{rank}</div>
                  <div className="student-name-cell">
                    {entry.displayName || 'Anonymous'}
                    {isCurrentUser && <span className="you-tag">You</span>}
                  </div>
                  <div className="points-cell">{entry.points}</div>
                  <div className="accuracy-cell">{entry.accuracy.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h3>💡 How to Climb the Ranks</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🎯</span>
            <div className="tip-content">
              <h4>Focus on Accuracy</h4>
              <p>Answer questions correctly to earn more points</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">⭐</span>
            <div className="tip-content">
              <h4>Practice Regularly</h4>
              <p>The more you practice, the more points you earn</p>
            </div>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏆</span>
            <div className="tip-content">
              <h4>Stay Consistent</h4>
              <p>Maintain high accuracy to stay ahead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
