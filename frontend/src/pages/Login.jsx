import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const SCHOOL_IMAGES = [
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80',
];

const STATS = [
  { icon: Users, value: '1,200+', label: 'Learners Enrolled' },
  { icon: BookOpen, value: '48', label: 'Subjects Offered' },
  { icon: Award, value: '96%', label: 'Pass Rate' },
  { icon: TrendingUp, value: '15+', label: 'Years of Excellence' },
];

const TESTIMONIALS = [
  { text: 'EduManage transformed how we track learner progress. Everything is so streamlined now.', name: 'Ms. Dlamini', role: 'Mathematics Teacher' },
  { text: 'The grade analytics are incredibly insightful. I can identify struggling learners instantly.', name: 'Mr. Mokoena', role: 'Science Department' },
  { text: 'Best school management system we have ever used. Fast, beautiful and reliable.', name: 'Mrs. Nkosi', role: 'Deputy Principal' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const imgTimer = setInterval(() => setCurrentImage(i => (i + 1) % SCHOOL_IMAGES.length), 4000);
    const testTimer = setInterval(() => setCurrentTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => { clearInterval(imgTimer); clearInterval(testTimer); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* LEFT PANEL — Image + Info */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }}
        className="login-left-panel">
        <style>{`
          @media (min-width: 900px) { .login-left-panel { display: block !important; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes gradientShift { 0%,100% { opacity:0.7 } 50% { opacity:0.9 } }
          @keyframes floatBadge { 0%,100% { transform:translateY(0px) } 50% { transform:translateY(-8px) } }
          @keyframes counterUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        `}</style>

        {/* Sliding images */}
        <AnimatePresence mode="crossfade">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${SCHOOL_IMAGES[currentImage]})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
        </AnimatePresence>

        {/* Dark overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #020408ee 0%, #0d1520cc 40%, #1d6feb33 100%)',
        }} />

        {/* Blue grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Content on image */}
        <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '36px 40px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px #1d6feb50' }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>EduManage</div>
              <div style={{ fontSize: 10, color: '#2979ff', fontWeight: 600, letterSpacing: '0.15em' }}>SCHOOL SYSTEM</div>
            </div>
          </div>

          {/* Middle content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2979ff', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
                🎓 Welcome to
              </div>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 44, fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.03em' }}>
                Empowering<br />
                <span style={{ background: 'linear-gradient(135deg, #2979ff, #00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Education
                </span>
              </h1>
              <p style={{ fontSize: 15, color: 'rgba(232,240,254,0.75)', lineHeight: 1.7, maxWidth: 380, marginBottom: 36 }}>
                A complete school management solution built for teachers, administrators and principals to work smarter and achieve more.
              </p>
            </motion.div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{
                    background: 'rgba(13,21,32,0.7)',
                    border: '1px solid rgba(29,111,235,0.3)',
                    borderRadius: 12, padding: '14px 16px',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <stat.icon size={14} color="#2979ff" />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk' }}>{stat.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Testimonial */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: 'rgba(29,111,235,0.12)',
                  border: '1px solid rgba(29,111,235,0.25)',
                  borderRadius: 14, padding: '18px 20px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{ fontSize: 13, color: 'rgba(232,240,254,0.85)', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>
                  "{TESTIMONIALS[currentTestimonial].text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
                    {TESTIMONIALS[currentTestimonial].name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{TESTIMONIALS[currentTestimonial].name}</div>
                    <div style={{ fontSize: 11, color: '#2979ff' }}>{TESTIMONIALS[currentTestimonial].role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Image dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {SCHOOL_IMAGES.map((_, i) => (
              <div key={i} onClick={() => setCurrentImage(i)} style={{ height: 4, width: i === currentImage ? 24 : 8, borderRadius: 2, background: i === currentImage ? '#2979ff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div style={{
        width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 48px', overflowY: 'auto',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border)',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #1d6feb, #2979ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px #1d6feb40' }}>
              <GraduationCap size={20} color="white" />
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>EduManage</div>
          </div>

          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="you@school.edu"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  className="input-field"
                  style={{ width: '100%', padding: '13px 14px 13px 44px', borderRadius: 12, fontSize: 14 }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  className="input-field"
                  style={{ width: '100%', padding: '13px 44px 13px 44px', borderRadius: 12, fontSize: 14 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ padding: '15px', borderRadius: 13, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, letterSpacing: '0.01em' }}
            >
              {loading
                ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <> Sign In <ArrowRight size={18} /> </>
              }
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>New to EduManage?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <Link to="/register" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: 13, fontSize: 14, fontWeight: 600,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Create a new account <ArrowRight size={16} color="#2979ff" />
            </motion.div>
          </Link>

          {/* Role hint badges */}
          <div style={{ marginTop: 28, padding: '16px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Levels</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[{ label: 'Teacher', color: '#2979ff' }, { label: 'Administrator', color: '#00c896' }, { label: 'Principal', color: '#ffaa00' }].map(r => (
                <span key={r.label} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}35`, fontWeight: 600 }}>
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}