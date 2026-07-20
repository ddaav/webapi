import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles, TrendingUp, Home, Users, Clock, CheckCircle, Shield, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

interface BookingSummary {
  _id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  ownerId: string;
  bookerId: string;
  createdAt: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/bookings', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    };
    if (user) fetchBookings();
  }, [user]);

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
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Insights...</div>
      </div>
    );
  }

  const uid = (user as any)._id ?? (user as any).id;
  const received = bookings.filter(b => b.ownerId === uid);
  const made = bookings.filter(b => b.bookerId === uid);
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const marketData = [
    { area: 'Baneshwor', avgPrice: 'NPR 28M', trend: '+4.2%', demand: 'High' },
    { area: 'Lalitpur', avgPrice: 'NPR 32M', trend: '+3.1%', demand: 'High' },
    { area: 'Bhaktapur', avgPrice: 'NPR 21M', trend: '+1.8%', demand: 'Medium' },
    { area: 'Chabahil', avgPrice: 'NPR 24M', trend: '+2.6%', demand: 'Medium' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links"{...user && <Link href="/my-listings" className="nav-link">My Listings</Link>}>
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <a href="#" className="nav-link">Valuation</a>
          <Link href="/insights" className="nav-link active">Insights</Link>
          <Link href="/help" className="nav-link">Help</Link>
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

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Insights</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Your activity and the Kathmandu Valley market at a glance.</p>

        {/* Personal stats */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Your Activity</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          <StatCard icon={<Home size={20} color="#4f46e5" />} label="Bookings Received" value={loadingBookings ? '…' : received.length} />
          <StatCard icon={<Users size={20} color="#4f46e5" />} label="Bookings Made" value={loadingBookings ? '…' : made.length} />
          <StatCard icon={<CheckCircle size={20} color="#059669" />} label="Confirmed" value={loadingBookings ? '…' : confirmedCount} />
          <StatCard icon={<Clock size={20} color="#f59e0b" />} label="Pending" value={loadingBookings ? '…' : pendingCount} />
        </div>

        {/* Market insights */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>Market Insights</h2>
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Area</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Avg. Price</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>YoY Trend</th>
                <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Demand</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((row, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.area}</td>
                  <td style={{ padding: '12px 16px' }}>{row.avgPrice}</td>
                  <td style={{ padding: '12px 16px', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> {row.trend}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{row.demand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="signal-card">
          <div className="signal-card-title">
            <Sparkles size={16} /> AI Market Signal
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
            Most deals in Kathmandu Valley are closing 5–8% below listing price this quarter. Buyers with flexible move-in dates have the strongest negotiating position right now.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {icon}
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</div>
    </div>
  );
}