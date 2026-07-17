import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Heart, Bell, User as UserIcon, ShieldAlert } from 'lucide-react';
import { registerAction } from '../actions/authActions';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

    // Call registration action (passing confirmPassword equal to password to satisfy schema validation)
    const result = await registerAction({
      name,
      email,
      password,
      confirmPassword: password
    });

    setLoading(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setGlobalError(result.message || 'Registration failed');
      }
    } else {
      setSuccess('Account created successfully! Redirecting to login...');
      setName('');
      setEmail('');
      setPassword('');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="logo">
          Gharpurja Nepal
        </div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <a href="#" className="nav-link">Valuation</a>
          <a href="#" className="nav-link">Insights</a>
          <a href="#" className="nav-link">Help</a>
        </nav>
        <div className="nav-actions">
          <button className="nav-icon-btn"><Heart size={20} /></button>
          <button className="nav-icon-btn"><Bell size={20} /></button>
          <button className="post-property-btn">Post Property</button>
        </div>
      </header>

      {/* Main Registration Content */}
      <main className="register-container">
        <div className="register-card">
          {/* Left Side: Scenic Image and AI Box */}
          <div className="register-card-left" style={{ backgroundImage: "url('/assets/nepal_premium_building.png')" }}>
            <div className="register-card-left-content">
              <h2>Join Nepal's Premium Property Network.</h2>
              <p style={{ marginBottom: '24px' }}>
                Experience AI-driven valuations and curated property matches tailored for the modern Nepalese market.
              </p>
              
              <div className="signal-card" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.25)', color: '#ffffff' }}>
                <div className="signal-card-title" style={{ color: '#ffffff', fontWeight: 800 }}>
                  <ShieldAlert size={16} /> AI SMART INSIGHT
                </div>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)', margin: 0 }}>
                  Properties listed this month are seeing a <strong style={{ color: '#fca5a5' }}>12% faster</strong> closing rate in the Kathmandu valley area.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="register-card-right">
            <h1>Create Account</h1>
            <p>Start your property journey today.</p>

            {globalError && <div className="alert alert-error">{globalError}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Renter/Owner Selector Tabs */}
            <div className="tabs-container">
              <button
                type="button"
                className={`tab-btn ${role === 'renter' ? 'active' : ''}`}
                onClick={() => setRole('renter')}
              >
                <span style={{ fontSize: '1.1rem' }}>🔑</span> RENTER
              </button>
              <button
                type="button"
                className={`tab-btn ${role === 'owner' ? 'active' : ''}`}
                onClick={() => setRole('owner')}
              >
                <span style={{ fontSize: '1.1rem' }}>🏠</span> OWNER
              </button>
            </div>

            {/* Social Logins */}
            <div className="social-buttons">
              <button type="button" className="btn-social">
                <span style={{ fontWeight: 'bold' }}>G</span> Sign up with Google
              </button>
              <button type="button" className="btn-social">
                <span style={{ fontSize: '1.1rem' }}>🍎</span> Sign up with Apple
              </button>
            </div>

            <div className="divider">Or with email</div>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link href="/login" className="auth-link">Log In</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">Gharpurja Nepal</div>
        <div className="footer-links">
          <a href="#" className="footer-link">About Us</a>
          <a href="#" className="footer-link">Contact Support</a>
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">Local Listings</a>
        </div>
        <p className="footer-copy">© 2026 Gharpurja Nepal. All rights reserved.</p>
      </footer>
    </div>
  );
}
