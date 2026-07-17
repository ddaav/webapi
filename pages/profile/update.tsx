import Link from 'next/link';
import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Heart, Bell, ArrowLeft, Camera, Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiProxy } from '../../lib/api/apiProxy';

export default function ProfileUpdatePage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Prefill the form once user details are loaded from context
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        setName(user.name);
        setEmail(user.email);
      }
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email cannot be empty');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      // Use apiProxy to fetch and handle authentication headers/errors
      const res = await apiProxy.request('/api/v1/auth/update', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setSuccessMessage('Profile updated successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);

        // Update the AuthContext user object
        updateUser(data.user);

        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (confirm('Are you sure you want to remove your profile photo?')) {
      try {
        const res = await apiProxy.post('/api/user/remove-avatar');
        const data = await res.json();
        if (data.success && data.user) {
          setSelectedFile(null);
          setPreviewUrl(null);
          updateUser(data.user);
          setSuccessMessage('Photo removed successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrorMessage(data.message || 'Failed to remove photo');
        }
      } catch (err) {
        console.error('Error removing photo:', err);
        setErrorMessage('Failed to remove photo.');
      }
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

  const displayPhoto = previewUrl || user.profilePicture;

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
              <img src={user.profilePicture} alt={`${name} profile`} />
            ) : (
              <div className="profile-avatar-placeholder-nav">
                {getInitials(name)}
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
            <h1>Edit Profile Settings</h1>
            <p>Update your public profile, contact details, and account photo.</p>
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
            
            {/* Avatar Upload Widget */}
            <div className="avatar-upload-section">
              <div className="avatar-preview-container">
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Avatar preview" className="avatar-preview-image" />
                ) : (
                  <div className="avatar-preview-placeholder">
                    {getInitials(name)}
                  </div>
                )}
                
                {/* Upload Hover Overlay */}
                <label className="avatar-upload-overlay">
                  <Camera size={24} />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              
              <div className="avatar-upload-info">
                <h3>Profile Picture</h3>
                <p>PNG, JPG, JPEG, or WEBP. Max 5MB.</p>
                <div className="avatar-actions">
                  <label className="btn-secondary-label">
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {user.profilePicture && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn-link-danger"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Input fields */}
            <div className="input-fields-grid">
              <div className="form-group-custom">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="custom-input"
                  required
                />
              </div>

              <div className="form-group-custom">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  id="emailAddress"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="custom-input"
                  required
                />
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
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
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
          max-width: 680px;
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
          gap: 32px;
        }

        /* Avatar Upload Style */
        .avatar-upload-section {
          display: flex;
          align-items: center;
          gap: 24px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
          border: 1px dashed #cbd5e1;
        }

        .avatar-preview-container {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          background: #ffffff;
          cursor: pointer;
        }

        .avatar-preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-preview-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #fca5a5 0%, #b91c1c 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 800;
        }

        .avatar-upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.25s ease;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          padding: 4px;
        }

        .avatar-preview-container:hover .avatar-upload-overlay {
          opacity: 1;
        }

        .avatar-upload-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .avatar-upload-info h3 {
          font-size: 1.05rem;
          color: #1e293b;
          font-weight: 700;
        }

        .avatar-upload-info p {
          font-size: 0.85rem;
          color: #64748b;
        }

        .avatar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 8px;
        }

        .btn-secondary-label {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary-label:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #1e293b;
        }

        .btn-link-danger {
          background: none;
          border: none;
          color: #ef4444;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s ease;
        }

        .btn-link-danger:hover {
          color: #b91c1c;
          text-decoration: underline;
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

        .custom-input {
          width: 100%;
          padding: 12px 16px;
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

        /* Footer Actions */
        .form-footer-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          border-top: 1px solid #e2e8f0;
          padding-top: 24px;
          margin-top: 8px;
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
