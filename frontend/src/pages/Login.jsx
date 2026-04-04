import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
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
    // Add floating particles animation
    const createParticles = () => {
      const container = document.querySelector('.auth-container');
      if (!container) return;
      
      const particlesContainer = document.createElement('div');
      particlesContainer.className = 'particles';
      particlesContainer.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
      `;
      
      for (let i = 0; i < 9; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          left: ${10 + (i * 10)}%;
          animation: float ${6 + Math.random() * 2}s infinite ease-in-out;
          animation-delay: ${i * 0.5}s;
        `;
        particlesContainer.appendChild(particle);
      }
      
      container.appendChild(particlesContainer);
      
      return () => {
        if (container.contains(particlesContainer)) {
          container.removeChild(particlesContainer);
        }
      };
    };
    
    const cleanup = createParticles();
    
    // Add floating animation CSS
    const style = document.createElement('style');
    style.textContent = `
      .auth-success {
        background: linear-gradient(135deg, #00d2d3 0%, #01a3a4 100%);
        color: white;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 20px;
        text-align: center;
        animation: successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      @keyframes successPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      cleanup();
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const data = await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Login error:', err);
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
          <div className="auth-icon-wrapper">
            <FiLock size={32} />
          </div>
          <h1>Welcome Back!</h1>
          <p>Sign in to continue your learning journey</p>
        </div>

        {success && (
          <div className="auth-success">
            <FiCheckCircle size={20} />
            <span>Login successful! Redirecting...</span>
          </div>
        )}

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

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
              <span className="input-icon-static"><FiMail size={20} /></span>
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
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={!isFormValid}
          >
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
