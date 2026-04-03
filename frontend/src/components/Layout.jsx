import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="layout">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          {/* Logo Section */}
          <div className="logo-section">
            <Link to="/dashboard">
              <span className="logo-icon">🧠</span>
            </Link>
            <Link to="/dashboard">
              <span className="logo-text">Mind<span>Arena</span></span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="nav-section">
            <Link 
              to="/dashboard" 
              className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-label">Dashboard</span>
            </Link>
            <Link 
              to="/practice" 
              className={`nav-item ${isActive('/practice') ? 'active' : ''}`}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-label">Practice</span>
            </Link>
            <Link 
              to="/contest" 
              className={`nav-item ${isActive('/contest') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏁</span>
              <span className="nav-label">Contest</span>
            </Link>
            <Link 
              to="/leaderboard" 
              className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏆</span>
              <span className="nav-label">Leaderboard</span>
            </Link>
          </nav>

          {/* User Section */}
          <div className="user-section">
            <div className="points-badge">
              <span className="points-icon">⭐</span>
              <span className="points-value">{user?.points || 0}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <nav className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🧠</span>
          <span className="sidebar-logo-text">Mind<span>Arena</span></span>
        </div>

        <div className="sidebar-section-title">Menu</div>
        <div className="nav-section">
          <Link 
            to="/dashboard" 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link 
            to="/practice" 
            className={`nav-item ${isActive('/practice') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-label">Practice</span>
          </Link>
          <Link 
            to="/contest" 
            className={`nav-item ${isActive('/contest') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">🏁</span>
            <span className="nav-label">Contest</span>
          </Link>
          <Link 
            to="/leaderboard" 
            className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`}
            onClick={closeSidebar}
          >
            <span className="nav-icon">🏆</span>
            <span className="nav-label">Leaderboard</span>
          </Link>
        </div>

        <div className="sidebar-divider"></div>
        
        <div className="sidebar-section-title">Account</div>
        <div className="user-section">
          <div className="user-card">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div>
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-email">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            <div className="points-badge">
              <span className="points-icon">⭐</span>
              <span className="points-value">{user?.points || 0} Points</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <span className="logout-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={closeSidebar} />
      )}

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
