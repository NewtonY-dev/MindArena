import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPlus, FiList, FiCalendar, FiUsers, FiBookOpen } from 'react-icons/fi';

export default function AdminTopNav() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-top-nav">
      <div className="nav-brand">
        <FiBookOpen className="nav-brand-icon" />
        <span>Admin Panel</span>
      </div>
      
      <div className="nav-tabs">
        <Link 
          to="/admin" 
          className={`nav-tab ${isActive('/admin') ? 'active' : ''}`}
        >
          <FiHome size={18} />
          <span>Admin Dashboard</span>
        </Link>
        
        <Link 
          to="/admin/questions/create" 
          className={`nav-tab ${isActive('/admin/questions/create') ? 'active' : ''}`}
        >
          <FiPlus size={18} />
          <span>Create Questions</span>
        </Link>
        
        <Link 
          to="/admin/questions" 
          className={`nav-tab ${isActive('/admin/questions') ? 'active' : ''}`}
        >
          <FiList size={18} />
          <span>Manage Questions</span>
        </Link>
        
        <Link 
          to="/admin/contests" 
          className={`nav-tab ${isActive('/admin/contests') ? 'active' : ''}`}
        >
          <FiCalendar size={18} />
          <span>Create Contest</span>
        </Link>
      </div>

      <div className="nav-actions">
        <Link to="/" className="nav-user-link">
          <FiUsers size={18} />
          <span>View Site</span>
        </Link>
      </div>
    </div>
  );
}