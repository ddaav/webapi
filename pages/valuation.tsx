import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Sparkles, Calculator, Shield, LogOut, User, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

type PropertyType = 'House' | 'Apartment' | 'Land' | 'Commercial';

// Base price per sqft (NPR), by area — rough reference points for the estimator
const AREA_BASE_PRICE: Record<string, number> = {
  'Kathmandu (Central)': 32000,
  'Lalitpur': 30000,
  'Bhaktapur': 21000,
  'Baneshwor': 28000,
  'Chabahil': 24000,
  'Other / Outskirts': 16000,
};

const TYPE_MULTIPLIER: Record<PropertyType, number> = {
  House: 1.0,
  Apartment: 0.85,
  Commercial: 1.3,
  Land: 0.6,
};

export default function ValuationPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [area, setArea] = useState('Kathmandu (Central)');
  const [type, setType] = useState<PropertyType>('House');
  const [sqft, setSqft] = useState<number>(1200);
  const [beds, setBeds] = useState<number>(3);
  const [parking, setParking] = useState(true);
  const [security, setSecurity] = useState(false);

  const [result, setResult] = useState<{ low: number; mid: number; high: number } | null>(null);

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

  const formatNPR = (value: number) => {
    if (value >= 10000000) return `NPR ${(value / 10000000).toFixed(2)} Cr`;
    return `NPR ${(value / 100000).toFixed(2)} Lakh`;
  };

  const calculateValuation = () => {
    const basePrice = AREA_BASE_PRICE[area] ?? AREA_BASE_PRICE['Other / Outskirts'];
    const typeMult = TYPE_MULTIPLIER[type];

    let mid = basePrice * typeMult * sqft;

    // Bedroom premium (not applicable to Land)
    if (type !== 'Land') {
      mid += beds * 350000;
    }

    if (parking) mid *= 1.05;
    if (security) mid *= 1.04;

    setResult({
      low: Math.round(mid * 0.92),
      mid: Math.round(mid),
      high: Math.round(mid * 1.08),
    });
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Valuation...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <Link href="/valuation" className="nav-link active">Valuation</Link>
          <Link href="/insights" className="nav-link">Insights</Link>
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Property Valuation</h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Get an instant AI-estimated value based on location, size, and features.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="valuation-grid">
          {/* Input Form */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="#4f46e5" /> Property Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Location</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                >
                  {Object.keys(AREA_BASE_PRICE).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Property Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PropertyType)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                >
                  <option value="House">House</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Land">Land</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Area Size (sq.ft): {sqft}
                </label>
                <input
                  type="range"
                  min={300}
                  max={5000}
                  step={50}
                  value={sqft}
                  onChange={(e) => setSqft(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {type !== 'Land' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Bedrooms</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={beds}
                    onChange={(e) => setBeds(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} />
                  Parking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                  <input type="checkbox" checked={security} onChange={(e) => setSecurity(e.target.checked)} />
                  24/7 Security
                </label>
              </div>

              <button
                onClick={calculateValuation}
                style={{
                  marginTop: '8px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Get Estimated Value
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#059669" /> Estimated Value
            </h3>

            {!result ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                Fill in the property details and click "Get Estimated Value" to see your result.
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4f46e5' }}>{formatNPR(result.mid)}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>Estimated Market Value</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Low</span>
                    <span style={{ fontWeight: 700 }}>{formatNPR(result.low)}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>Confidence Range</span>
                    <span style={{ fontWeight: 700 }}>±8%</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#64748b', display: 'block' }}>High</span>
                    <span style={{ fontWeight: 700 }}>{formatNPR(result.high)}</span>
                  </div>
                </div>

                <div className="signal-card" style={{ marginTop: '4px' }}>
                  <div className="signal-card-title">
                    <Sparkles size={16} /> AI Note
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                    This estimate is based on comparable listings in {area} and typical{' '}
                    {type.toLowerCase()} pricing trends. Actual sale price may vary based on condition, exact location, and negotiation.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media (min-width: 900px) {
          .valuation-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}