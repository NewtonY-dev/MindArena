import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Brain, Home, BookOpen, Flag, Swords, Trophy, Star, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
              <Brain size={32} color="white" />
            </Link>
            <Link to="/dashboard">
              <span className="logo-text">Mind<span>Arena</span></span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="nav-section">
            {user?.role === 'admin' ? (
              <>
                <Link 
                  to="/admin" 
                  className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                >
                  <Home size={20} color="white" />
                  <span className="nav-label">Admin Dashboard</span>
                </Link>
                <Link 
                  to="/admin/questions/create" 
                  className={`nav-item ${isActive('/admin/questions/create') ? 'active' : ''}`}
                >
                  <Shield size={20} color="white" />
                  <span className="nav-label">Create Questions</span>
                </Link>
                <Link 
                  to="/admin/questions" 
                  className={`nav-item ${isActive('/admin/questions') ? 'active' : ''}`}
                >
                  <BookOpen size={20} color="white" />
                  <span className="nav-label">Manage Questions</span>
                </Link>
                <Link 
                  to="/admin/contests" 
                  className={`nav-item ${isActive('/admin/contests') ? 'active' : ''}`}
                >
                  <Flag size={20} color="white" />
                  <span className="nav-label">Create Contest</span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  <Home size={20} color="white" />
                  <span className="nav-label">Dashboard</span>
                </Link>
                <Link 
                  to="/practice" 
                  className={`nav-item ${isActive('/practice') ? 'active' : ''}`}
                >
                  <BookOpen size={20} color="white" />
                  <span className="nav-label">Practice</span>
                </Link>
                <Link 
                  to="/contest" 
                  className={`nav-item ${isActive('/contest') ? 'active' : ''}`}
                >
                  <Flag size={20} color="white" />
                  <span className="nav-label">Contest</span>
                </Link>
                <Link 
                  to="/challenge" 
                  className={`nav-item ${isActive('/challenge') ? 'active' : ''}`}
                >
                  <Swords size={20} color="white" />
                  <span className="nav-label">1v1 Challenge</span>
                </Link>
                {/* Leaderboard moved to Dashboard - link removed from header */}
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="user-section">
            <div className="points-badge">
              <Star size={16} color="white" />
              <span className="points-value">{user?.points || 0}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} color="white" />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <nav className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Logo */}
        <div className="sidebar-logo">
          <Brain size={32} color="white" />
          <span className="sidebar-logo-text">Mind<span>Arena</span></span>
        </div>

        <div className="sidebar-section-title">Menu</div>
        <div className="nav-section">
          {user?.role === 'admin' ? (
            <>
              <Link 
                to="/admin" 
                className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Home size={20} color="white" />
                <span className="nav-label">Admin Dashboard</span>
              </Link>
              <Link 
                to="/admin/questions/create" 
                className={`nav-item ${isActive('/admin/questions/create') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Shield size={20} color="white" />
                <span className="nav-label">Create Questions</span>
              </Link>
              <Link 
                to="/admin/questions" 
                className={`nav-item ${isActive('/admin/questions') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <BookOpen size={20} color="white" />
                <span className="nav-label">Manage Questions</span>
              </Link>
              <Link 
                to="/admin/contests" 
                className={`nav-item ${isActive('/admin/contests') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Flag size={20} color="white" />
                <span className="nav-label">Create Contest</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/dashboard" 
                className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Home size={20} color="white" />
                <span className="nav-label">Dashboard</span>
              </Link>
              <Link 
                to="/practice" 
                className={`nav-item ${isActive('/practice') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <BookOpen size={20} color="white" />
                <span className="nav-label">Practice</span>
              </Link>
              <Link 
                to="/contest" 
                className={`nav-item ${isActive('/contest') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Flag size={20} color="white" />
                <span className="nav-label">Contest</span>
              </Link>
              <Link 
                to="/challenge" 
                className={`nav-item ${isActive('/challenge') ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <Swords size={20} color="white" />
                <span className="nav-label">1v1 Challenge</span>
              </Link>
              {/* Leaderboard moved to Dashboard - link removed from mobile sidebar */}
            </>
          )}
        </div>

        <div className="sidebar-divider"></div>
        
        <div className="sidebar-section-title">Account</div>
        <div className="user-section">
          <div className="user-card">
            <div className="user-info">
              <User size={24} color="white" />
              <div>
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-email">{user?.email || 'user@example.com'}</div>
              </div>
            </div>
            <div className="points-badge">
              <Star size={16} color="white" />
              <span className="points-value">{user?.points || 0} Points</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={20} color="white" />
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
