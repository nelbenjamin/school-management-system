import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Mail, Lock, User, Phone, BadgeCheck, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = ['Your Role', 'Personal Info', 'Security'];

const ROLE_OPTIONS = [
  {
    value: 'teacher',
    label: 'Teacher',
    color: '#2979ff',
    emoji: '📚',
    desc: 'Manage subjects, learners and grades',
    perks: ['Add & manage subjects', 'Record learner grades', 'View analytics & insights', 'AI-powered feedback'],
  },
  {
    value: 'admin',
    label: 'Administrator',
    color: '#00c896',
    emoji: '🗂️',
    desc: 'Handle school operations and records',
    perks: ['Manage school records', 'Generate reports', 'Staff oversight', 'System configuration'],
  },
  {
    value: 'principal',
    label: 'Principal',
    color: '#ffaa00',
    emoji: '🏫',
    desc: 'Full oversight of all school activities',
    perks: ['Full system access', 'School-wide analytics', 'Staff performance view', 'All teacher data'],
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: '', employee_id: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedRole = ROLE_OPTIONS.find(r => r.value === form.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome, ${user.full_name.split(' ')[0]}! Account created.`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.role;
    if (step === 1) return form.full_name && form.email;
    return form.password.length >= 6;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* LEFT PANEL */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="reg-left-panel">
        <style>{`.reg-left-panel { display: block !important; } @media (max-width: 900px) { .reg-left-panel { display: none !important; } }`}</style>

        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900&q=80)`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #020408f0 0%, #0d1520dd 50%, #1d6feb22 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '36px 44px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px #1d6feb50' }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 20, color: 'white' }}>EduManage</div>
              <div style={{ fontSize: 10, color: '#2979ff', fontWeight: 600, letterSpacing: '0.15em' }}>SCHOOL SYSTEM</div>
            </div>
          </div>

          {/* Big heading */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2979ff', letterSpacing: '0.14em', marginBottom: 14, textTransform: 'uppercase' }}>Join Our Platform</div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 18, letterSpacing: '-0.03em' }}>
                Start Your<br />
                <span style={{ background: 'linear-gradient(135deg, #2979ff, #00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Journey
                </span>
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(232,240,254,0.7)', lineHeight: 1.7, maxWidth: 360, marginBottom: 40 }}>
                Create your account and join hundreds of educators already using EduManage to deliver better outcomes for learners.
              </p>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { emoji: '⚡', text: 'Instant setup — be productive in minutes' },
                  { emoji: '🔒', text: 'Enterprise-grade security for all your data' },
                  { emoji: '📊', text: 'Real-time analytics and AI-powered insights' },
                  { emoji: '🎯', text: 'Role-based access for every staff member' },
                ].map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(29,111,235,0.15)', border: '1px solid rgba(29,111,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {f.emoji}
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(232,240,254,0.8)' }}>{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Role preview if selected */}
          <AnimatePresence>
            {selectedRole && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  background: `${selectedRole.color}15`,
                  border: `1px solid ${selectedRole.color}35`,
                  borderRadius: 14, padding: '18px 20px',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: selectedRole.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {selectedRole.emoji} {selectedRole.label} Access Includes:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedRole.perks.map(perk => (
                    <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(232,240,254,0.8)' }}>
                      <CheckCircle size={13} color={selectedRole.color} />
                      {perk}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL — Multi-step form */}
      <div style={{
        width: '100%', maxWidth: 540,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 48px', overflowY: 'auto',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>EduManage</div>
          </div>

          {/* Step header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: i < step ? '#00c896' : i === step ? '#2979ff' : 'var(--bg-card)',
                    border: `2px solid ${i < step ? '#00c896' : i === step ? '#2979ff' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: i <= step ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.3s',
                  }}>
                    {i < step ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: i === step ? 'var(--text-primary)' : 'var(--text-muted)' }}>{s}</span>
                  {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: i < step ? '#00c896' : 'var(--border)', borderRadius: 1, transition: 'all 0.3s' }} />}
                </div>
              ))}
            </div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {step === 0 ? 'Choose your role' : step === 1 ? 'Personal details' : 'Secure your account'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {step === 0 ? 'Select the role that best describes your position' : step === 1 ? 'Tell us a bit about yourself' : 'Create a strong password to protect your account'}
            </p>
          </div>

          {/* Step 0 — Role selection */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ROLE_OPTIONS.map(role => (
                  <motion.div
                    key={role.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setForm({ ...form, role: role.value })}
                    style={{
                      padding: '18px 20px', borderRadius: 14, cursor: 'pointer',
                      border: form.role === role.value ? `2px solid ${role.color}` : '1px solid var(--border)',
                      background: form.role === role.value ? `${role.color}12` : 'var(--bg-card)',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    {form.role === role.value && (
                      <div style={{ position: 'absolute', top: 16, right: 16 }}>
                        <CheckCircle size={18} color={role.color} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span style={{ fontSize: 22 }}>{role.emoji}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: form.role === role.value ? role.color : 'var(--text-primary)' }}>{role.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{role.desc}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Step 1 — Personal info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'full_name', label: 'Full Name', icon: User, placeholder: 'e.g. Sipho Dlamini', type: 'text', required: true },
                  { key: 'email', label: 'Email Address', icon: Mail, placeholder: 'sipho@school.edu', type: 'email', required: true },
                  { key: 'employee_id', label: 'Employee ID', icon: BadgeCheck, placeholder: 'e.g. EMP2024001', type: 'text', required: false },
                  { key: 'phone', label: 'Phone Number', icon: Phone, placeholder: '+27 12 345 6789', type: 'text', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {field.label} {field.required && <span style={{ color: '#2979ff' }}>*</span>}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <field.icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key]}
                        onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                        required={field.required}
                        className="input-field"
                        style={{ width: '100%', padding: '12px 13px 12px 38px', borderRadius: 11, fontSize: 14 }}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 2 — Password */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Summary card */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Name</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{form.full_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{form.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Role</span>
                      <span style={{ color: selectedRole?.color, fontWeight: 700 }}>{selectedRole?.label}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Password <span style={{ color: '#2979ff' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input-field"
                      style={{ width: '100%', padding: '12px 40px 12px 38px', borderRadius: 11, fontSize: 14 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length >= i * 3 ? (form.password.length >= 9 ? '#00c896' : form.password.length >= 6 ? '#ffaa00' : '#ff4757') : 'var(--border)', transition: 'all 0.3s' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: form.password.length >= 9 ? '#00c896' : form.password.length >= 6 ? '#ffaa00' : '#ff4757' }}>
                        {form.password.length >= 9 ? 'Strong password' : form.password.length >= 6 ? 'Moderate password' : 'Weak — add more characters'}
                      </div>
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={handleSubmit}
                  disabled={loading || !canNext()}
                  className="btn-primary"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ padding: '15px', borderRadius: 13, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, opacity: canNext() ? 1 : 0.5 }}
                >
                  {loading
                    ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <> Create Account <CheckCircle size={18} /> </>
                  }
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          {step < 2 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => canNext() && setStep(step + 1)}
                disabled={!canNext()}
                className="btn-primary"
                style={{ flex: 1, padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: canNext() ? 1 : 0.4 }}
              >
                Continue <ArrowRight size={16} />
              </motion.button>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2979ff', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}