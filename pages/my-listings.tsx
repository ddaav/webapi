import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Shield, LogOut, User, Home, Calendar, MessageSquare, Send, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '@/components/NotificationBell';
import { formatPriceNPR } from '@/lib/formatPrice';

interface PropertyItem {
  _id: string;
  title: string;
  images: string[];
  price: number;
  location: string;
}

interface BookingItem {
  _id: string;
  propertyId: { _id: string; title: string; images: string[]; price: number };
  bookerId: { _id: string; name: string; email: string };
  ownerId: { _id: string; name: string; email: string };
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  moveInDate?: string;
  message?: string;
  createdAt: string;
}

interface ConversationItem {
  propertyId: string;
  propertyTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface MessageItem {
  _id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

type Tab = 'properties' | 'bookings' | 'messages';

export default function MyListingsPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('properties');

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Active thread state
  const [activeThread, setActiveThread] = useState<ConversationItem | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const uid = (user as any)?._id ?? (user as any)?.id;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoadingData(true);
      try {
        const [propsRes, bookingsRes, convosRes] = await Promise.all([
          fetch('/api/properties/mine', { credentials: 'include' }),
          fetch('/api/bookings', { credentials: 'include' }),
          fetch('/api/messages/conversations', { credentials: 'include' }),
        ]);
        const propsData = await propsRes.json();
        const bookingsData = await bookingsRes.json();
        const convosData = await convosRes.json();

        if (propsData.success) setProperties(propsData.properties);
        if (bookingsData.success) setBookings(bookingsData.bookings);
        if (convosData.success) setConversations(convosData.conversations);
      } catch (err) {
        console.error('Failed to load listings data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchAll();
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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => (b._id === bookingId ? { ...b, status: data.booking.status } : b)));
      }
    } catch (err) {
      console.error('Booking action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openThread = async (convo: ConversationItem) => {
    setActiveThread(convo);
    try {
      const res = await fetch(
        `/api/messages?propertyId=${convo.propertyId}&withUserId=${convo.otherUserId}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) setThreadMessages(data.messages);
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: activeThread.propertyId,
          text: replyText.trim(),
          recipientId: activeThread.otherUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setThreadMessages(prev => [...prev, data.message]);
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading My Listings...</div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.ownerId?._id === uid && b.status === 'pending');
  const otherBookings = bookings.filter(b => b.ownerId?._id === uid && b.status !== 'pending');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      <header className="navbar">
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <Link href="/valuation" className="nav-link">Valuation</Link>
          <Link href="/insights" className="nav-link">Insights</Link>
          <Link href="/help" className="nav-link">Help</Link>
          <Link href="/my-listings" className="nav-link active">My Listings</Link>
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
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>My Listings</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>Manage your properties, booking requests, and conversations.</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <TabButton active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} icon={<Home size={16} />} label={`Properties (${properties.length})`} />
          <TabButton active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Calendar size={16} />} label={`Bookings ${pendingBookings.length > 0 ? `(${pendingBookings.length} pending)` : ''}`} />
          <TabButton active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} icon={<MessageSquare size={16} />} label={`Messages (${conversations.reduce((sum, c) => sum + c.unreadCount, 0)})`} />
        </div>

        {loadingData ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading...</div>
        ) : (
          <>
            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {properties.length === 0 ? (
                  <EmptyState text="You haven't posted any properties yet." linkHref="/properties/add" linkText="Post your first property" />
                ) : (
                  properties.map((p) => (
                    <div key={p._id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={p.images?.[0]} alt={p.title} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{p.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{p.location}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4f46e5', marginTop: '4px' }}>{formatPriceNPR(p.price)}</div>
                      </div>
                      <Link href={`/properties/${p._id}`} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5', textDecoration: 'none' }}>
                        View →
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {pendingBookings.length === 0 && otherBookings.length === 0 ? (
                  <EmptyState text="No booking requests yet." />
                ) : (
                  <>
                    {pendingBookings.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>Pending Requests</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {pendingBookings.map((b) => (
                            <div key={b._id} style={{ background: '#ffffff', border: '1px solid #fde68a', background2: '#fffbeb', borderRadius: '14px', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{b.propertyId?.title}</div>
                                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                    Requested by <strong>{b.bookerId?.name}</strong> ({b.bookerId?.email})
                                  </div>
                                  {b.moveInDate && (
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                                      Preferred move-in: {new Date(b.moveInDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {b.message && (
                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>"{b.message}"</div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                  <button
                                    onClick={() => handleBookingAction(b._id, 'confirm')}
                                    disabled={actionLoading === b._id}
                                    style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Check size={14} /> Confirm
                                  </button>
                                  <button
                                    onClick={() => handleBookingAction(b._id, 'reject')}
                                    disabled={actionLoading === b._id}
                                    style={{ background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <X size={14} /> Decline
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {otherBookings.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {otherBookings.map((b) => (
                            <div key={b._id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.propertyId?.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.bookerId?.name}</div>
                              </div>
                              <StatusBadge status={b.status} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div style={{ display: 'grid', gridTemplateColumns: activeThread ? '320px 1fr' : '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {conversations.length === 0 ? (
                    <EmptyState text="No messages yet." />
                  ) : (
                    conversations.map((c) => (
                      <button
                        key={`${c.propertyId}-${c.otherUserId}`}
                        onClick={() => openThread(c)}
                        style={{
                          textAlign: 'left', background: activeThread?.otherUserId === c.otherUserId && activeThread?.propertyId === c.propertyId ? '#eef2ff' : '#ffffff',
                          border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{c.otherUserName}</span>
                          {c.unreadCount > 0 && (
                            <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', padding: '2px 7px' }}>
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{c.propertyTitle}</div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
                      </button>
                    ))
                  )}
                </div>

                {activeThread && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '480px' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>
                      {activeThread.otherUserName} — {activeThread.propertyTitle}
                    </div>
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {threadMessages.map((m) => {
                        const isMine = m.senderId === uid;
                        return (
                          <div key={m._id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                            <div style={{ background: isMine ? '#4f46e5' : '#f1f5f9', color: isMine ? '#fff' : '#1e293b', padding: '9px 13px', borderRadius: '14px', fontSize: '0.88rem' }}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messageEndRef} />
                    </div>
                    <form
                      onSubmit={(e) => { e.preventDefault(); sendReply(); }}
                      style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}
                    >
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 12px', fontSize: '0.88rem', outline: 'none' }}
                      />
                      <button type="submit" disabled={!replyText.trim() || sendingReply} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 4px', marginBottom: '-1px',
        background: 'none', border: 'none', borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
        color: active ? '#4f46e5' : '#64748b', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
      }}
    >
      {icon} {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    confirmed: { bg: '#ecfdf5', color: '#059669', icon: <Check size={12} /> },
    cancelled: { bg: '#f1f5f9', color: '#64748b', icon: <X size={12} /> },
    rejected: { bg: '#fef2f2', color: '#ef4444', icon: <X size={12} /> },
    pending: { bg: '#fffbeb', color: '#d97706', icon: <Clock size={12} /> },
  };
  const c = config[status] || config.pending;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
      {c.icon} {status}
    </span>
  );
}

function EmptyState({ text, linkHref, linkText }: { text: string; linkHref?: string; linkText?: string }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
      <p style={{ color: '#64748b', margin: linkHref ? '0 0 12px 0' : 0 }}>{text}</p>
      {linkHref && (
        <Link href={linkHref} style={{ color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}>
          {linkText} →
        </Link>
      )}
    </div>
  );
}