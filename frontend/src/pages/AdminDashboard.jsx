import { Link } from 'react-router-dom';
import { FiPlusCircle, FiList, FiArrowRight, FiBookOpen, FiLayers, FiCalendar, FiPlusSquare } from 'react-icons/fi';
import './AdminDashboard.css';

export default function AdminDashboard() {
  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Modern Header */}
        <div className="dashboard-header">
          <div className="header-icon-large">
            <FiBookOpen size={40} />
          </div>
          <h1>Admin Dashboard</h1>
          <p>Manage questions and platform content with ease</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FiLayers size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">Questions</span>
              <span className="stat-label">Manage Content</span>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="admin-actions-grid">
          <Link to="/admin/questions/create" className="admin-action-card primary">
            <div className="action-icon-wrapper">
              <FiPlusCircle size={32} />
            </div>
            <div className="action-content">
              <h3>Create Question</h3>
              <p>Add new questions with different types: short answer, multiple choice, and true/false</p>
            </div>
            <div className="action-arrow-wrapper">
              <FiArrowRight size={20} />
            </div>
          </Link>

          <Link to="/admin/contests" className="admin-action-card primary">
            <div className="action-icon-wrapper">
              <FiPlusSquare size={32} />
            </div>
            <div className="action-content">
              <h3>Create Contest</h3>
              <p>Set up timed contests with custom questions, schedule start/end dates</p>
            </div>
            <div className="action-arrow-wrapper">
              <FiArrowRight size={20} />
            </div>
          </Link>

          <Link to="/admin/questions" className="admin-action-card secondary">
            <div className="action-icon-wrapper">
              <FiList size={32} />
            </div>
            <div className="action-content">
              <h3>Manage Questions</h3>
              <p>View, edit, filter, and organize your question library efficiently</p>
            </div>
            <div className="action-arrow-wrapper">
              <FiArrowRight size={20} />
            </div>
          </Link>

          <Link to="/admin/contests" className="admin-action-card secondary">
            <div className="action-icon-wrapper">
              <FiCalendar size={32} />
            </div>
            <div className="action-content">
              <h3>Manage Contests</h3>
              <p>Create and manage timed contests for students with leaderboards</p>
            </div>
            <div className="action-arrow-wrapper">
              <FiArrowRight size={20} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
