import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, BarChart2, Bell, Settings, TrendingUp,
  BookOpen, Award, CheckCircle, XCircle, Send, X, Plus,
  Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeOverview, setGradeOverview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'announcement', target_role: 'all' });
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, staffRes, subjectsRes, gradesRes, notifRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/staff'),
        api.get('/admin/subjects/all'),
        api.get('/admin/grades/overview'),
        api.get('/notifications'),
      ]);
      setStats(statsRes.data.stats);
      setStaff(staffRes.data.staff);
      setSubjects(subjectsRes.data.subjects);
      setGradeOverview(gradesRes.data);
      setNotifications(notifRes.data.notifications);
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/staff/${id}/status`, { is_active: !currentStatus });
      setStaff(staff.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
      toast.success('Staff status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const sendNotification = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/notifications', notifForm);
      setNotifications([res.data.notification, ...notifications]);
      setNotifForm({ title: '', message: '', type: 'announcement', target_role: 'all' });
      setShowNotifModal(false);
      toast.success('Notification sent to all staff!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const PIE_COLORS = { excellent: '#00c896', good: '#2979ff', average: '#ffaa00', at_risk: '#ff6b35', critical: '#ff4757' };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid #2979ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading admin data...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#00c89620', border: '1px solid #00c89640', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="#00c896" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>School management & operations</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAll} style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {(user?.role === 'principal' || user?.role === 'admin') && (
            <button onClick={() => setShowNotifModal(true)} className="btn-primary"
              style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={14} /> Send Notification
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', border: activeTab === tab.id ? '1px solid var(--border-bright)' : '1px solid transparent', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Staff', value: stats.totalStaff, icon: Users, color: '#2979ff' },
              { label: 'Teachers', value: stats.totalTeachers, icon: BookOpen, color: '#00c896' },
              { label: 'Subjects', value: stats.totalSubjects, icon: Award, color: '#ffaa00' },
              { label: 'Learners', value: stats.totalLearners, icon: Users, color: '#a855f7' },
              { label: 'Grade Records', value: stats.totalGrades, icon: TrendingUp, color: '#ff6b35' },
              { label: 'Pass Rate', value: stats.passRate + '%', icon: CheckCircle, color: '#00c896' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="card" style={{ borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={14} color={s.color} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {gradeOverview?.byTerm && gradeOverview.byTerm.length > 0 && (
              <div className="card" style={{ borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Average Score by Term</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradeOverview.byTerm}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                    <XAxis dataKey="term" tick={{ fill: '#7a9abf', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#7a9abf', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2d45', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="avg" fill="#2979ff" radius={[6, 6, 0, 0]} name="Average %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {gradeOverview?.distribution && (
              <div className="card" style={{ borderRadius: 16, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Grade Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Excellent (80%+)', value: gradeOverview.distribution.excellent || 0 },
                      { name: 'Good (65-79%)', value: gradeOverview.distribution.good || 0 },
                      { name: 'Average (50-64%)', value: gradeOverview.distribution.average || 0 },
                      { name: 'At Risk (40-49%)', value: gradeOverview.distribution.at_risk || 0 },
                      { name: 'Critical (<40%)', value: gradeOverview.distribution.critical || 0 },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {Object.values(PIE_COLORS).map((color, i) => <Cell key={i} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2d45', borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a9abf' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Top subjects */}
          {gradeOverview?.bySubject && gradeOverview.bySubject.length > 0 && (
            <div className="card" style={{ borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Subject Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gradeOverview.bySubject.map((s, i) => {
                  const avg = parseFloat(s.avg);
                  const color = avg >= 80 ? '#00c896' : avg >= 65 ? '#2979ff' : avg >= 50 ? '#ffaa00' : '#ff4757';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{s.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({s.grade_level})</span></div>
                      <div style={{ width: 200, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${avg}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color, minWidth: 48, textAlign: 'right' }}>{avg.toFixed(1)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 60 }}>{s.count} grades</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* STAFF TAB */}
      {activeTab === 'staff' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>All Staff Members ({staff.length})</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Name</span><span>Email</span><span>Role</span><span>Subjects</span><span>Status</span><span>Action</span>
            </div>
            {staff.map(member => {
              const roleColors = { teacher: '#2979ff', admin: '#00c896', principal: '#ffaa00' };
              const rc = roleColors[member.role] || '#7a9abf';
              return (
                <div key={member.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr auto', padding: '14px 20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${rc}20`, border: `1px solid ${rc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: rc, flexShrink: 0 }}>
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{member.full_name}</div>
                      {member.employee_id && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {member.employee_id}</div>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${rc}18`, color: rc, border: `1px solid ${rc}35`, fontWeight: 600, width: 'fit-content', textTransform: 'capitalize' }}>{member.role}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{member.subject_count || 0}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: member.is_active ? '#00c896' : '#ff4757' }} />
                    <span style={{ fontSize: 12, color: member.is_active ? '#00c896' : '#ff4757', fontWeight: 600 }}>{member.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button onClick={() => toggleStaffStatus(member.id, member.is_active)}
                    style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: member.is_active ? '#ff475715' : '#00c89615', border: `1px solid ${member.is_active ? '#ff475740' : '#00c89640'}`, color: member.is_active ? '#ff4757' : '#00c896', cursor: 'pointer' }}>
                    {member.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>All Subjects ({subjects.length})</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Subject</span><span>Teacher</span><span>Grade</span><span>Learners</span><span>Avg Score</span>
            </div>
            {subjects.map((s, i) => {
              const avg = s.avg_score ? parseFloat(s.avg_score) : null;
              const color = avg ? (avg >= 80 ? '#00c896' : avg >= 65 ? '#2979ff' : avg >= 50 ? '#ffaa00' : '#ff4757') : '#7a9abf';
              return (
                <div key={s.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '14px 20px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    {s.code && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.code}</div>}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.teacher_name}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.grade_level}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.learner_count || 0}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{avg ? avg.toFixed(1) + '%' : '—'}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Sent Notifications ({notifications.length})</h3>
            <button onClick={() => setShowNotifModal(true)} className="btn-primary"
              style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> New Notification
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#2979ff15', border: '1px solid #2979ff30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Bell size={28} color="#2979ff" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No notifications sent yet</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(n => {
                const typeColors = { announcement: '#2979ff', alert: '#ff4757', info: '#00c896', warning: '#ffaa00' };
                const tc = typeColors[n.type] || '#2979ff';
                return (
                  <div key={n.id} className="card" style={{ borderRadius: 14, padding: '18px 20px', borderLeft: `3px solid ${tc}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${tc}18`, color: tc, border: `1px solid ${tc}35`, fontWeight: 700, textTransform: 'capitalize' }}>{n.type}</span>
                          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→ {n.target_role === 'all' ? 'Everyone' : n.target_role}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString('en-ZA')}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{n.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Sent by: {n.sender_name}</div>
                      </div>
                      <button onClick={() => deleteNotification(n.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, marginLeft: 12 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff4757'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* SEND NOTIFICATION MODAL */}
      <AnimatePresence>
        {showNotifModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowNotifModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Send Notification</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Broadcast to staff in real-time</p>
                </div>
                <button onClick={() => setShowNotifModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={sendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
                    <select required className="input-field" value={notifForm.type} onChange={e => setNotifForm({ ...notifForm, type: e.target.value })}
                      style={{ width: '100%', padding: '11px 12px', borderRadius: 10, fontSize: 13 }}>
                      {['announcement', 'alert', 'info', 'warning'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</label>
                    <select required className="input-field" value={notifForm.target_role} onChange={e => setNotifForm({ ...notifForm, target_role: e.target.value })}
                      style={{ width: '100%', padding: '11px 12px', borderRadius: 10, fontSize: 13 }}>
                      <option value="all">All Staff</option>
                      <option value="teacher">Teachers Only</option>
                      <option value="admin">Admins Only</option>
                      <option value="principal">Principal Only</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title *</label>
                  <input required className="input-field" placeholder="Notification title" value={notifForm.title}
                    onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message *</label>
                  <textarea required className="input-field" placeholder="Write your message here..." value={notifForm.message}
                    onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                    rows={4} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowNotifModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={sending} className="btn-primary"
                    style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {sending
                      ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <><Send size={15} /> Send Now</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}