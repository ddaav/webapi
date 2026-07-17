import Link from 'next/link';
import { useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import { Heart, Bell, Key, UserCheck, BellOff, Lock, LogOut, ChevronRight, Shield, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading, updateUser } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await fetch('/api/user/remove-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
      } else {
        alert(data.message || 'Failed to remove profile picture');
      }
    } catch (err) {
      console.error('Error removing profile picture:', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleUploadAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await fetch('/api/user/upload-avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profilePicture: base64String }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          updateUser(data.user);
        } else {
          alert(data.message || 'Failed to upload profile picture');
        }
      } catch (err) {
        console.error('Error uploading profile picture:', err);
        alert('An error occurred. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Profile...</div>
      </div>
    );
  }

  return (
    <div>
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
          {user?.role === 'admin' && (
            <Link href="/admin/users" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Admin
            </Link>
          )}
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

      {/* Main Profile Container */}
      <main className="profile-container">
        {/* Top Profile Summary Card */}
        <section className="profile-card-top">
          <div className="profile-info-left">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div className="profile-avatar-large">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile avatar" />
                ) : (
                  <div className="profile-avatar-placeholder-large">
                    {getInitials(user.name)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label className="btn-upload-avatar-label">
                  {user.profilePicture ? 'Change Photo' : 'Upload Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    style={{ display: 'none' }}
                  />
                </label>
                {user.profilePicture && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="btn-remove-avatar"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
            <div className="profile-details">
              <div className="profile-name-row">
                <span className="profile-name">{user.name}</span>
                <span className="badge-verified-seller">Verified Seller</span>
              </div>
              <p className="profile-meta">
                Kathmandu, Nepal • Joined March 2023
              </p>
              
              <div className="profile-stats-row">
                <div className="profile-stat-item">
                  <span className="stat-val">12</span>
                  <span className="stat-lbl">Active Listings</span>
                </div>
                <div className="profile-stat-item">
                  <span className="stat-val">1,482</span>
                  <span className="stat-lbl">Total Views</span>
                </div>
                <div className="profile-stat-item">
                  <span className="stat-val">48</span>
                  <span className="stat-lbl">Inquiries</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="profile-actions-right">
            <Link href="/profile/update" style={{ textDecoration: 'none' }}>
              <button className="btn-profile-edit">
                📝 Edit Profile
              </button>
            </Link>
            <button className="btn-profile-public">
              View Public Profile
            </button>
          </div>
        </section>

        {/* Two Column Layout Grid */}
        <div className="profile-grid-cols">
          {/* Left Column: Gauges and Activity */}
          <div className="profile-col-left">
            {/* Rental Market Match Card */}
            <div className="info-section-card">
              <h3>⚡ Rental Market Match</h3>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
                AI-calculated health score for your current listings in Kathmandu.
              </p>
              
              <div className="gauges-row">
                <div className="gauge-item">
                  <div className="gauge-header">
                    <span>Pricing Strategy</span>
                    <span>92%</span>
                  </div>
                  <div className="gauge-bar-bg">
                    <div className="gauge-bar-fill" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="gauge-item">
                  <div className="gauge-header">
                    <span>Location Demand</span>
                    <span>78%</span>
                  </div>
                  <div className="gauge-bar-bg">
                    <div className="gauge-bar-fill" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="gauge-item">
                  <div className="gauge-header">
                    <span>Amenities Score</span>
                    <span>85%</span>
                  </div>
                  <div className="gauge-bar-bg">
                    <div className="gauge-bar-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              {/* AI Smart Suggestion banner */}
              <div className="profile-tip-card">
                <div className="profile-tip-title">
                  💡 Smart Suggestion
                </div>
                <p style={{ margin: 0, color: '#6b21a8', fontSize: '0.88rem' }}>
                  Properties in Bakhundole with high-speed fiber internet and power backup are seeing a <strong>14% higher</strong> inquiry rate this month. Consider highlighting these in your listings.
                </p>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="info-section-card">
              <h3>📋 Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-info">
                    <div className="activity-icon-wrapper">👁️</div>
                    <div className="activity-text-wrapper">
                      <span className="activity-title">You viewed Modern 3BHK Apartment in Sanepa</span>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <button className="activity-action-btn">
                    View listing
                  </button>
                </div>

                <div className="activity-item" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="activity-info">
                    <div className="activity-icon-wrapper inquiry">✉️</div>
                    <div className="activity-text-wrapper">
                      <span className="activity-title">New Inquiry received for Ganesh Villa, Budhanilkantha</span>
                      <span className="activity-time">5 hours ago</span>
                    </div>
                  </div>
                  <button className="post-property-btn" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    Reply
                  </button>
                </div>

                <div className="activity-item">
                  <div className="activity-info">
                    <div className="activity-icon-wrapper saved">⭐</div>
                    <div className="activity-text-wrapper">
                      <span className="activity-title">You saved Commercial Space, New Road</span>
                      <span className="activity-time">Yesterday</span>
                    </div>
                  </div>
                  <button className="activity-action-btn">
                    Manage Saved
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Settings, Promo, Support, Logout */}
          <div className="profile-col-right">
            {/* Account Settings List */}
            <div className="info-section-card" style={{ padding: '20px' }}>
              <div className="settings-list">
                {user?.role === 'admin' && (
                  <Link href="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="settings-item" style={{ background: 'var(--primary-light)', borderRadius: '10px' }}>
                      <div className="settings-item-left">
                        <Users size={18} color="var(--primary)" />
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Manage Users</span>
                        <span className="settings-item-badge" style={{ background: '#fee2e2', color: 'var(--primary)' }}>Admin</span>
                      </div>
                      <ChevronRight size={18} color="var(--primary)" />
                    </div>
                  </Link>
                )}

                <Link href="/profile/update-password" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="settings-item">
                    <div className="settings-item-left">
                      <Key size={18} color="var(--text-light)" />
                      <span>Update Password</span>
                    </div>
                    <ChevronRight size={18} color="var(--text-light)" />
                  </div>
                </Link>

                <div className="settings-item">
                  <div className="settings-item-left">
                    <UserCheck size={18} color="var(--text-light)" />
                    <span>KYC Verification</span>
                    <span className="settings-item-badge">Required</span>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>

                <div className="settings-item">
                  <div className="settings-item-left">
                    <BellOff size={18} color="var(--text-light)" />
                    <span>Manage Alerts</span>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>

                <div className="settings-item">
                  <div className="settings-item-left">
                    <Lock size={18} color="var(--text-light)" />
                    <span>Privacy Settings</span>
                  </div>
                  <ChevronRight size={18} color="var(--text-light)" />
                </div>
              </div>
            </div>

            {/* Premium Promotion Card */}
            <div className="promo-card">
              <h3>👑 Elevate Your Presence</h3>
              <p>
                Get 3x more visibility, professional photography credits, and advanced AI market insights.
              </p>
              <button className="btn-promo-action">
                Go Premium
              </button>
            </div>

            {/* Dedicated Support & Logout Panel */}
            <div className="info-section-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="support-row">
                <div className="support-icon">📞</div>
                <div className="support-text-wrapper">
                  <span className="support-title">Dedicated Support</span>
                  <span className="support-subtitle">Your Account Manager: Binod R.</span>
                </div>
              </div>
              
              {/* Logout Button */}
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18} /> Logout
              </button>
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
