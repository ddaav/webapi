import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { loginAction } from '../actions/authActions';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setGlobalError('');
    setSuccess('');
    setLoading(true);

    const result = await loginAction({ email, password });
    setLoading(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setGlobalError(result.message || 'Login failed');
      }
    } else {
      // Sync the AuthContext in-memory state so protected pages
      // (like /profile) don't see user as null after login.
      if (result.data) {
        updateUser(result.data);
      }
      setSuccess('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="split-container">
      {/* Left Pane: Branding & Scenic Background */}
      <div className="split-left" style={{ backgroundImage: "url('/assets/kathmandu_sunset.png')" }}>
        <div className="split-left-content">
          <div style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
            Gharpurja Nepal
          </div>
          <h2>Gharpurja Nepal</h2>
          <p>
            Your premium gateway to the Nepalese property market. Reliable, modern, and powered by intelligent insights.
          </p>
          <div className="tag-row">
            <span className="tag-badge">
              ✨ AI Valuations
            </span>
            <span className="tag-badge">
              <CheckCircle size={14} /> Verified
            </span>
          </div>
        </div>
      </div>

      {/* Right Pane: Credentials Form */}
      <div className="split-right">
        <div className="auth-form-container">
          <h1>Welcome Back</h1>
          <p>Sign in to manage your properties and insights.</p>

          {globalError && <div className="alert alert-error">{globalError}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="albert@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-link">Forgot?</a>
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-row-between">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
                Keep me signed in
              </label>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="divider">Or continue with</div>

          <div className="social-buttons" style={{ marginBottom: '24px' }}>
            <button type="button" className="btn-social">
              <span style={{ fontWeight: 'bold' }}>G</span> Google
            </button>
            <button type="button" className="btn-social">
              <span style={{ color: '#1877f2', fontSize: '1.2rem' }}>🔵</span> Facebook
            </button>
          </div>

          <div className="auth-footer">
            Don't have an account? <Link href="/register" className="auth-link">Register Now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
