import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, List, ArrowRight } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage questions and platform content</p>
        </div>

        <div className="admin-actions-grid">
          <Link to="/admin/questions/create" className="admin-action-card primary">
            <div className="action-icon">
              <PlusCircle size={32} />
            </div>
            <div className="action-content">
              <h3>Create Question</h3>
              <p>Add new short answer/explanation questions for students</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </Link>

          <Link to="/admin/questions" className="admin-action-card secondary">
            <div className="action-icon">
              <List size={32} />
            </div>
            <div className="action-content">
              <h3>Manage Questions</h3>
              <p>View, edit, and delete existing questions</p>
            </div>
            <ArrowRight size={20} className="action-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}
