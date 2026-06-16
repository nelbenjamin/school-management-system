import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, ArrowRight, X, GraduationCap } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TeacherSubjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', grade_level: '', code: '' });
  const [saving, setSaving] = useState(false);

  const gradeLevels = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const subjectColors = ['#2979ff', '#00c896', '#ffaa00', '#ff6b35', '#a855f7', '#ec4899'];

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  };

  const createSubject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/subjects', form);
      setSubjects([res.data.subject, ...subjects]);
      setForm({ name: '', grade_level: '', code: '' });
      setShowModal(false);
      toast.success('Subject created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally { setSaving(false); }
  };

  const deleteSubject = async (id) => {
    if (!confirm('Delete this subject? All learners and grades will be removed.')) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(subjects.filter(s => s.id !== id));
      toast.success('Subject deleted');
    } catch { toast.error('Failed to delete subject'); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>My Subjects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} assigned</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={() => setShowModal(true)}
          style={{ padding: '11px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} /> Add Subject
        </motion.button>
      </div>

      {/* Subjects grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid #2979ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : subjects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 20px' }}
        >
          <div style={{ width: 80, height: 80, borderRadius: 24, background: '#2979ff15', border: '1px solid #2979ff30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <BookOpen size={36} color="#2979ff" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No subjects yet</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>Add your first subject to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '11px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
            Add Your First Subject
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {subjects.map((subject, i) => {
              const color = subjectColors[i % subjectColors.length];
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  className="card"
                  style={{ borderRadius: 16, padding: 24, cursor: 'pointer', position: 'relative' }}
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: `${color}20`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <GraduationCap size={24} color={color} />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, transition: 'all 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#ff4757'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{subject.name}</h3>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: `${color}15`, color, border: `1px solid ${color}30` }}>
                      {subject.grade_level}
                    </span>
                    {subject.code && (
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {subject.code}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(subject.created_at).toLocaleDateString('en-ZA')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color, fontWeight: 600 }}>
                      Open <ArrowRight size={14} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Add New Subject</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={createSubject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Subject Name *</label>
                  <input required className="input-field" placeholder="e.g. Mathematics" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Grade Level *</label>
                  <select required className="input-field" value={form.grade_level}
                    onChange={e => setForm({ ...form, grade_level: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }}>
                    <option value="">Select grade</option>
                    {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Subject Code</label>
                  <input className="input-field" placeholder="e.g. MATH101" value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 14 }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary"
                    style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Create Subject'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}