import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const { register } = useAuth();
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
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
      
      .particles {
        z-index: 1;
      }
      
      .auth-card {
        z-index: 2;
      }
      
      .input-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #aaa;
        transition: all 0.3s ease;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
      }
      
      .input-icon:hover {
        color: #667eea;
        transform: translateY(-50%) scale(1.1);
      }
      
      .form-group input:focus + .input-icon {
        color: #667eea;
        transform: translateY(-50%) scale(1.1);
      }
      
      .input-wrapper {
        position: relative;
      }
      
      .form-group input {
        padding-right: 50px;
      }
      
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
      
      .password-strength {
        margin-top: 8px;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
      }
      
      .password-strength-bar {
        height: 100%;
        transition: all 0.3s ease;
        border-radius: 2px;
      }
      
      .password-strength-bar.weak {
        width: 33%;
        background: #ff6b6b;
      }
      
      .password-strength-bar.medium {
        width: 66%;
        background: #ffd93d;
      }
      
      .password-strength-bar.strong {
        width: 100%;
        background: #6bcf7f;
      }
      
      .password-strength-text {
        font-size: 0.8rem;
        margin-top: 4px;
        font-weight: 500;
      }
      
      .password-match {
        font-size: 0.8rem;
        margin-top: 4px;
        font-weight: 500;
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

  useEffect(() => {
    // Calculate password strength
    if (password.length === 0) {
      setPasswordStrength('');
    } else if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak password';
      case 'medium': return 'Medium strength';
      case 'strong': return 'Strong password';
      default: return '';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return '#ff6b6b';
      case 'medium': return '#ffd93d';
      case 'strong': return '#6bcf7f';
      default: return '#e0e0e0';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile-setup');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      if (err.message.includes('409') || err.message.includes('already exists')) {
        setError('This email is already registered. Try logging in instead.');
      } else if (err.message.includes('400') || err.message.includes('required')) {
        setError('Please check your input and try again.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
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

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (error) setError('');
  };

  const isFormValid = email && password && confirmPassword && password === confirmPassword && !loading;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join MindArena! 🚀</h1>
          <p>Create an account to start your learning adventure</p>
        </div>

        {success && (
          <div className="auth-success">
            🎉 Account created! Redirecting to setup...
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
                placeholder="Create a password"
                required
                autoComplete="new-password"
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
            {password && (
              <div className="password-strength">
                <div 
                  className={`password-strength-bar ${passwordStrength}`}
                  style={{ background: getPasswordStrengthColor() }}
                />
              </div>
            )}
            {password && (
              <div className="password-strength-text" style={{ color: getPasswordStrengthColor() }}>
                {getPasswordStrengthText()}
              </div>
            )}
          </div>

          <div className={`form-group ${confirmPasswordFocused ? 'focused' : ''}`}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-icon password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPassword && password && (
              <div className="password-match">
                {password === confirmPassword ? (
                  <span style={{ color: '#6bcf7f' }}>✓ Passwords match</span>
                ) : (
                  <span style={{ color: '#ff6b6b' }}>✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={`auth-button ${loading ? 'loading' : ''}`}
            disabled={!isFormValid}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
