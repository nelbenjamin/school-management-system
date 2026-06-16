import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Users, TrendingUp, Award, ArrowRight, GraduationCap, Shield, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleColors = { teacher: '#2979ff', admin: '#00c896', principal: '#ffaa00' };
  const color = roleColors[user?.role] || '#2979ff';

  const teacherCards = [
    { icon: BookOpen, label: 'My Subjects', desc: 'Manage your subjects and classes', path: '/subjects', color: '#2979ff' },
    { icon: Users, label: 'Learners', desc: 'View and manage all your learners', path: '/subjects', color: '#00c896' },
    { icon: TrendingUp, label: 'Grade Analytics', desc: 'Track learner performance', path: '/subjects', color: '#ffaa00' },
    { icon: Award, label: 'Evaluations', desc: 'CA calculations and assessments', path: '/subjects', color: '#ff6b35' },
  ];

  const adminCards = [
    { icon: Shield, label: 'Admin Panel', desc: 'Manage school operations', path: '/admin', color: '#00c896' },
    { icon: Users, label: 'Staff Management', desc: 'Oversee all staff members', path: '/admin', color: '#2979ff' },
    { icon: BarChart2, label: 'School Reports', desc: 'View school-wide analytics', path: '/admin', color: '#ffaa00' },
  ];

  const cards = user?.role === 'teacher' ? teacherCards : adminCards;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          border: `1px solid ${color}30`,
          borderRadius: 20, padding: '28px 32px', marginBottom: 28,
          position: 'relative', overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', opacity: 0.06 }}>
          <GraduationCap size={120} color={color} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 13, color: color, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {user?.role === 'teacher' ? '👋 Good day, Teacher' : user?.role === 'principal' ? '👋 Good day, Principal' : '👋 Good day, Admin'}
          </p>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {user?.full_name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {user?.role === 'teacher'
              ? 'Manage your subjects, track learner progress and record grades from your dashboard.'
              : user?.role === 'principal'
              ? 'Oversee school performance, staff activity and all academic operations.'
              : 'Manage school operations, staff records and administrative duties.'
            }
          </p>
          {user?.employee_id && (
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: '4px 12px', fontSize: 12, color: color }}>
              Employee ID: {user.employee_id}
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick action cards */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
              onClick={() => navigate(card.path)}
              style={{ borderRadius: 16, padding: 24, cursor: 'pointer' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${card.color}20`, border: `1px solid ${card.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
              }}>
                <card.icon size={22} color={card.color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{card.label}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{card.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: card.color, fontWeight: 500 }}>
                Open <ArrowRight size={14} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}
      >
        {[
          { label: 'Academic Year', value: new Date().getFullYear(), color: '#2979ff' },
          { label: 'Current Term', value: 'Term 2', color: '#00c896' },
          { label: 'System Status', value: 'Online', color: '#00c896' },
          { label: 'Your Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1), color },
        ].map((item) => (
          <div key={item.label} className="card" style={{ borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}