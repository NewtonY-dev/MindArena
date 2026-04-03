import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './InteractiveAuth.css';

export default function InteractiveLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Add floating particles
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles';
    for (let i = 0; i < 9; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particlesContainer.appendChild(particle);
    }
    
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.appendChild(particlesContainer);
    }
    
    return () => {
      if (authContainer && particlesContainer) {
        authContainer.removeChild(particlesContainer);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('Invalid credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('400') || err.message.includes('required')) {
        setError('Please enter both email and password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const isFormValid = email && password && !loading;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back! 👋</h1>
          <p>Sign in to continue your learning journey</p>
        </div>

        {success && (
          <div className="auth-success">
            🎉 Login successful! Redirecting...
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`form-group ${emailFocused ? 'focused' : ''}`}>
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
              <span className="input-icon">📧</span>
            </div>
          </div>

          <div className={`form-group ${passwordFocused ? 'focused' : ''}`}>
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={!isFormValid}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
