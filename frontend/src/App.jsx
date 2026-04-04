import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Contest from './pages/Contest';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuestionCreate from './pages/AdminQuestionCreate';
import AdminManageQuestions from './pages/AdminManageQuestions';
import AdminContests from './pages/AdminContests';
import Challenge from './pages/Challenge';

function ProtectedRoute({ children }) {
  const { user, loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admins don't need profile setup, redirect them to admin dashboard
  if (needsProfileSetup && user.role == 'user') {
    return <Navigate to="/profile-setup" />;
  }

  return <Layout>{children}</Layout>;
}

function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <Layout>{children}</Layout>;
}

function ProfileSetupRoute({ children }) {
  const { user, loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

 if (!needsProfileSetup && user.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  // Only show profile setup if it's needed
  if (!needsProfileSetup) {
    return <Navigate to="/dashboard" />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/profile-setup" element={
        <ProfileSetupRoute>
          <ProfileSetup />
        </ProfileSetupRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/practice" element={
        <ProtectedRoute>
          <Practice />
        </ProtectedRoute>
      } />
      <Route path="/contest" element={
        <ProtectedRoute>
          <Contest />
        </ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      <Route path="/challenge" element={
        <ProtectedRoute>
          <Challenge />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/questions/create" element={
        <AdminProtectedRoute>
          <AdminQuestionCreate />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/questions" element={
        <AdminProtectedRoute>
          <AdminManageQuestions />
        </AdminProtectedRoute>
      } />
      <Route path="/admin/contests" element={
        <AdminProtectedRoute>
          <AdminContests />
        </AdminProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
