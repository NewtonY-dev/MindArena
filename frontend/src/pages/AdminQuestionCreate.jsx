import { QuestionForm } from '../components/admin';
import { FiPlus } from 'react-icons/fi';
import './AdminQuestionCreate.css';

export default function AdminQuestionCreate() {
  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <div className="header-icon">
            <FiPlus size={32} />
          </div>
          <h1>Create Question</h1>
          <p>Create a new question for students</p>
        </div>

        <div className="admin-form-card">
          <QuestionForm />
        </div>
      </div>
    </div>
  );
}
