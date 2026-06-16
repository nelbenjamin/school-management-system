import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Shield, LogOut, Menu, X,
  GraduationCap, Bell, ChevronDown, User, Settings, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import socket from '../../utils/socket';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    socket.on('new_notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnread(prev => prev + 1);
      toast.custom((t) => (
        <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
          style={{ background: 'var(--bg-card)', border: '1px solid #2979ff40', borderRadius: 12, padding: '12px 16px', minWidth: 280, boxShadow: '0 8px 32px #00000060' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2979ff', marginBottom: 4 }}>🔔 {notif.sender_name}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{notif.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{notif.message.substring(0, 80)}...</div>
        </motion.div>
      ), { duration: 5000 });
    });
    return () => socket.off('new_notification');
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnread(res.data.unread);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, _read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['teacher', 'admin', 'principal'] },
    { icon: BookOpen, label: 'My Subjects', path: '/subjects', roles: ['teacher', 'principal'] },
    { icon: Shield, label: 'Admin Panel', path: '/admin', roles: ['admin', 'principal'] },
  ].filter(item => item.roles.includes(user?.role));

  const roleColors = { teacher: '#2979ff', admin: '#00c896', principal: '#ffaa00' };
  const roleLabels = { teacher: 'Teacher', admin: 'Administrator', principal: 'Principal' };
  const color = roleColors[user?.role] || '#2979ff';

  const typeColors = { announcement: '#2979ff', alert: '#ff4757', info: '#00c896', warning: '#ffaa00' };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 260, zIndex: 20 }}
          >
            <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px #1d6feb40' }}>
                  <GraduationCap size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>EduManage</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SCHOOL SYSTEM</div>
                </div>
              </div>
            </div>

            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>NAVIGATION</div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <div key={item.path} className={`sidebar-item ${active ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', fontSize: 14, fontWeight: active ? 600 : 400 }}>
                    <Icon size={18} />
                    {item.label}
                    {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#2979ff' }} />}
                  </div>
                );
              })}
            </nav>

            <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
                    <div style={{ fontSize: 11, color }}>{roleLabels[user?.role]}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{ height: 64, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0, position: 'relative', zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 8, borderRadius: 8 }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
              style={{ width: 40, height: 40, borderRadius: 10, background: notifOpen ? 'var(--blue-subtle)' : 'var(--bg-card)', border: `1px solid ${notifOpen ? '#2979ff40' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Bell size={17} color={notifOpen ? '#2979ff' : 'var(--text-secondary)'} />
              {unread > 0 && (
                <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, background: '#ff4757', borderRadius: '50%', border: '2px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                  {unread > 9 ? '9+' : unread}
                </div>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  style={{ position: 'absolute', top: 50, right: 0, width: 360, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 20px 60px #00000080', overflow: 'hidden', zIndex: 100 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</div>
                    {unread > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#2979ff20', color: '#2979ff', fontWeight: 700 }}>{unread} unread</span>}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications yet</div>
                    ) : notifications.map(n => {
                      const isRead = n._read || (Array.isArray(n.is_read_by) ? n.is_read_by : JSON.parse(n.is_read_by || '[]')).includes(user?.id);
                      return (
                        <div key={n.id} onClick={() => !isRead && markRead(n.id)}
                          style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isRead ? 'transparent' : '#2979ff08', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = isRead ? 'transparent' : '#2979ff08'}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[n.type] || '#2979ff', marginTop: 5, flexShrink: 0, opacity: isRead ? 0.3 : 1 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{n.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: typeColors[n.type], fontWeight: 600 }}>From: {n.sender_name}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString('en-ZA')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: userMenuOpen ? 'var(--blue-subtle)' : 'var(--bg-card)', border: `1px solid ${userMenuOpen ? '#2979ff40' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}20`, border: `1px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.full_name}</div>
                <div style={{ fontSize: 11, color, textTransform: 'capitalize' }}>{roleLabels[user?.role]}</div>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  style={{ position: 'absolute', top: 50, right: 0, width: 240, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 20px 60px #00000080', overflow: 'hidden', zIndex: 100 }}>

                  {/* Profile header */}
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', background: `${color}08` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}25`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color, marginBottom: 10 }}>
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: `${color}18`, border: `1px solid ${color}35`, borderRadius: 20, padding: '3px 10px', fontSize: 11, color, fontWeight: 700 }}>
                      {roleLabels[user?.role]}
                    </div>
                    {user?.employee_id && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>ID: {user.employee_id}</div>}
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '8px' }}>
                    {[
                      { icon: User, label: 'My Profile', action: () => {} },
                      { icon: Settings, label: 'Account Settings', action: () => {} },
                    ].map(item => (
                      <button key={item.label} onClick={item.action}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        <item.icon size={15} />
                        {item.label}
                        <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: 13, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#ff475715'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}