import Link from 'next/link';
import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Heart, Bell, ArrowLeft, Loader, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiProxy } from '../../lib/api/apiProxy';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Current password is required');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      // Must use FormData since backend update API runs multer middleware by default
      const formData = new FormData();
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);

      const res = await apiProxy.request('/api/v1/auth/update', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage('Password changed successfully! Redirecting back...');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password update error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="loader-container">
        <Loader className="spinner" size={40} />
        <p>Retrieving user information...</p>
        <style jsx>{`
          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f8fafc;
            color: #64748b;
            font-family: 'Outfit', sans-serif;
            gap: 16px;
          }
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
          .loader-container :global(.spinner) {
            animation: spin 1s linear infinite;
            color: #b91c1c;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header navbar */}
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
          <Link href="/profile" className="avatar-btn">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={`${user.name} profile`} />
            ) : (
              <div className="profile-avatar-placeholder-nav">
                {getInitials(user.name)}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <div className="card-container">
          {/* Header row with back button */}
          <div className="card-header-row">
            <Link href="/profile" className="back-link">
              <ArrowLeft size={18} />
              <span>Back to Profile</span>
            </Link>
            <h1>Update Password</h1>
            <p>For your security, do not share your password with anyone else.</p>
          </div>

          {/* Error and Success Alerts */}
          {errorMessage && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success">
              <CheckCircle2 size={20} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            
            {/* Input fields */}
            <div className="input-fields-grid">
              
              {/* Current Password */}
              <div className="form-group-custom">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="input-wrapper-custom">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="custom-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group-custom">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper-custom">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="custom-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group-custom">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-wrapper-custom">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="custom-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="form-footer-actions">
              <Link href="/profile" className="btn-cancel">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-submit-premium"
              >
                {submitting ? (
                  <>
                    <Loader className="spinner-small" size={16} />
                    <span>Updating...</span>
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* Styled JSX */}
      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Outfit', 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 48px 24px;
        }

        .card-container {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
          width: 100%;
          max-width: 600px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .card-header-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 8px;
          width: fit-content;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #b91c1c;
        }

        .card-header-row h1 {
          font-size: 1.85rem;
          color: #0f172a;
          font-weight: 800;
        }

        .card-header-row p {
          color: #64748b;
          font-size: 0.95rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fee2e2;
        }

        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #dcfce7;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Form Inputs Style */
        .input-fields-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-custom label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrapper-custom {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .custom-input {
          width: 100%;
          padding: 12px 48px 12px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          outline: none;
          font-size: 0.98rem;
          color: #1e293b;
          transition: all 0.2s ease;
        }

        .custom-input:focus {
          border-color: #b91c1c;
          box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.12);
          background: #ffffff;
        }

        .password-toggle-btn {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .password-toggle-btn:hover {
          color: #1e293b;
        }

        /* Footer Actions */
        .form-footer-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
          margin-top: 12px;
        }

        .btn-cancel {
          background: none;
          border: none;
          color: #64748b;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          text-align: center;
        }

        .btn-cancel:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .btn-submit-premium {
          background: #b91c1c;
          color: #ffffff;
          border: none;
          padding: 12px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(185, 28, 28, 0.15);
        }

        .btn-submit-premium:hover {
          background: #991b1b;
          box-shadow: 0 6px 16px rgba(185, 28, 28, 0.25);
          transform: translateY(-1px);
        }

        .btn-submit-premium:active {
          transform: translateY(0);
        }

        .btn-submit-premium:disabled {
          background: #cbd5e1;
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }

        .page-wrapper :global(.spinner-small) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
