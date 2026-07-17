import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { apiProxy } from '../../lib/api/apiProxy';
import { 
  Users, 
  LayoutDashboard, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Heart, 
  Bell, 
  Sparkles
} from 'lucide-react';

interface PaginatedUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  // Data States
  const [users, setUsers] = useState<PaginatedUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Status States
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Modals States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PaginatedUser | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'user' | 'admin'>('user');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Route security block
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Debounce search query
  useEffect(() => {
    const delay = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  // Fetch users when current page or search term changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers(currentPage, debouncedSearch);
    }
  }, [currentPage, debouncedSearch, user]);

  const fetchUsers = async (page: number, searchQuery: string) => {
    setIsFetchLoading(true);
    setFetchError('');
    try {
      const url = `/api/v1/admin/users?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`;
      const res = await apiProxy.get(url);
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.data || []);
        setMeta(data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 });
      } else {
        setFetchError(data.message || 'Failed to fetch users.');
      }
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'Error connecting to database server.');
    } finally {
      setIsFetchLoading(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || 'U';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Modal actions triggers
  const openCreateModal = () => {
    setSelectedUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('user');
    setFormErrors({});
    setShowFormModal(true);
  };

  const openEditModal = (userObj: PaginatedUser) => {
    setSelectedUser(userObj);
    setFormName(userObj.name);
    setFormEmail(userObj.email);
    setFormPassword('');
    setFormRole(userObj.role);
    setFormErrors({});
    setShowFormModal(true);
  };

  const openDeleteModal = (userObj: PaginatedUser) => {
    setSelectedUser(userObj);
    setShowDeleteModal(true);
  };

  // Form input validations
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) {
      errors.name = 'Name is required';
    } else if (formName.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      errors.email = 'Invalid email address';
    }

    if (!selectedUser && !formPassword) {
      errors.password = 'Password is required';
    } else if (formPassword && formPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    try {
      const payload: any = {
        name: formName,
        email: formEmail,
        role: formRole
      };
      if (formPassword) {
        payload.password = formPassword;
      }

      let res;
      if (selectedUser) {
        const userId = selectedUser._id || selectedUser.id;
        res = await apiProxy.request(`/api/v1/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiProxy.post('/api/v1/admin/users', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && (data.success || data.data)) {
        setShowFormModal(false);
        fetchUsers(currentPage, debouncedSearch);
      } else {
        setFormErrors({ server: data.message || 'Failed to save user info' });
      }
    } catch (err: any) {
      setFormErrors({ server: err.message || 'Network error, please try again.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormSubmitting(true);
    try {
      const userId = selectedUser._id || selectedUser.id;
      const res = await apiProxy.delete(`/api/v1/admin/users/${userId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setShowDeleteModal(false);
        // Handle pagination check (if last user deleted on page, step back page)
        const newPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        setCurrentPage(newPage);
        fetchUsers(newPage, debouncedSearch);
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error occurred.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Guard loading states during routing redirects
  if (loading || !user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ color: '#64748b', fontWeight: 600 }}>Verifying credentials...</div>
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

      {/* Main Layout Area */}
      <div className="admin-layout">
        {/* Admin Navigation Sidebar */}
        <aside className="admin-sidebar">
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="admin-sidebar-link">
              <LayoutDashboard size={20} />
              <span>Back to Dashboard</span>
            </div>
          </Link>
          <div className="admin-sidebar-link active">
            <Users size={20} />
            <span>Manage Users</span>
          </div>
          <div className="signal-card" style={{ marginTop: 'auto' }}>
            <div className="signal-card-title">
              <Sparkles size={16} /> Admin Controls
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
              Protected under admin scope. Use with caution when altering roles or removing user profile accounts.
            </p>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="admin-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Manage Users</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '4px' }}>
                Create, update, and manage accounts within Gharpurja Nepal.
              </p>
            </div>
            <button className="post-property-btn" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Add User
            </button>
          </div>

          {/* List Card Container */}
          <div className="admin-card">
            {/* Toolbar */}
            <div className="admin-card-header">
              <div className="admin-search-wrapper">
                <Search className="admin-search-icon" size={18} />
                <input
                  className="admin-search-input"
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {meta.total > 0 && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 500 }}>
                  Total users: <strong>{meta.total}</strong>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {fetchError && (
              <div className="state-container">
                <AlertTriangle size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <div className="state-title">Failed to load users</div>
                <div className="state-desc" style={{ marginBottom: '16px' }}>{fetchError}</div>
                <button 
                  className="post-property-btn" 
                  onClick={() => fetchUsers(currentPage, debouncedSearch)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                  <RefreshCw size={16} /> Retry Connection
                </button>
              </div>
            )}

            {/* Table Area */}
            {!fetchError && (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '220px' }}>User ID</th>
                      <th>Name / Email</th>
                      <th>Role</th>
                      <th>Registered On</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFetchLoading ? (
                      // Skeleton Lines Loading State
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="skeleton-row">
                          <td><div className="skeleton-bar sm"></div></td>
                          <td>
                            <div className="user-info-cell">
                              <div className="skeleton-avatar"></div>
                              <div style={{ flex: 1 }}>
                                <div className="skeleton-bar md" style={{ marginBottom: '6px' }}></div>
                                <div className="skeleton-bar sm"></div>
                              </div>
                            </div>
                          </td>
                          <td><div className="skeleton-bar sm"></div></td>
                          <td><div className="skeleton-bar md"></div></td>
                          <td style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="skeleton-bar sm" style={{ width: '60px' }}></div>
                          </td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      // Empty Results State
                      <tr>
                        <td colSpan={5}>
                          <div className="state-container">
                            <Search size={48} style={{ color: 'var(--text-light)', opacity: 0.5, marginBottom: '12px' }} />
                            <div className="state-title">No users found</div>
                            <div className="state-desc">
                              We couldn't find any user profiles matching "{search}".
                            </div>
                            <button 
                              className="btn-remove-avatar" 
                              onClick={() => setSearch('')}
                              style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)', marginTop: '8px' }}
                            >
                              Clear Search
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      // Render Users
                      users.map((userRow) => {
                        const userId = userRow._id || userRow.id;
                        return (
                          <tr key={userId}>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              {userId}
                            </td>
                            <td>
                              <div className="user-info-cell">
                                <div className="profile-avatar-placeholder-nav" style={{ width: '40px', height: '40px', fontSize: '0.85rem' }}>
                                  {getInitials(userRow.name)}
                                </div>
                                <div>
                                  <div className="user-name-text">{userRow.name}</div>
                                  <div className="user-email-text">{userRow.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`badge-role ${userRow.role}`}>
                                {userRow.role}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-light)' }}>
                              {formatDate(userRow.createdAt)}
                            </td>
                            <td>
                              <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                <button 
                                  className="btn-action edit" 
                                  title="Edit User" 
                                  onClick={() => openEditModal(userRow)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="btn-action delete" 
                                  title="Delete User"
                                  disabled={user.id === userId}
                                  onClick={() => openDeleteModal(userRow)}
                                  style={{ opacity: user.id === userId ? 0.3 : 1, cursor: user.id === userId ? 'not-allowed' : 'pointer' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Footer */}
            {!fetchError && !isFetchLoading && users.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing <strong>{(meta.page - 1) * meta.limit + 1}</strong> to{' '}
                  <strong>{Math.min(meta.page * meta.limit, meta.total)}</strong> of{' '}
                  <strong>{meta.total}</strong> users
                </div>
                <div className="pagination-buttons">
                  <button
                    className="btn-page"
                    disabled={meta.page === 1}
                    onClick={() => setCurrentPage(meta.page - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: meta.totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      className={`btn-page ${meta.page === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="btn-page"
                    disabled={meta.page === meta.totalPages}
                    onClick={() => setCurrentPage(meta.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">{selectedUser ? 'Edit User details' : 'Add New User'}</h2>
              <button className="btn-close-modal" onClick={() => setShowFormModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                {formErrors.server && (
                  <div style={{ color: 'var(--primary)', background: '#fef2f2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ {formErrors.server}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="Enter full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  {formErrors.name && <div className="form-error-msg">{formErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className={`form-input ${formErrors.email ? 'error' : ''}`}
                    placeholder="Enter email address"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                  {formErrors.email && <div className="form-error-msg">{formErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Password {selectedUser && <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.75rem' }}>(leave empty to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    className={`form-input ${formErrors.password ? 'error' : ''}`}
                    placeholder={selectedUser ? '••••••' : 'Enter account password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                  {formErrors.password && <div className="form-error-msg">{formErrors.password}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <select
                    className="form-select"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'user' | 'admin')}
                  >
                    <option value="user">User (Standard Access)</option>
                    <option value="admin">Admin (Full Access)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-remove-avatar"
                  style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="post-property-btn"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-container confirm-delete">
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--primary)' }}>Confirm Delete</h2>
              <button className="btn-close-modal" onClick={() => setShowDeleteModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <AlertTriangle size={36} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '8px' }}>
                    Are you sure you want to delete this user?
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                    This will permanently delete the profile for <strong>{selectedUser.name}</strong> ({selectedUser.email}). This action is irreversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-remove-avatar"
                style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="post-property-btn"
                onClick={handleDeleteUser}
                disabled={formSubmitting}
                style={{ background: 'var(--primary)' }}
              >
                {formSubmitting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
