import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';
import { formatPriceNPR } from '@/lib/formatPrice';
import {
  Heart, MapPin, Sparkles, Shield, LogOut, User,
  ArrowLeft, Phone, Mail, Send, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Owner {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface PropertyData {
  _id: string;
  title: string;
  description: string;
  location: string;
  city: string;
  price: number;
  type: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  parking?: boolean;
  security?: boolean;
  balcony?: boolean;
  waterBackup?: boolean;
  images: string[];
  badges?: string[];
  ownerId: Owner;
}

interface MessageItem {
  _id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout, loading } = useAuth();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Booking state
  const [moveInDate, setMoveInDate] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSent, setBookingSent] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const uid = (user as any)?._id ?? (user as any)?.id;
  const isOwner = !!user && !!property && property.ownerId?._id === uid;

  // Load property details
  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      setPropertyLoading(true);
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();
        if (data.success) {
          setProperty(data.property);
        }
      } catch (err) {
        console.error('Failed to fetch property:', err);
      } finally {
        setPropertyLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // Load message history (only when logged in, viewing as a non-owner, and property is loaded)
  useEffect(() => {
    if (!user || !property || isOwner) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `/api/messages?propertyId=${property._id}&withUserId=${property.ownerId._id}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    fetchMessages();
  }, [user, property, isOwner]);

  // Scroll chat to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close user menu on outside click
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
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !property || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: property._id,
          text: inputMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setInputMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const submitBookingRequest = async () => {
    if (!property) return;
    setBookingSubmitting(true);
    setBookingError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: property._id,
          moveInDate: moveInDate || undefined,
          message: bookingNote || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.message || 'Failed to send booking request.');
        return;
      }
      setBookingSent(true);
    } catch (err) {
      console.error('Failed to create booking:', err);
      setBookingError('Failed to send booking request.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading || propertyLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Property Details...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '12px' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Property not found.</div>
        <Link href="/dashboard" style={{ color: '#4f46e5', fontWeight: 600 }}>Back to listings</Link>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      {/* Header navbar */}
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link active">Properties</Link>
          {user && <Link href="/my-listings" className="nav-link">My Listings</Link>}
          {user && <Link href="/messages" className="nav-link">Messages</Link>}
          <Link href="/valuation" className="nav-link">Valuation</Link>
          <Link href="/insights" className="nav-link">Insights</Link>
          <Link href="/help" className="nav-link">Help</Link>
          {user?.role === 'admin' && (
            <Link href="/admin/users" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Admin
            </Link>
          )}
        </nav>
        <div className="nav-actions">
          {user && <NotificationBell />}
          <Link href={user ? "/properties/add" : "/login"} className="post-property-btn" style={{ textDecoration: 'none' }}>
            Post Property
          </Link>
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="avatar-btn"
                style={{ background: 'none', border: '2px solid var(--border)', padding: 0 }}
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={`${user.name} profile`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="profile-avatar-placeholder-nav">{getInitials(user.name)}</div>
                )}
              </button>
              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', zIndex: 100, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }} className="user-menu-item">
                    <User size={15} /> My Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin/users" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }} className="user-menu-item">
                      <Shield size={15} /> Manage Users
                    </Link>
                  )}
                  <button onClick={() => { setShowUserMenu(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid var(--border)' }} className="user-menu-item">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="post-property-btn" style={{ textDecoration: 'none', background: '#1e293b' }}>
              Log In
            </Link>
          )}
        </div>
      </header>

      {/* Main Details Wrapper */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.95rem', marginBottom: '24px' }} className="back-link">
          <ArrowLeft size={18} /> Back to Listings
        </Link>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {property.badges?.map((b, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '30px',
                  background: b === 'ai_verified' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)' : '#e2e8f0',
                  color: b === 'ai_verified' ? '#4f46e5' : '#475569',
                  border: b === 'ai_verified' ? '1px solid rgba(99, 102, 241, 0.3)' : 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  {b === 'ai_verified' && <Sparkles size={12} />}
                  {b === 'ai_verified' ? 'AI Verification Requested' : b === 'value_pick' ? 'Value Pick' : 'Hot Listing'}
                </span>
              ))}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '30px', background: '#ecfdf5', color: '#059669' }}>
                {property.type}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{property.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '1rem' }}>
              <MapPin size={18} style={{ color: '#4f46e5' }} />
              {property.location}, {property.city}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4f46e5' }}>{formatPriceNPR(property.price)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }} className="details-grid">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ position: 'relative', height: '450px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <img src={property.images?.[0]} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                onClick={() => setIsFavorite(prev => !prev)}
                style={{
                  position: 'absolute', top: '20px', right: '20px', width: '48px', height: '48px',
                  borderRadius: '50%', background: '#ffffff', border: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: isFavorite ? '#ef4444' : '#64748b',
                }}
                className="heart-action-btn"
              >
                <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            {property.type !== 'Land' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛏️</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Bedrooms</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{property.beds} Beds</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛁</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Bathrooms</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{property.baths} Baths</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📐</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Area Size</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{property.sqft} sqft</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🚗</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Parking</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{property.parking ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}

            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>About This Property</h3>
              <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>{property.description}</p>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amenities Included</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <AmenityRow label="Private Parking Spot" active={!!property.parking} />
                  <AmenityRow label="24/7 Security Guard" active={!!property.security} />
                  <AmenityRow label="Private Balcony / Terrace" active={!!property.balcony} />
                  <AmenityRow label="Water Tank & Backup Supply" active={!!property.waterBackup} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '100px' }}>
            {/* Landlord Card — real data only */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Listed by</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: property.ownerId?.phone || property.ownerId?.email ? '20px' : 0 }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#ffffff',
                  fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {getInitials(property.ownerId?.name || 'U')}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{property.ownerId?.name || 'Property Owner'}</h4>
                </div>
              </div>

              {(property.ownerId?.phone || property.ownerId?.email) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {property.ownerId?.phone && (
                    <a href={`tel:${property.ownerId.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#475569', fontSize: '0.9rem', padding: '8px', borderRadius: '8px' }} className="contact-link">
                      <Phone size={16} style={{ color: '#6366f1' }} />
                      <span>{property.ownerId.phone}</span>
                    </a>
                  )}
                  {property.ownerId?.email && (
                    <a href={`mailto:${property.ownerId.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#475569', fontSize: '0.9rem', padding: '8px', borderRadius: '8px' }} className="contact-link">
                      <Mail size={16} style={{ color: '#6366f1' }} />
                      <span>{property.ownerId.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Booking Request Card */}
            {!isOwner && (
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#4f46e5" /> Request to Book
                </h3>

                {!user ? (
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    <Link href="/login" style={{ color: '#4f46e5', fontWeight: 700 }}>Log in</Link> to request a booking for this property.
                  </div>
                ) : bookingSent ? (
                  <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 600 }}>
                    ✓ Booking request sent! You'll be notified when the landlord responds.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Preferred Move-in Date</label>
                      <input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => setMoveInDate(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Note (optional)</label>
                      <textarea
                        rows={3}
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        placeholder="Anything the landlord should know..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem', resize: 'vertical' }}
                      />
                    </div>
                    {bookingError && (
                      <div style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '8px' }}>{bookingError}</div>
                    )}
                    <button
                      onClick={submitBookingRequest}
                      disabled={bookingSubmitting}
                      style={{
                        width: '100%', background: '#4f46e5', color: '#ffffff', border: 'none',
                        borderRadius: '10px', padding: '12px', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer', opacity: bookingSubmitting ? 0.7 : 1,
                      }}
                    >
                      {bookingSubmitting ? 'Sending...' : 'Send Booking Request'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Direct Message (Chat) Interface — real, only for non-owners who are logged in */}
            {!isOwner && (
              <div style={{
                background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden',
                display: 'flex', flexDirection: 'column', height: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
              }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Message {property.ownerId?.name || 'Owner'}</div>
                </div>

                {!user ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      <Link href="/login" style={{ color: '#4f46e5', fontWeight: 700 }}>Log in</Link> to message the landlord.
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '20px' }}>
                          No messages yet. Say hello!
                        </div>
                      )}
                      {messages.map((msg) => {
                        const isMine = msg.senderId === uid;
                        return (
                          <div key={msg._id} style={{
                            alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%',
                            display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start'
                          }}>
                            <div style={{
                              background: isMine ? '#4f46e5' : '#f1f5f9', color: isMine ? '#ffffff' : '#1e293b',
                              padding: '10px 14px', borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              fontSize: '0.9rem', lineHeight: 1.4,
                            }}>
                              {msg.text}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messageEndRef} />
                    </div>

                    <form
                      onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                      style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#ffffff' }}
                    >
                      <input
                        type="text"
                        placeholder="Type a message to landlord..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', fontSize: '0.9rem', outline: 'none' }}
                        className="chat-input-field"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || sending}
                        style={{
                          background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '12px',
                          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: inputMessage.trim() ? 1 : 0.6,
                        }}
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {isOwner && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                This is your listing. Booking requests and messages from interested tenants will appear in your notifications.
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .contact-link:hover { background: #f1f5f9; }
        .back-link:hover { color: #4f46e5 !important; }
        .details-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .details-grid { grid-template-columns: 7fr 5fr; }
        }
      `}</style>
    </div>
  );
}

function AmenityRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: active ? '#334155' : '#94a3b8' }}>
      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: active ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#059669' : '#94a3b8' }}>✓</div>
      <span>{label}</span>
    </div>
  );
}