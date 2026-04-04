import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QuestionForm } from '../components/admin';
import './AdminQuestionCreate.css';

export default function AdminQuestionCreate() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>Create Question</h1>
          <p>Create a new short answer/explanation question for students</p>
        </div>

        <div className="admin-form-card">
          <QuestionForm />
        </div>
      </div>
    </div>
  );
}
