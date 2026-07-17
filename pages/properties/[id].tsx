import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Heart, Bell, MapPin, Sparkles, Shield, LogOut, User, 
  ArrowLeft, Phone, Mail, MessageSquare, Star, Calendar, 
  Clock, Check, Building, Trash2, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Property, getLocalProperties } from '../../lib/propertiesData';

interface Message {
  sender: 'user' | 'landlord';
  text: string;
  timestamp: string;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout, loading } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Chat/Texting State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load property details
  useEffect(() => {
    if (id) {
      const found = getLocalProperties().find(p => p.id === id);
      if (found) {
        setProperty(found);
        // Initialize chat with a welcome message from the landlord
        setMessages([
          {
            sender: 'landlord',
            text: `Hello! Thanks for your interest in ${found.title}. How can I help you today?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
  }, [id]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Handle outside click for user profile dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const sendMessage = (textToSend: string) => {
    if (!textToSend.trim() || !property) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = { sender: 'user', text: textToSend, timestamp };
    
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate landlord reply
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        `Thanks for reaching out! Yes, ${property.title} is currently available for viewing. Would you like to schedule a visit this weekend?`,
        `Hi, the price of NPR ${property.price.toLocaleString()} is slightly negotiable for serious buyers. Let me know if you want to inspect the document papers.`,
        `Hello! I'd be happy to show you around. I am usually free in the afternoons. What day works best for you?`,
        `Thank you. I have received your message. Let me call you back on your registered phone number shortly to discuss detail specifications.`,
      ];
      // Pick response based on keywords or random
      let replyText = responses[Math.floor(Math.random() * responses.length)];
      if (textToSend.toLowerCase().includes('available')) {
        replyText = `Yes, it is still available! I've had a few inquiries today, but no booking deposit yet. Would you like to check it out?`;
      } else if (textToSend.toLowerCase().includes('viewing') || textToSend.toLowerCase().includes('visit') || textToSend.toLowerCase().includes('schedule')) {
        replyText = `Absolutely! I can arrange a viewing tomorrow or over the weekend. What time works best for you?`;
      } else if (textToSend.toLowerCase().includes('negotiable') || textToSend.toLowerCase().includes('price') || textToSend.toLowerCase().includes('discount')) {
        replyText = `There is a little room for negotiation for immediate booking, but we believe it's already priced very competitively for ${property.location}.`;
      }

      setMessages(prev => [...prev, {
        sender: 'landlord',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  if (loading || !user || !property) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Property Details...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
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
                <img src={user.profilePicture} alt={`${user.name} profile`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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

      {/* Main Details Wrapper */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Back Link */}
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.95rem', marginBottom: '24px', transition: 'color 0.2s' }} className="back-link">
          <ArrowLeft size={18} /> Back to Listings
        </Link>

        {/* Title and Headers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {property.badges.map((b, i) => (
                <span key={i} style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '4px 12px', 
                  borderRadius: '30px',
                  background: b.type === 'ai' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)' : '#e2e8f0',
                  color: b.type === 'ai' ? '#4f46e5' : '#475569',
                  border: b.type === 'ai' ? '1px solid rgba(99, 102, 241, 0.3)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {b.type === 'ai' && <Sparkles size={12} />}
                  {b.text}
                </span>
              ))}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '30px', background: '#ecfdf5', color: '#059669' }}>
                {property.type}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>{property.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '1rem' }}>
              <MapPin size={18} style={{ color: '#4f46e5' }} />
              {property.location}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4f46e5' }}>{property.priceFormatted}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}>
              <Sparkles size={14} />
              {property.matchScore}% AI Match Score
            </div>
          </div>
        </div>

        {/* Media / Main Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }} className="details-grid">
          
          {/* Left Column: Details & Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Image Showcase */}
            <div style={{ position: 'relative', height: '450px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <img src={property.image} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={() => setIsFavorite(prev => !prev)}
                style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  right: '20px', 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: '#ffffff', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: isFavorite ? '#ef4444' : '#64748b',
                  transition: 'transform 0.2s'
                }}
                className="heart-action-btn"
              >
                <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Quick Specs Grid */}
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
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Parking Space</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{property.parking ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Description Card */}
            <div style={{ background: '#ffffff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px 0', color: '#0f172a' }}>About This Property</h3>
              <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, fontSize: '1.05rem' }}>{property.description}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amenities Included</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#334155' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>✓</div>
                      <span>Private Parking Spot</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: property.security ? '#334155' : '#94a3b8' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: property.security ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: property.security ? '#059669' : '#94a3b8' }}>✓</div>
                      <span>24/7 Security Guard</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: property.balcony ? '#334155' : '#94a3b8' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: property.balcony ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: property.balcony ? '#059669' : '#94a3b8' }}>✓</div>
                      <span>Private Balcony / Terrace</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: property.waterBackup ? '#334155' : '#94a3b8' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: property.waterBackup ? '#ecfdf5' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: property.waterBackup ? '#059669' : '#94a3b8' }}>✓</div>
                      <span>Water Tank & Backup Supply</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Market Insights</h4>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                      This property is valued at average market rate in {property.city}. AI predicts a <strong>4.2% price appreciation</strong> next year. Demand liquidity in {property.location} is currently high.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Landlord Card & Chat Interface */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '100px' }}>
            
            {/* Landlord Profile Card */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Listed by Landlord</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)'
                }}>
                  {property.landlord.avatar}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>{property.landlord.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={14} fill="currentColor" />
                    <span>{property.landlord.rating} Rating</span>
                    <span style={{ color: '#94a3b8', fontWeight: 400 }}>•</span>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{property.landlord.propertiesCount} listings</span>
                  </div>
                </div>
              </div>

              {/* Landlord quick details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Response Time</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{property.landlord.responseTime}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: '2px' }}>Member Since</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{property.landlord.joinedDate}</span>
                </div>
              </div>

              {/* Contact info list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href={`tel:${property.landlord.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#475569', fontSize: '0.9rem', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} className="contact-link">
                  <Phone size={16} style={{ color: '#6366f1' }} />
                  <span>{property.landlord.phone}</span>
                </a>
                <a href={`mailto:${property.landlord.email}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#475569', fontSize: '0.9rem', padding: '8px', borderRadius: '8px', transition: 'background 0.2s' }} className="contact-link">
                  <Mail size={16} style={{ color: '#6366f1' }} />
                  <span>{property.landlord.email}</span>
                </a>
              </div>
            </div>

            {/* Direct Message (Chat) Interface */}
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0', 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column', 
              height: '420px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                      {property.landlord.avatar}
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '2px solid #ffffff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Text {property.landlord.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                      Online
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ 
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{ 
                      background: msg.sender === 'user' ? '#4f46e5' : '#f1f5f9',
                      color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{msg.timestamp}</span>
                  </div>
                ))}
                
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '10px 16px', borderRadius: '16px', maxWidth: '80%' }}>
                    <div className="typing-indicator" style={{ display: 'flex', gap: '4px' }}>
                      <span className="dot" style={{ width: '6px', height: '6px', background: '#64748b', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span className="dot" style={{ width: '6px', height: '6px', background: '#64748b', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span className="dot" style={{ width: '6px', height: '6px', background: '#64748b', borderRadius: '50%', display: 'inline-block' }}></span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>typing...</span>
                  </div>
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Quick Action Suggestion Chips */}
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="quick-chips">
                <button 
                  onClick={() => sendMessage("Hi, is this property still available?")}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '6px 12px', fontSize: '0.78rem', color: '#475569', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                  className="quick-chip-btn"
                >
                  Still Available?
                </button>
                <button 
                  onClick={() => sendMessage("I'd like to schedule a viewing visit.")}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '6px 12px', fontSize: '0.78rem', color: '#475569', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                  className="quick-chip-btn"
                >
                  Schedule Viewing
                </button>
                <button 
                  onClick={() => sendMessage("Is the pricing negotiable?")}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '6px 12px', fontSize: '0.78rem', color: '#475569', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
                  className="quick-chip-btn"
                >
                  Price Negotiable?
                </button>
              </div>

              {/* Chat Input Console */}
              <form 
                onSubmit={(e) => { e.preventDefault(); sendMessage(inputMessage); }}
                style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: '#ffffff' }}
              >
                <input 
                  type="text"
                  placeholder="Type a message to landlord..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', fontSize: '0.9rem', outline: 'none', transition: 'border 0.2s' }}
                  className="chat-input-field"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  style={{ 
                    background: '#4f46e5', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px', 
                    width: '40px', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    opacity: inputMessage.trim() ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>

            </div>

          </div>

        </div>

      </div>

      {/* CSS Styles injection */}
      <style jsx global>{`
        .typing-indicator .dot {
          animation: mercuryBounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes mercuryBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }

        .user-menu-item:hover {
          background: #f8fafc;
        }

        .quick-chips::-webkit-scrollbar {
          height: 4px;
        }
        .quick-chips::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .quick-chip-btn:hover {
          background: #e2e8f0 !important;
          border-color: #94a3b8 !important;
        }
        .contact-link:hover {
          background: #f1f5f9;
        }
        .back-link:hover {
          color: #4f46e5 !important;
        }
        .details-grid {
          grid-template-columns: 1fr;
        }
        @media (min-width: 1024px) {
          .details-grid {
            grid-template-columns: 7fr 5fr;
          }
        }
      `}</style>
    </div>
  );
}
