import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronDown, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

const FAQS = [
  {
    q: 'How do I book a property?',
    a: 'Open any property listing and use the chat panel to message the landlord directly. Once you agree on terms, the landlord can confirm your booking, and you\'ll get a notification when it\'s confirmed.',
  },
  {
    q: 'How will I know if my booking is confirmed?',
    a: 'You\'ll receive an in-app notification (the bell icon in the top navbar) as soon as the landlord confirms, declines, or you cancel a booking.',
  },
  {
    q: 'Can I message a landlord before booking?',
    a: 'Yes — every property page has a direct chat panel with the landlord. Use it to ask about availability, pricing, or schedule a viewing.',
  },
  {
    q: 'How do I list my own property?',
    a: 'Click "Post Property" in the top navbar and fill out the listing form with your property details, photos, and price.',
  },
  {
    q: 'Is the pricing on listings negotiable?',
    a: 'That depends on the individual landlord. Use the chat feature on the property page to ask directly.',
  },
  {
    q: 'Who do I contact for account or technical issues?',
    a: 'Reach out to our support team at support@gharpurja.com and we\'ll get back to you as soon as possible.',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

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

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Help...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <a href="#" className="nav-link">Valuation</a>
          <Link href="/insights" className="nav-link">Insights</Link>
          <Link href="/help" className="nav-link active">Help</Link>
          {user?.role === 'admin' && (
            <Link href="/admin/users" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Admin
            </Link>
          )}
        </nav>
        <div className="nav-actions">
          <NotificationBell />
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
                <div className="profile-avatar-placeholder-nav">{getInitials(user.name)}</div>
              )}
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '180px', zIndex: 100, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{user.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{user.email}</div>
                </div>
                <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#334155', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }} className="user-menu-item">
                  <User size={15} /> My Profile
                </Link>
                <button onClick={() => { setShowUserMenu(false); logout(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', borderTop: '1px solid var(--border)' }} className="user-menu-item">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Help & FAQ</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Answers to common questions about Gharpurja Nepal.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  {item.q}
                  <ChevronDown
                    size={18}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b', flexShrink: 0 }}
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 16px 20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '32px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1e293b' }}>Still need help?</p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            Email us at{' '}
            <a href="mailto:support@gharpurja.com" style={{ color: '#4f46e5', fontWeight: 600 }}>
              support@gharpurja.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}