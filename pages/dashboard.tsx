import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { Heart, Bell, Search, MapPin, Sliders, CheckCircle, Award, Sparkles, Flame, Eye, Landmark, Navigation, Users, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { Property, getLocalProperties } from '../lib/propertiesData';



export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [likedProperties, setLikedProperties] = useState<Record<string, boolean>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('Kathmandu, Nepal');
  const [selectedType, setSelectedType] = useState<'House' | 'Apartment' | 'Land' | 'Commercial' | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(45); // Representing Millions
  const [aiMatchOnly, setAiMatchOnly] = useState(false);
  const [amenities, setAmenities] = useState({
    parking: true,
    security: false,
    balcony: false,
    waterBackup: false,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    const loaded = getLocalProperties();
    setProperties(loaded);
    setFilteredProperties(loaded);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  // Apply filters
  useEffect(() => {
    let result = properties;

    // Filter by type
    if (selectedType) {
      result = result.filter(p => p.type === selectedType);
    }

    // Filter by Price (NPR Millions)
    result = result.filter(p => p.price <= maxPrice * 1000000);

    // Filter by Location search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.location.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
    }

    // Filter by AI Match Score (e.g. only 90% or higher if toggled)
    if (aiMatchOnly) {
      result = result.filter(p => p.matchScore >= 90);
    }

    // Filter by Amenities
    if (amenities.parking) {
      result = result.filter(p => p.parking);
    }
    if (amenities.security) {
      result = result.filter(p => p.security);
    }
    if (amenities.balcony) {
      result = result.filter(p => p.balcony);
    }
    if (amenities.waterBackup) {
      result = result.filter(p => p.waterBackup);
    }

    setFilteredProperties(result);
  }, [selectedType, maxPrice, searchQuery, aiMatchOnly, amenities]);

  const handleResetFilters = () => {
    setSearchQuery('Kathmandu, Nepal');
    setSelectedType(null);
    setMaxPrice(45);
    setAiMatchOnly(false);
    setAmenities({
      parking: true,
      security: false,
      balcony: false,
      waterBackup: false,
    });
  };

  const toggleLike = (id: string) => {
    setLikedProperties(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAmenityChange = (name: keyof typeof amenities) => {
    setAmenities(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Dashboard...</div>
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
          <Link href="/dashboard" className="nav-link active">Properties</Link>
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
          <Link href="/properties/add" className="post-property-btn" style={{ textDecoration: 'none' }}>
            Post Property
          </Link>
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="avatar-btn"
              style={{ background: 'none', border: '2px solid var(--border)', padding: 0 }}
            >
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={`${user.name} profile`} />
              ) : (
                <div className="profile-avatar-placeholder-nav">
                  {getInitials(user.name)}
                </div>
              )}
            </button>
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: '180px',
                zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{user.email}</div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowUserMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s' }}
                  className="user-menu-item"
                >
                  <User size={15} /> My Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin/users"
                    onClick={() => setShowUserMenu(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s' }}
                    className="user-menu-item"
                  >
                    <Shield size={15} /> Manage Users
                  </Link>
                )}
                <button
                  onClick={() => { setShowUserMenu(false); logout(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}
                  className="user-menu-item"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <div className="dashboard-container">
        {/* Sidebar Filter Panel */}
        <aside className="sidebar">
          <div className="sidebar-group">
            <div className="sidebar-title">Location</div>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search City or Area"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-title">Property Type</div>
            <div className="type-tags">
              {(['House', 'Apartment', 'Land', 'Commercial'] as const).map(type => (
                <button
                  key={type}
                  className={`type-tag ${selectedType === type ? 'active' : ''}`}
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-title">Price Range (NPR)</div>
            <div className="slider-wrapper">
              <div className="price-range-text">15M – {maxPrice}M</div>
              <input
                type="range"
                className="price-slider"
                min="15"
                max="45"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
          </div>

          {/* AI Market Signal Widget */}
          <div className="signal-card">
            <div className="signal-card-title">
              <Sparkles size={16} /> AI Market Signal
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569' }}>
              Most deals in Kathmandu closing 5–8% below listing. Set range to 35M for highest liquidity.
            </p>
          </div>

          <div className="sidebar-group">
            <div className="toggle-group">
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>AI Match Score (90%+)</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={aiMatchOnly}
                  onChange={(e) => setAiMatchOnly(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-title">Amenities</div>
            <div className="checkbox-list">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={amenities.parking}
                  onChange={() => handleAmenityChange('parking')}
                />
                Parking (Private)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={amenities.security}
                  onChange={() => handleAmenityChange('security')}
                />
                24/7 Security
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={amenities.balcony}
                  onChange={() => handleAmenityChange('balcony')}
                />
                Balcony/Terrace
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={amenities.waterBackup}
                  onChange={() => handleAmenityChange('waterBackup')}
                />
                Water Backup
              </label>
            </div>
          </div>

          <button onClick={handleResetFilters} className="btn-sidebar-reset">
            Reset All Filters
          </button>

          {user?.role === 'admin' && (
            <Link href="/admin/users" style={{ textDecoration: 'none', marginTop: '16px' }}>
              <div className="signal-card" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div className="signal-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} /> Admin Panel
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
                  Manage users, roles, and accounts.
                </p>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Go to Manage Users →
                </div>
              </div>
            </Link>
          )}
        </aside>

        {/* Main Feed Content */}
        <main className="feed-content">
          <div className="feed-header">
            <div>
              <h2>Properties in Kathmandu</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
                Showing {filteredProperties.length} of {properties.length} luxury and family homes
              </p>
            </div>
            <div className="view-toggle-group">
              <button className="view-toggle-btn active">
                📊 List
              </button>
              <button className="view-toggle-btn">
                🗺️ Map
              </button>
            </div>
          </div>

          {/* Properties Grid */}
          {filteredProperties.length > 0 ? (
            <div className="property-grid">
              {filteredProperties.map((property) => (
                <div key={property.id} className="property-card">
                  {/* Card Image and Badges */}
                  <div className="property-card-image">
                    <img src={property.image} alt={property.title} />
                    <div className="card-badges">
                      {property.badges.map((badge, index) => (
                        <span
                          key={index}
                          className={badge.type === 'sale' ? 'badge-for-sale' : 'badge-ai-verified'}
                        >
                          {badge.type === 'ai' && <Sparkles size={12} style={{ color: 'var(--primary)' }} />}
                          {badge.text}
                        </span>
                      ))}
                    </div>
                    <button
                      className={`card-heart-btn ${likedProperties[property.id] ? 'liked' : ''}`}
                      onClick={() => toggleLike(property.id)}
                    >
                      <Heart size={18} fill={likedProperties[property.id] ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="property-card-details">
                    <div className="card-price-row">
                      <div className="card-price">{property.priceFormatted}</div>
                      <div className="card-match-badge">{property.matchScore}% AI Match</div>
                    </div>
                    <h3 className="card-title">{property.title}</h3>
                    <div className="card-location">
                      <MapPin size={16} color="var(--primary)" />
                      {property.location}
                    </div>

                    <div className="card-specs">
                      <div className="card-spec-item">🛏️ {property.beds} Beds</div>
                      <div className="card-spec-item">🛁 {property.baths} Baths</div>
                      <div className="card-spec-item">📐 {property.sqft} sq.ft</div>
                    </div>

                    <Link href={`/properties/${property.id}`} className="btn-card-action" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', lineHeight: '2.5' }}>
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '64px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              <h3>No properties match your filters</h3>
              <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>Try loosening your constraints or resetting filters.</p>
              <button
                onClick={handleResetFilters}
                className="btn-sidebar-reset"
                style={{ marginTop: '20px', padding: '8px 24px' }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {filteredProperties.length > 0 && (
            <div className="pagination">
              <button className="pagination-btn">‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">›</button>
            </div>
          )}
        </main>
      </div>

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
