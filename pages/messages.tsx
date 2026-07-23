import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Send,
  MessageSquare,
  Search,
  Building,
  User,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

interface Conversation {
  propertyId: string;
  propertyTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
}

interface MessageItem {
  _id: string;
  propertyId: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
}

interface PropertyDetails {
  _id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  images: string[];
}

export default function MessagesPage() {
  const router = useRouter();
  const { propertyId: queryPropId, withUserId: queryWithUserId } = router.query;
  const { user, loading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedConv, setSelectedConv] = useState<{
    propertyId: string;
    otherUserId: string;
    propertyTitle?: string;
    otherUserName?: string;
  } | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeProperty, setActiveProperty] = useState<PropertyDetails | null>(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = (user as any)?._id ?? (user as any)?.id;

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Fetch all user conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setConversationsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Handle URL query parameters for direct navigation from Notifications
  useEffect(() => {
    if (queryPropId && queryWithUserId) {
      const pId = Array.isArray(queryPropId) ? queryPropId[0] : queryPropId;
      const uId = Array.isArray(queryWithUserId) ? queryWithUserId[0] : queryWithUserId;

      const existing = conversations.find(
        c => c.propertyId === pId && c.otherUserId === uId
      );

      if (existing) {
        setSelectedConv({
          propertyId: existing.propertyId,
          otherUserId: existing.otherUserId,
          propertyTitle: existing.propertyTitle,
          otherUserName: existing.otherUserName,
        });
      } else {
        // Conversation not yet in aggregate list (e.g. brand new thread)
        setSelectedConv({
          propertyId: pId,
          otherUserId: uId,
          propertyTitle: 'Property Inquiry',
          otherUserName: 'Booker / Owner',
        });
      }
    } else if (conversations.length > 0 && !selectedConv) {
      setSelectedConv({
        propertyId: conversations[0].propertyId,
        otherUserId: conversations[0].otherUserId,
        propertyTitle: conversations[0].propertyTitle,
        otherUserName: conversations[0].otherUserName,
      });
    }
  }, [queryPropId, queryWithUserId, conversations]);

  // Fetch messages when selected conversation changes
  const fetchMessages = async (pId: string, uId: string, quiet = false) => {
    if (!quiet) setMessagesLoading(true);
    try {
      const res = await fetch(
        `/api/messages?propertyId=${pId}&withUserId=${uId}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (!quiet) setMessagesLoading(false);
    }
  };

  // Fetch property details for active conversation header
  const fetchPropertyInfo = async (pId: string) => {
    try {
      const res = await fetch(`/api/properties/${pId}`);
      const data = await res.json();
      if (data.success && data.property) {
        setActiveProperty({
          _id: data.property._id,
          title: data.property.title,
          price: data.property.price,
          location: data.property.location,
          city: data.property.city,
          images: data.property.images || [],
        });
        if (!selectedConv?.propertyTitle || selectedConv.propertyTitle === 'Property Inquiry') {
          setSelectedConv(prev => prev ? { ...prev, propertyTitle: data.property.title } : null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch property details:', err);
    }
  };

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.propertyId, selectedConv.otherUserId);
      fetchPropertyInfo(selectedConv.propertyId);
    }
  }, [selectedConv?.propertyId, selectedConv?.otherUserId]);

  // Auto-polling every 4 seconds for live chat update
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(() => {
      fetchMessages(selectedConv.propertyId, selectedConv.otherUserId, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Outside click for user menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const content = textToSend || inputMessage;
    if (!content.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: selectedConv.propertyId,
          recipientId: selectedConv.otherUserId,
          text: content.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        setInputMessage('');
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.otherUserName.toLowerCase().includes(q) ||
      c.propertyTitle.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const quickReplies = [
    'Is this property still available?',
    'When can I schedule a viewing?',
    'What are the security deposit terms?',
    'I am interested in booking this!'
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Loading Messages...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc' }}>
      {/* Header navbar */}
      <header className="navbar" style={{ flexShrink: 0 }}>
        <div className="logo">Gharpurja Nepal</div>
        <nav className="nav-links">
          <Link href="/dashboard" className="nav-link">Properties</Link>
          <Link href="/my-listings" className="nav-link">My Listings</Link>
          <Link href="/messages" className="nav-link active">Messages</Link>
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
          <NotificationBell />
          <Link href="/properties/add" className="post-property-btn" style={{ textDecoration: 'none' }}>
            Post Property
          </Link>
          {user && (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(prev => !prev)}
                className="avatar-btn"
                style={{ background: 'none', border: '2px solid var(--border)', padding: 0 }}
              >
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={`${user.name} profile`} />
                ) : (
                  <div className="profile-avatar-placeholder-nav">{getInitials(user.name)}</div>
                )}
              </button>
              {showUserMenu && (
                <div
                  style={{
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
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{user.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{user.email}</div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      color: '#334155',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                  >
                    <User size={15} /> My Profile
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content: 2-Column Messaging Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar: Conversations list */}
        <div
          style={{
            width: '340px',
            borderRight: '1px solid var(--border)',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={20} color="var(--primary)" />
              Message Panel
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          {/* List of Conversations */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversationsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                <Building size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>No messages yet</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  When bookers or property owners send messages, they will appear here.
                </div>
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected =
                  selectedConv?.propertyId === c.propertyId &&
                  selectedConv?.otherUserId === c.otherUserId;

                return (
                  <div
                    key={`${c.propertyId}-${c.otherUserId}`}
                    onClick={() =>
                      setSelectedConv({
                        propertyId: c.propertyId,
                        otherUserId: c.otherUserId,
                        propertyTitle: c.propertyTitle,
                        otherUserName: c.otherUserName,
                      })
                    }
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      background: isSelected ? '#fef2f2' : '#ffffff',
                      borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
                        {c.otherUserName || 'User'}
                      </span>
                      {c.lastMessageAt && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🏠 {c.propertyTitle}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                        {c.lastMessage}
                      </div>
                      {c.unreadCount && c.unreadCount > 0 ? (
                        <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', padding: '2px 6px' }}>
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Chat Panel */}
        {selectedConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
            {/* Active Conversation Top Header */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid var(--border)',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'var(--primary-light, #fef2f2)',
                    color: 'var(--primary, #b91c1c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    border: '1px solid #fecaca',
                  }}
                >
                  {getInitials(selectedConv.otherUserName || 'User')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedConv.otherUserName || 'Booker / Owner'}
                    <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      Active Chat
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Regarding: <strong>{activeProperty?.title || selectedConv.propertyTitle}</strong></span>
                    {activeProperty && (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        • NPR {activeProperty.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {activeProperty && (
                <Link
                  href={`/properties/${activeProperty._id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  View Property <ExternalLink size={14} />
                </Link>
              )}
            </div>

            {/* Chat Message Stream */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: '#f8fafc' }}>
              {messagesLoading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <MessageSquare size={36} style={{ margin: '0 auto 12px', color: 'var(--primary)', opacity: 0.6 }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                    Start the conversation!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                    Send a message using the message bar below to connect directly with the {selectedConv.otherUserName || 'other party'}.
                  </div>
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.senderId === currentUserId;

                  return (
                    <div
                      key={m._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMine ? 'var(--primary, #b91c1c)' : '#ffffff',
                          color: isMine ? '#ffffff' : '#1e293b',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          border: isMine ? 'none' : '1px solid #e2e8f0',
                          fontSize: '0.92rem',
                          lineHeight: '1.45',
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.text}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', padding: '0 4px' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Replies */}
            <div
              style={{
                padding: '8px 24px',
                background: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  💬 {reply}
                </button>
              ))}
            </div>

            {/* MESSAGE INPUT BAR */}
            <div
              style={{
                padding: '16px 24px',
                background: '#ffffff',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                placeholder="Type your message to booker/owner..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '24px',
                  border: '1.5px solid var(--border)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  background: '#f8fafc',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                style={{
                  background: inputMessage.trim() && !sending ? 'var(--primary, #b91c1c)' : '#cbd5e1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state when no conversation is selected */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', flexDirection: 'column', gap: '12px', color: '#94a3b8' }}>
            <MessageSquare size={48} style={{ color: 'var(--primary)', opacity: 0.5 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
              Select a conversation to start chatting
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Bookers and owners can communicate directly through this panel.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
