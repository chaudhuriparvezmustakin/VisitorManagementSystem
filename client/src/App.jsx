import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  Mail,
  Phone,
  User,
  Printer,
  X,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Filter,
  Lock,
  LogOut,
  Key,
  Crown,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Zap,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Activity,
  Check
} from 'lucide-react';
import './App.css';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('visitor_theme') || 'dark-luxe';
  });

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'visitors', 'analytics', 'passes'

  // View mode for visitors (grid vs table)
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('visitor_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Visitors & Stats State
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    checkedInCount: 0,
    checkedOutCount: 0,
    todayCount: 0
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form State
  const initialFormState = {
    visitorName: '',
    mobileNumber: '',
    email: '',
    organization: '',
    personToMeet: '',
    purpose: 'Client Meeting',
    visitDateTime: new Date().toISOString().slice(0, 16),
    status: 'Checked In',
    remarks: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Synchronize Theme Attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('visitor_theme', theme);
  }, [theme]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Visitors & Stats
  const fetchVisitors = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      let url = `/api/visitors?status=${statusFilter}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (res.status === 401) {
        handleLogout();
        showToast('Session expired. Please log in again.', 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        setVisitors(data.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showToast('Error connecting to Visitor API server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user || !user.token) return;
    try {
      const res = await fetch('/api/visitors/stats/overview', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVisitors();
      fetchStats();
    }
  }, [user, searchQuery, statusFilter]);

  // Auth Handler: Login
  const handleLogin = async (e, emailOverride, passOverride) => {
    if (e) e.preventDefault();
    const email = emailOverride || loginEmail;
    const password = passOverride || loginPassword;

    if (!email || !password) {
      showToast('Please enter both email and password', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        setUser(data.data);
        localStorage.setItem('visitor_auth_user', JSON.stringify(data.data));
        showToast(`Welcome back, ${data.data.name}! (${data.data.role.toUpperCase()})`, 'success');
      } else {
        showToast(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Error connecting to authentication server', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth Handler: Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('visitor_auth_user');
    showToast('Logged out successfully', 'info');
  };

  // Role Permissions Helper
  const canCreate = user && (user.role === 'admin' || user.role === 'receptionist');
  const canEdit = user && (user.role === 'admin' || user.role === 'receptionist');
  const canDelete = user && user.role === 'admin';
  const canSeed = user && user.role === 'admin';
  const canToggleStatus = user && (user.role === 'admin' || user.role === 'receptionist' || user.role === 'security');

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    if (!canCreate) {
      showToast('⚠️ Role Restriction: Only Receptionist or Admin can register visitors.', 'error');
      return;
    }
    setFormData({
      ...initialFormState,
      visitDateTime: new Date().toISOString().slice(0, 16)
    });
    setIsAddModalOpen(true);
  };

  // Submit Create Visitor
  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        showToast('✅ Visitor record registered successfully!', 'success');
        setIsAddModalOpen(false);
        fetchVisitors();
        fetchStats();
      } else {
        showToast(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Server error while saving visitor record', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (visitor) => {
    if (!canEdit) {
      showToast('⚠️ Role Restriction: Only Receptionist or Admin can edit details.', 'error');
      return;
    }
    setSelectedVisitor(visitor);
    const dateFormatted = visitor.visitDateTime
      ? new Date(visitor.visitDateTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    setFormData({
      visitorName: visitor.visitorName || '',
      mobileNumber: visitor.mobileNumber || '',
      email: visitor.email || '',
      organization: visitor.organization || '',
      personToMeet: visitor.personToMeet || '',
      purpose: visitor.purpose || 'Client Meeting',
      visitDateTime: dateFormatted,
      status: visitor.status || 'Checked In',
      remarks: visitor.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  // Submit Update Visitor
  const handleUpdateVisitor = async (e) => {
    e.preventDefault();
    if (!selectedVisitor) return;

    try {
      const res = await fetch(`/api/visitors/${selectedVisitor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        showToast('✏️ Visitor record updated successfully!', 'success');
        setIsEditModalOpen(false);
        setSelectedVisitor(null);
        fetchVisitors();
        fetchStats();
      } else {
        showToast(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Error updating visitor record', 'error');
    }
  };

  // Toggle Visitor Check In / Check Out Status
  const handleToggleStatus = async (visitor) => {
    if (!canToggleStatus) return;
    try {
      const res = await fetch(`/api/visitors/${visitor._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        showToast(`🔄 Status updated to ${data.data.status}`, 'info');
        fetchVisitors();
        fetchStats();
      } else {
        showToast(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Failed to toggle status', 'error');
    }
  };

  // Delete Visitor
  const handleDeleteVisitor = async () => {
    if (!selectedVisitor || !canDelete) return;
    try {
      const res = await fetch(`/api/visitors/${selectedVisitor._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();

      if (data.success) {
        showToast('🗑️ Visitor record deleted', 'success');
        setIsDeleteModalOpen(false);
        setSelectedVisitor(null);
        fetchVisitors();
        fetchStats();
      } else {
        showToast(`⚠️ ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Error deleting visitor record', 'error');
    }
  };

  // Seed Sample Data (Admin only)
  const handleSeedData = async () => {
    if (!canSeed) {
      showToast('⚠️ Admin Only: Seed operation requires System Admin privileges.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/visitors/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🌱 Seeded ${data.data.length} sample visitors!`, 'success');
        fetchVisitors();
        fetchStats();
      } else {
        showToast(`ℹ️ ${data.message}`, 'info');
      }
    } catch (err) {
      showToast('Failed to seed sample data', 'error');
    }
  };

  // View Digital Pass
  const openPassModal = (visitor) => {
    setSelectedVisitor(visitor);
    setIsPassModalOpen(true);
  };

  // Purpose stats calculation
  const purposeCounts = visitors.reduce((acc, v) => {
    acc[v.purpose] = (acc[v.purpose] || 0) + 1;
    return acc;
  }, {});

  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-blob"></div>
        <div className="auth-blob-2"></div>

        {toast && (
          <div className="toast-container">
            <div className="toast animate-fade-in">
              <Sparkles size={18} color="#818cf8" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        <div className="auth-card animate-modal">
          <div className="auth-brand-icon">
            <ShieldCheck size={36} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Visitor Portal Access
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', marginTop: '0.3rem' }}>
            Enterprise Visitor Management & Security Access Control
          </p>

          <form onSubmit={(e) => handleLogin(e)}>
            <div className="form-group" style={{ marginBottom: '1.1rem', textAlign: 'left' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }} disabled={authLoading}>
              <Key size={18} /> {authLoading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Quick Role Login Buttons */}
          <div className="demo-account-buttons">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Quick One-Click Demo Role Login:
            </span>

            <button
              className="demo-role-btn"
              onClick={() => handleLogin(null, 'admin@company.com', 'admin123')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Crown size={16} color="#f87171" />
                <span>Login as <strong>System Admin</strong></span>
              </div>
              <span className="role-badge admin">Full Control</span>
            </button>

            <button
              className="demo-role-btn"
              onClick={() => handleLogin(null, 'reception@company.com', 'reception123')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} color="#a5b4fc" />
                <span>Login as <strong>Receptionist</strong></span>
              </div>
              <span className="role-badge receptionist">CRUD Access</span>
            </button>

            <button
              className="demo-role-btn"
              onClick={() => handleLogin(null, 'security@company.com', 'security123')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#34d399" />
                <span>Login as <strong>Security Guard</strong></span>
              </div>
              <span className="role-badge security">Gate Access</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN AUTHENTICATED DASHBOARD VIEW
  return (
    <div className="app-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast animate-fade-in">
            <Sparkles size={18} color="#818cf8" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 1. COLLAPSIBLE SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          <div className="sidebar-header">
            <div className="brand-logo-group">
              <div className="brand-icon">
                <ShieldCheck size={26} />
              </div>
              {!sidebarCollapsed && (
                <div className="brand-text">
                  <span className="brand-title">Visitor Hub</span>
                  <span className="brand-subtitle">Security Portal</span>
                </div>
              )}
            </div>
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutGrid size={18} />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            <button
              className={`nav-item ${activeTab === 'visitors' ? 'active' : ''}`}
              onClick={() => setActiveTab('visitors')}
            >
              <Users size={18} />
              {!sidebarCollapsed && (
                <>
                  <span>Visitors Directory</span>
                  <span className="nav-badge">{stats.totalVisitors}</span>
                </>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 size={18} />
              {!sidebarCollapsed && <span>Analytics</span>}
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          {/* Theme Switcher Widget */}
          {!sidebarCollapsed && (
            <div className="theme-selector-card">
              <span className="theme-label">Interface Theme</span>
              <div className="theme-options-grid">
                <button
                  className={`theme-option-btn ${theme === 'dark-luxe' ? 'active' : ''}`}
                  onClick={() => setTheme('dark-luxe')}
                  title="Dark Luxe Glass"
                >
                  <Moon size={14} />
                </button>
                <button
                  className={`theme-option-btn ${theme === 'aurora-light' ? 'active' : ''}`}
                  onClick={() => setTheme('aurora-light')}
                  title="Aurora Light Glass"
                >
                  <Sun size={14} />
                </button>
                <button
                  className={`theme-option-btn ${theme === 'cyber-neon' ? 'active' : ''}`}
                  onClick={() => setTheme('cyber-neon')}
                  title="Cyber Neon Security"
                >
                  <Zap size={14} />
                </button>
                <button
                  className={`theme-option-btn ${theme === 'ibm-corporate' ? 'active' : ''}`}
                  onClick={() => setTheme('ibm-corporate')}
                  title="IBM Tech Corporate"
                >
                  <Building size={14} />
                </button>
              </div>
            </div>
          )}

          {/* User Profile & Role Info */}
          <div className="user-profile-widget">
            <div className="avatar-circle">
              {user.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'admin' ? '👑 Admin' : user.role === 'receptionist' ? '📋 Reception' : '🛡️ Security'}
                </span>
              </div>
            )}
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Sign Out"
              style={{ marginLeft: 'auto', color: '#f87171' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="page-title-group">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'visitors' && 'Visitor Directory & Pass Management'}
              {activeTab === 'analytics' && 'Analytics & Security Reports'}
            </h1>
            <p>Welcome back, {user.name}. Enterprise Reception & Access Control System.</p>
          </div>

          <div className="top-actions">
            <div className="live-clock-badge">
              <Clock size={16} />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* View Mode Switcher (Grid vs Table) */}
            {activeTab !== 'analytics' && (
              <div className="view-toggle-group">
                <button
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid Cards View"
                >
                  <LayoutGrid size={15} /> Grid
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table List View"
                >
                  <List size={15} /> Table
                </button>
              </div>
            )}

            {canSeed && (
              <button className="btn-secondary" onClick={handleSeedData} title="Load Sample Visitor Records">
                <RefreshCw size={16} />
                <span>Seed Data</span>
              </button>
            )}

            <button
              className="btn-primary"
              onClick={openCreateModal}
              disabled={!canCreate}
              title={!canCreate ? 'Requires Receptionist or Admin Role' : 'Register New Visitor'}
            >
              <Plus size={18} />
              <span>Register Visitor</span>
            </button>
          </div>
        </header>

        {/* 3. OVERVIEW STATS ANALYTICS GRID */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Registered</span>
              <span className="stat-value">{stats.totalVisitors}</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-total">
              <Users size={26} />
            </div>
          </div>

          <div className="stat-card stat-in">
            <div className="stat-info">
              <span className="stat-label">Currently Checked In</span>
              <span className="stat-value" style={{ color: '#34d399' }}>{stats.checkedInCount}</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-in">
              <UserCheck size={26} />
            </div>
          </div>

          <div className="stat-card stat-out">
            <div className="stat-info">
              <span className="stat-label">Checked Out</span>
              <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.checkedOutCount}</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-out">
              <UserX size={26} />
            </div>
          </div>

          <div className="stat-card stat-today">
            <div className="stat-info">
              <span className="stat-label">Today's Visits</span>
              <span className="stat-value" style={{ color: '#22d3ee' }}>{stats.todayCount}</span>
            </div>
            <div className="stat-icon-wrapper stat-icon-today">
              <Calendar size={26} />
            </div>
          </div>
        </section>

        {/* ANALYTICS SECTION OVERVIEW (IF ANALYTICS TAB SELECTED OR IN DASHBOARD) */}
        {(activeTab === 'analytics' || activeTab === 'dashboard') && (
          <section className="analytics-widget">
            <div>
              <div className="analytics-block-title">
                <Activity size={18} color="#06b6d4" />
                <span>Check-In Efficiency & Capacity</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Active visitors currently on premises vs total registered records.
              </p>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${stats.totalVisitors ? Math.round((stats.checkedInCount / stats.totalVisitors) * 100) : 0}%` }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>{stats.checkedInCount} Active Onsite</span>
                <span>{stats.totalVisitors ? Math.round((stats.checkedInCount / stats.totalVisitors) * 100) : 0}% Occupancy Ratio</span>
              </div>
            </div>

            <div>
              <div className="analytics-block-title">
                <BarChart2 size={18} color="#818cf8" />
                <span>Visit Purpose Distribution</span>
              </div>
              <div className="purpose-pills-wrap">
                {Object.keys(purposeCounts).length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No visit data available yet</span>
                ) : (
                  Object.entries(purposeCounts).map(([purpose, count]) => (
                    <div key={purpose} className="purpose-pill-tag">
                      <span>{purpose}</span>
                      <strong>{count}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4. CONTROL TOOLBAR: SEARCH & FILTERS */}
        {activeTab !== 'analytics' && (
          <>
            <div className="toolbar-card">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by Visitor Name, Mobile Number, Organization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <Filter size={15} /> Status Filter:
                </span>
                <button
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({stats.totalVisitors})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'Checked In' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Checked In')}
                >
                  Checked In ({stats.checkedInCount})
                </button>
                <button
                  className={`filter-btn ${statusFilter === 'Checked Out' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('Checked Out')}
                >
                  Checked Out ({stats.checkedOutCount})
                </button>
              </div>
            </div>

            {/* 5. VISITOR RECORDS DISPLAY (GRID OR TABLE) */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
                <RefreshCw className="animate-spin" size={28} color="#6366f1" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading visitor records...</p>
              </div>
            ) : visitors.length === 0 ? (
              <div className="table-card empty-state">
                <Users className="empty-icon" />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>No visitor records found</h3>
                <p style={{ marginTop: '0.4rem', fontSize: '0.88rem' }}>
                  {searchQuery ? `No results found matching "${searchQuery}"` : 'Click "Register Visitor" or "Seed Data" to create entries.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID CARDS VIEW */
              <div className="visitors-cards-grid">
                {visitors.map((v) => (
                  <div key={v._id} className="visitor-card animate-fade-in">
                    <div>
                      <div className="card-top-row">
                        <span className="pass-badge">{v.passId || 'VIS-2026-N/A'}</span>
                        <button
                          className={`status-pill ${v.status === 'Checked In' ? 'checked-in' : 'checked-out'}`}
                          onClick={() => handleToggleStatus(v)}
                          disabled={!canToggleStatus}
                          title="Click to toggle status"
                          style={{ cursor: 'pointer', border: '1px solid transparent' }}
                        >
                          {v.status === 'Checked In' ? (
                            <>
                              <span className="pulse-dot"></span> Checked In
                            </>
                          ) : (
                            <>
                              <XCircle size={13} /> Checked Out
                            </>
                          )}
                        </button>
                      </div>

                      <div className="card-visitor-profile">
                        <div className="card-avatar">
                          {v.visitorName ? v.visitorName.charAt(0) : 'V'}
                        </div>
                        <div>
                          <div className="card-visitor-name">{v.visitorName}</div>
                          <div className="card-visitor-org">
                            <Building size={13} />
                            <span>{v.organization}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-details-box">
                        <div className="detail-row">
                          <span className="detail-label"><User size={13} /> Host:</span>
                          <span className="detail-val">{v.personToMeet}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label"><Phone size={13} /> Contact:</span>
                          <span className="detail-val">{v.mobileNumber}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label"><Mail size={13} /> Email:</span>
                          <span className="detail-val" style={{ fontSize: '0.78rem' }}>{v.email}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label"><Sparkles size={13} /> Purpose:</span>
                          <span className="detail-val" style={{ color: 'var(--accent-cyan)' }}>{v.purpose}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label"><Clock size={13} /> Visit Time:</span>
                          <span className="detail-val" style={{ fontSize: '0.78rem' }}>
                            {new Date(v.visitDateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(v.visitDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions-bar">
                      <button className="btn-secondary" style={{ flex: 1, padding: '0.45rem', justifyContent: 'center' }} onClick={() => openPassModal(v)}>
                        <Eye size={15} /> Pass Badge
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => openEditModal(v)}
                        disabled={!canEdit}
                        title={canEdit ? "Edit Visitor Details" : "Requires Receptionist or Admin Role"}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => { setSelectedVisitor(v); setIsDeleteModalOpen(true); }}
                        disabled={!canDelete}
                        title={canDelete ? "Delete Visitor Record" : "Admin Only Function"}
                        style={{ color: canDelete ? '#f87171' : 'var(--text-muted)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="table-card animate-fade-in">
                <div className="table-responsive">
                  <table className="visitor-table">
                    <thead>
                      <tr>
                        <th>Pass ID</th>
                        <th>Visitor Name & Contact</th>
                        <th>Organization / College</th>
                        <th>Person to Meet</th>
                        <th>Purpose</th>
                        <th>Date & Time</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((v) => (
                        <tr key={v._id}>
                          <td>
                            <span className="pass-badge">{v.passId || 'VIS-2026-N/A'}</span>
                          </td>
                          <td>
                            <div className="visitor-name-cell">
                              <div className="avatar-circle" style={{ width: '34px', height: '34px', fontSize: '0.9rem' }}>
                                {v.visitorName ? v.visitorName.charAt(0) : 'V'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.visitorName}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '2px' }}>
                                  <span><Phone size={11} style={{ display: 'inline', marginRight: '2px' }} />{v.mobileNumber}</span>
                                  <span>•</span>
                                  <span>{v.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                              <Building size={14} color="#94a3b8" />
                              <span>{v.organization}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <User size={14} color="#94a3b8" />
                              <span>{v.personToMeet}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem' }}>
                              {v.purpose}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                              <div>{new Date(v.visitDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {new Date(v.visitDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </td>
                          <td>
                            <button
                              className={`status-pill ${v.status === 'Checked In' ? 'checked-in' : 'checked-out'}`}
                              onClick={() => handleToggleStatus(v)}
                              disabled={!canToggleStatus}
                              title="Click to toggle Check-In / Check-Out status"
                              style={{ cursor: 'pointer', border: '1px solid transparent' }}
                            >
                              {v.status === 'Checked In' ? (
                                <>
                                  <span className="pulse-dot"></span> Checked In
                                </>
                              ) : (
                                <>
                                  <XCircle size={13} /> Checked Out
                                </>
                              )}
                            </button>
                          </td>
                          <td>
                            <div className="actions-cell" style={{ justifyContent: 'center' }}>
                              <button className="btn-icon" onClick={() => openPassModal(v)} title="View Digital Pass Badge">
                                <Eye size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => openEditModal(v)}
                                disabled={!canEdit}
                                title={canEdit ? "Edit Visitor Details" : "Requires Receptionist or Admin Role"}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() => { setSelectedVisitor(v); setIsDeleteModalOpen(true); }}
                                disabled={!canDelete}
                                title={canDelete ? "Delete Visitor Record" : "Admin Only Function"}
                                style={{ color: canDelete ? '#f87171' : 'var(--text-muted)' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE VISITOR MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                <Plus size={20} color="#818cf8" />
                Register New Visitor
              </h2>
              <button className="btn-icon" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVisitor}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Visitor Name <span>*</span></label>
                    <input
                      type="text"
                      name="visitorName"
                      required
                      className="form-control"
                      placeholder="e.g. Aarav Sharma"
                      value={formData.visitorName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number <span>*</span></label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      required
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="form-control"
                      placeholder="e.g. visitor@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Organization / College <span>*</span></label>
                    <input
                      type="text"
                      name="organization"
                      required
                      className="form-control"
                      placeholder="e.g. TechCorp / MIT College"
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Person to Meet <span>*</span></label>
                    <input
                      type="text"
                      name="personToMeet"
                      required
                      className="form-control"
                      placeholder="e.g. Dr. Rajesh Verma (VP)"
                      value={formData.personToMeet}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose of Visit <span>*</span></label>
                    <select
                      name="purpose"
                      className="form-control"
                      value={formData.purpose}
                      onChange={handleInputChange}
                    >
                      <option value="Client Meeting">Client Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Industrial Visit">Industrial Visit</option>
                      <option value="Vendor Visit">Vendor Visit</option>
                      <option value="Official Business">Official Business</option>
                      <option value="Guest / Personal">Guest / Personal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date and Time of Visit <span>*</span></label>
                    <input
                      type="datetime-local"
                      name="visitDateTime"
                      required
                      className="form-control"
                      value={formData.visitDateTime}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Initial Status <span>*</span></label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Checked In">Checked In</option>
                      <option value="Checked Out">Checked Out</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Remarks / Gate Notes</label>
                    <input
                      type="text"
                      name="remarks"
                      className="form-control"
                      placeholder="e.g. Laptop serial number, vehicle number, badge ID"
                      value={formData.remarks}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircle size={16} /> Register Visitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VISITOR MODAL */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                <Edit2 size={20} color="#818cf8" />
                Update Visitor Details
              </h2>
              <button className="btn-icon" onClick={() => setIsEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateVisitor}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Visitor Name <span>*</span></label>
                    <input
                      type="text"
                      name="visitorName"
                      required
                      className="form-control"
                      value={formData.visitorName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number <span>*</span></label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      required
                      className="form-control"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Organization / College <span>*</span></label>
                    <input
                      type="text"
                      name="organization"
                      required
                      className="form-control"
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Person to Meet <span>*</span></label>
                    <input
                      type="text"
                      name="personToMeet"
                      required
                      className="form-control"
                      value={formData.personToMeet}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose of Visit <span>*</span></label>
                    <select
                      name="purpose"
                      className="form-control"
                      value={formData.purpose}
                      onChange={handleInputChange}
                    >
                      <option value="Client Meeting">Client Meeting</option>
                      <option value="Interview">Interview</option>
                      <option value="Industrial Visit">Industrial Visit</option>
                      <option value="Vendor Visit">Vendor Visit</option>
                      <option value="Official Business">Official Business</option>
                      <option value="Guest / Personal">Guest / Personal</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date and Time of Visit <span>*</span></label>
                    <input
                      type="datetime-local"
                      name="visitDateTime"
                      required
                      className="form-control"
                      value={formData.visitDateTime}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status <span>*</span></label>
                    <select
                      name="status"
                      className="form-control"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Checked In">Checked In</option>
                      <option value="Checked Out">Checked Out</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Remarks / Gate Notes</label>
                    <input
                      type="text"
                      name="remarks"
                      className="form-control"
                      value={formData.remarks}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircle size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL HOLOGRAPHIC PASS BADGE MODAL */}
      {isPassModalOpen && selectedVisitor && (
        <div className="modal-overlay">
          <div className="modal-card animate-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <ShieldCheck size={20} color="#06b6d4" />
                Digital Visitor Pass Badge
              </h2>
              <button className="btn-icon" onClick={() => setIsPassModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="visitor-badge-card">
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontWeight: 700 }}>
                  EMPLOYEE VISITOR ACCESS PASS
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  {selectedVisitor.passId || 'VIS-2026-XXXX'}
                </div>

                <div className="badge-avatar">
                  {selectedVisitor.visitorName ? selectedVisitor.visitorName.charAt(0) : 'V'}
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'white', marginBottom: '0.2rem' }}>
                  {selectedVisitor.visitorName}
                </h3>
                <p style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.92rem', marginBottom: '1.2rem' }}>
                  {selectedVisitor.organization}
                </p>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', textAlign: 'left', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Person to Meet:</span>
                    <strong style={{ color: 'white' }}>{selectedVisitor.personToMeet}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Purpose:</span>
                    <strong style={{ color: 'var(--accent-primary)' }}>{selectedVisitor.purpose}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Contact Mobile:</span>
                    <strong style={{ color: 'white' }}>{selectedVisitor.mobileNumber}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Visit Date & Time:</span>
                    <strong style={{ color: 'white' }}>{new Date(selectedVisitor.visitDateTime).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                    <strong style={{ color: selectedVisitor.status === 'Checked In' ? '#34d399' : '#fbbf24' }}>
                      {selectedVisitor.status}
                    </strong>
                  </div>
                </div>

                <div className="badge-qr-placeholder">
                  <svg width="90" height="90" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    <path d="M10,10 h30 v30 h-30 z M50,10 h40 v10 h-40 z M10,50 h10 v40 h-10 z M30,50 h30 v30 h-30 z M70,50 h20 v40 h-20 z" fill="#0f172a" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => window.print()}>
                <Printer size={16} /> Print Visitor Pass
              </button>
              <button className="btn-primary" onClick={() => setIsPassModalOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedVisitor && (
        <div className="modal-overlay">
          <div className="modal-card animate-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <h2 className="modal-title" style={{ color: '#f87171' }}>
                <Trash2 size={20} color="#f87171" />
                Confirm Deletion (Admin Only)
              </h2>
              <button className="btn-icon" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Delete Visitor Record?
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Are you sure you want to delete the record for <strong>{selectedVisitor.visitorName}</strong> ({selectedVisitor.passId})? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteVisitor}>
                <Trash2 size={16} /> Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


























