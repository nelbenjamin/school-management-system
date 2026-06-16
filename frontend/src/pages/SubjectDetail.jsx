import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Users, BarChart2, Award, X, Trash2,
  TrendingUp, AlertTriangle, CheckCircle, Star, Calculator,
  FileSpreadsheet, FileText, File, Download, ChevronDown
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { exportToExcel, exportToPDF, exportToWord } from '../utils/exportUtils';

export default function SubjectDetail() {
  const { subjectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [learners, setLearners] = useState([]);
  const [grades, setGrades] = useState([]);
  const [activeTab, setActiveTab] = useState('learners');
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [showAddLearner, setShowAddLearner] = useState(false);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showCAModal, setShowCAModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [caFormula, setCAFormula] = useState({ components: [{ name: 'Test 1', weight: 25 }, { name: 'Test 2', weight: 25 }, { name: 'Exam', weight: 50 }], finalMarkFormula: 'ca * 0.4 + exam * 0.6' });
  const [caResults, setCAResults] = useState([]);
  const [learnerForm, setLearnerForm] = useState({ full_name: '', student_number: '', grade_level: '', gender: '', parent_contact: '' });
  const [gradeForm, setGradeForm] = useState({ learner_id: '', assessment_type: 'test', assessment_name: '', marks_obtained: '', total_marks: '', term: 'Term 1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [subjectId]);

  const fetchAll = async () => {
    try {
      const [learnersRes, gradesRes] = await Promise.all([
        api.get(`/learners/subject/${subjectId}`),
        api.get(`/grades/subject/${subjectId}`)
      ]);
      setLearners(learnersRes.data.learners);
      setGrades(gradesRes.data.grades);
    } catch { toast.error('Failed to load data'); }
  };

  const fetchAnalytics = async (learnerId) => {
    try {
      const res = await api.get(`/grades/analytics/${learnerId}/${subjectId}`);
      setAnalytics(res.data);
    } catch { toast.error('Failed to load analytics'); }
  };

  const addLearner = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.post('/learners', { ...learnerForm, subject_id: subjectId });
      setLearners([...learners, res.data.learner]);
      setLearnerForm({ full_name: '', student_number: '', grade_level: '', gender: '', parent_contact: '' });
      setShowAddLearner(false);
      toast.success('Learner added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addGrade = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/grades', { ...gradeForm, subject_id: subjectId });
      const res = await api.get(`/grades/subject/${subjectId}`);
      setGrades(res.data.grades);
      setGradeForm({ learner_id: '', assessment_type: 'test', assessment_name: '', marks_obtained: '', total_marks: '', term: 'Term 1' });
      setShowAddGrade(false);
      toast.success('Grade recorded!');
      if (selectedLearner) fetchAnalytics(selectedLearner.id);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteGrade = async (id) => {
    try {
      await api.delete(`/grades/${id}`);
      setGrades(grades.filter(g => g.id !== id));
      toast.success('Grade removed');
      if (selectedLearner) fetchAnalytics(selectedLearner.id);
    } catch { toast.error('Failed'); }
  };

  // ── CA Calculator
  const calculateCA = () => {
    const results = learners.map(learner => {
      const lg = grades.filter(g => g.learner_id === learner.id);
      const componentScores = {};
      caFormula.components.forEach(comp => {
        const matching = lg.filter(g => g.assessment_name.toLowerCase().includes(comp.name.toLowerCase()) || g.assessment_type.toLowerCase().includes(comp.name.toLowerCase()));
        const avg = matching.length > 0 ? matching.reduce((s, g) => s + parseFloat(g.percentage), 0) / matching.length : 0;
        componentScores[comp.name] = avg;
      });

      const ca = caFormula.components.reduce((total, comp) => {
        return total + (componentScores[comp.name] * (comp.weight / 100));
      }, 0);

      let finalMark = ca;
      try {
        const examGrades = lg.filter(g => g.assessment_type === 'exam');
        const exam = examGrades.length > 0 ? examGrades.reduce((s, g) => s + parseFloat(g.percentage), 0) / examGrades.length : 0;
        const formula = caFormula.finalMarkFormula.replace('ca', ca).replace('exam', exam);
        finalMark = Math.min(100, Math.max(0, eval(formula)));
      } catch { finalMark = ca; }

      return {
        learner_id: learner.id,
        learner_name: learner.full_name,
        student_number: learner.student_number,
        componentScores,
        ca_percentage: ca.toFixed(1),
        final_mark: finalMark.toFixed(1),
        status: finalMark >= 50 ? 'pass' : 'fail',
      };
    });
    setCAResults(results);
    setShowCAModal(false);
    setActiveTab('ca');
    toast.success('CA calculated successfully!');
  };

  const handleExport = (type) => {
    const subjectName = subject?.name || `Subject ${subjectId}`;
    const gradeLevel = subject?.grade_level || '';
    try {
      if (type === 'excel') exportToExcel(subjectName, gradeLevel, user.full_name, learners, grades, caResults);
      else if (type === 'pdf') exportToPDF(subjectName, gradeLevel, user.full_name, learners, grades, caResults);
      else if (type === 'word') exportToWord(subjectName, gradeLevel, user.full_name, learners, grades, caResults);
      toast.success(`${type.toUpperCase()} exported successfully!`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed. Please try again.');
    }
    setShowExportMenu(false);
  };

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await api.get('/subjects');
        const found = res.data.subjects.find(s => s.id === parseInt(subjectId));
        if (found) setSubject(found);
      } catch {}
    };
    fetchSubject();
  }, [subjectId]);

  const openLearnerAnalytics = (learner) => {
    setSelectedLearner(learner);
    fetchAnalytics(learner.id);
    setActiveTab('analytics');
  };

  const learnerGrades = selectedLearner ? grades.filter(g => g.learner_id === selectedLearner.id) : [];
  const gradeChartData = learnerGrades.map(g => ({ name: g.assessment_name || g.assessment_type, percentage: parseFloat(g.percentage), obtained: parseFloat(g.marks_obtained), total: parseFloat(g.total_marks) }));

  const statusConfig = {
    excellent: { color: '#00c896', icon: Star, label: 'Excellent' },
    good: { color: '#2979ff', icon: CheckCircle, label: 'Good' },
    average: { color: '#ffaa00', icon: TrendingUp, label: 'Average' },
    'at-risk': { color: '#ff6b35', icon: AlertTriangle, label: 'At Risk' },
    critical: { color: '#ff4757', icon: AlertTriangle, label: 'Critical' },
  };

  const tabs = [
    { id: 'learners', label: 'Learners', icon: Users, count: learners.length },
    { id: 'grades', label: 'Grades', icon: Award, count: grades.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'ca', label: 'CA & Finals', icon: Calculator, count: caResults.length },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/subjects')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, padding: 0 }}>
          <ArrowLeft size={16} /> Back to Subjects
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {subject?.name || `Subject ${subjectId}`}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{subject?.grade_level} · {learners.length} learners · {grades.length} grade records</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAddLearner(true)}
              style={{ padding: '10px 16px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={15} /> Add Learner
            </button>
            <button onClick={() => setShowAddGrade(true)} className="btn-primary"
              style={{ padding: '10px 16px', borderRadius: 11, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Add Grade
            </button>
            <button onClick={() => setShowCAModal(true)}
              style={{ padding: '10px 16px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: '#ffaa0015', border: '1px solid #ffaa0040', color: '#ffaa00', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calculator size={15} /> Calculate CA
            </button>

            {/* Export dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                style={{ padding: '10px 16px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: '#00c89615', border: '1px solid #00c89640', color: '#00c896', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={15} /> Export <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    style={{ position: 'absolute', top: 48, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', zIndex: 50, minWidth: 180, boxShadow: '0 16px 48px #00000070' }}>
                    {[
                      { type: 'excel', icon: FileSpreadsheet, label: 'Export to Excel', color: '#00c896' },
                      { type: 'pdf', icon: FileText, label: 'Export to PDF', color: '#ff4757' },
                      { type: 'word', icon: File, label: 'Export to Word', color: '#2979ff' },
                    ].map(opt => (
                      <button key={opt.type} onClick={() => handleExport(opt.type)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all 0.15s', borderBottom: opt.type !== 'word' ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = opt.color; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        <opt.icon size={16} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', border: activeTab === tab.id ? '1px solid var(--border-bright)' : '1px solid transparent', color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <tab.icon size={14} />
            {tab.label}
            {tab.count !== undefined && (
              <span style={{ fontSize: 11, background: activeTab === tab.id ? '#2979ff20' : 'transparent', color: activeTab === tab.id ? '#2979ff' : 'var(--text-muted)', borderRadius: 6, padding: '1px 6px' }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* LEARNERS TAB */}
      {activeTab === 'learners' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {learners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#2979ff15', border: '1px solid #2979ff30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={28} color="#2979ff" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No learners enrolled</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Add learners to start tracking grades</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span>Name</span><span>Student No.</span><span>Grade</span><span>Avg</span><span>Status</span><span>Action</span>
              </div>
              {learners.map((learner) => {
                const lg = grades.filter(g => g.learner_id === learner.id);
                const avg = lg.length > 0 ? (lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length) : null;
                const statusColor = avg ? (avg >= 80 ? '#00c896' : avg >= 65 ? '#2979ff' : avg >= 50 ? '#ffaa00' : '#ff4757') : '#7a9abf';
                const statusLabel = avg ? (avg >= 80 ? 'Excellent' : avg >= 65 ? 'Good' : avg >= 50 ? 'Average' : 'Failing') : 'No grades';
                return (
                  <div key={learner.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr auto', padding: '14px 20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2979ff20', border: '1px solid #2979ff30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2979ff', flexShrink: 0 }}>
                        {learner.full_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{learner.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{learner.gender || 'Not specified'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{learner.student_number}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{learner.grade_level}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>{avg ? avg.toFixed(1) + '%' : '—'}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40`, fontWeight: 600, width: 'fit-content' }}>{statusLabel}</span>
                    <button onClick={() => openLearnerAnalytics(learner)}
                      style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#2979ff20', border: '1px solid #2979ff40', color: '#2979ff', cursor: 'pointer' }}>
                      Analytics
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* GRADES TAB */}
      {activeTab === 'grades' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary bar */}
          {grades.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Records', value: grades.length, color: '#2979ff' },
                { label: 'Class Average', value: (grades.reduce((s, g) => s + parseFloat(g.percentage), 0) / grades.length).toFixed(1) + '%', color: '#00c896' },
                { label: 'Highest Score', value: Math.max(...grades.map(g => parseFloat(g.percentage))).toFixed(1) + '%', color: '#ffaa00' },
                { label: 'Pass Rate', value: ((grades.filter(g => parseFloat(g.percentage) >= 50).length / grades.length) * 100).toFixed(0) + '%', color: '#00c896' },
              ].map(s => (
                <div key={s.label} className="card" style={{ borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
          {grades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#ffaa0015', border: '1px solid #ffaa0030', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Award size={28} color="#ffaa00" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No grades recorded</h3>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span>Learner</span><span>Assessment</span><span>Type</span><span>Term</span><span>Score</span><span></span>
              </div>
              {grades.map(grade => {
                const pct = parseFloat(grade.percentage);
                const c = pct >= 80 ? '#00c896' : pct >= 65 ? '#2979ff' : pct >= 50 ? '#ffaa00' : pct >= 40 ? '#ff6b35' : '#ff4757';
                return (
                  <div key={grade.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', padding: '13px 20px', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{grade.learner_name}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{grade.assessment_name}</span>
                    <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', width: 'fit-content', textTransform: 'capitalize' }}>{grade.assessment_type}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{grade.term}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{pct.toFixed(1)}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{grade.marks_obtained}/{grade.total_marks}</div>
                    </div>
                    <button onClick={() => deleteGrade(grade.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ff4757'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!selectedLearner ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>Select a learner to view detailed analytics</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {learners.map(learner => {
                  const lg = grades.filter(g => g.learner_id === learner.id);
                  const avg = lg.length > 0 ? (lg.reduce((s, g) => s + parseFloat(g.percentage), 0) / lg.length) : null;
                  const color = avg ? (avg >= 80 ? '#00c896' : avg >= 65 ? '#2979ff' : avg >= 50 ? '#ffaa00' : '#ff4757') : '#7a9abf';
                  return (
                    <div key={learner.id} className="card" onClick={() => openLearnerAnalytics(learner)} style={{ borderRadius: 14, padding: 20, cursor: 'pointer' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color, marginBottom: 12 }}>
                        {learner.full_name.charAt(0)}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{learner.full_name}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color }}>{avg ? `${avg.toFixed(1)}%` : 'No grades'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lg.length} assessments</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => { setSelectedLearner(null); setAnalytics(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 0 }}>
                  <ArrowLeft size={15} /> All Learners
                </button>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedLearner.full_name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedLearner.student_number}</span>
              </div>

              {analytics && (
                <div style={{ display: 'grid', gap: 16 }}>
                  {analytics.analytics && (
                    <div style={{ background: 'var(--bg-card)', border: `1px solid ${statusConfig[analytics.analytics.status]?.color}40`, borderRadius: 16, padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 18, background: `${statusConfig[analytics.analytics.status]?.color}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: statusConfig[analytics.analytics.status]?.color }}>{analytics.analytics.average}%</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Overall Performance</div>
                          <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 8, fontWeight: 600 }} className={`status-${analytics.analytics.status}`}>
                            {statusConfig[analytics.analytics.status]?.label}
                          </span>
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#2979ff', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>🎯 Teacher Feedback</div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7 }}>{analytics.feedback}</p>
                      </div>
                    </div>
                  )}

                  {gradeChartData.length > 0 && (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Assessment Performance Chart</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={gradeChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" />
                          <XAxis dataKey="name" tick={{ fill: '#7a9abf', fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#7a9abf', fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid #1a2d45', borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="percentage" fill="#2979ff" radius={[6, 6, 0, 0]} name="Score %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Grade Breakdown</h3>
                    {learnerGrades.map(g => {
                      const pct = parseFloat(g.percentage);
                      const c = pct >= 80 ? '#00c896' : pct >= 65 ? '#2979ff' : pct >= 50 ? '#ffaa00' : '#ff4757';
                      return (
                        <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{g.assessment_name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({g.term})</span></div>
                          <div style={{ width: 140, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 3, transition: 'width 1s ease' }} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: c, minWidth: 48, textAlign: 'right' }}>{pct.toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* CA & FINALS TAB */}
      {activeTab === 'ca' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {caResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#ffaa0015', border: '1px solid #ffaa0030', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Calculator size={28} color="#ffaa00" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>No CA calculated yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Click "Calculate CA" to compute continuous assessment and final marks</p>
              <button onClick={() => setShowCAModal(true)}
                style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: '#ffaa0020', border: '1px solid #ffaa0040', color: '#ffaa00', cursor: 'pointer' }}>
                Set Up CA Formula
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Total Learners', value: caResults.length, color: '#2979ff' },
                  { label: 'Pass Count', value: caResults.filter(c => c.status === 'pass').length, color: '#00c896' },
                  { label: 'Fail Count', value: caResults.filter(c => c.status === 'fail').length, color: '#ff4757' },
                  { label: 'Class Average', value: (caResults.reduce((s, c) => s + parseFloat(c.final_mark), 0) / caResults.length).toFixed(1) + '%', color: '#ffaa00' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <span>Learner</span>
                  {caResults[0] && Object.keys(caResults[0].componentScores).map(k => <span key={k}>{k}</span>)}
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: `2fr ${caFormula.components.map(() => '1fr').join(' ')} 1fr 1fr 1fr`, padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <span>Learner</span>
                    {caFormula.components.map(c => <span key={c.name}>{c.name} ({c.weight}%)</span>)}
                    <span>CA %</span>
                    <span>Final Mark</span>
                    <span>Status</span>
                  </div>
                  {caResults.map((result) => (
                    <div key={result.learner_id} className="table-row"
                      style={{ display: 'grid', gridTemplateColumns: `2fr ${caFormula.components.map(() => '1fr').join(' ')} 1fr 1fr 1fr`, padding: '14px 20px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{result.learner_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{result.student_number}</div>
                      </div>
                      {caFormula.components.map(c => (
                        <span key={c.name} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {result.componentScores[c.name]?.toFixed(1) || '0.0'}%
                        </span>
                      ))}
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#ffaa00' }}>{result.ca_percentage}%</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: parseFloat(result.final_mark) >= 50 ? '#00c896' : '#ff4757' }}>{result.final_mark}%</span>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: result.status === 'pass' ? '#00c89620' : '#ff475720', color: result.status === 'pass' ? '#00c896' : '#ff4757', border: `1px solid ${result.status === 'pass' ? '#00c89640' : '#ff475740'}`, width: 'fit-content' }}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCAModal(true)}
                  style={{ padding: '10px 18px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: '#ffaa0015', border: '1px solid #ffaa0040', color: '#ffaa00', cursor: 'pointer' }}>
                  Recalculate
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CA FORMULA MODAL */}
      <AnimatePresence>
        {showCAModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowCAModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>CA Formula Setup</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure how CA and final marks are calculated</p>
                </div>
                <button onClick={() => setShowCAModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CA Components (must total 100%)
                </div>
                {caFormula.components.map((comp, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <input value={comp.name} onChange={e => {
                      const c = [...caFormula.components]; c[i].name = e.target.value;
                      setCAFormula({ ...caFormula, components: c });
                    }} className="input-field" placeholder="Component name" style={{ padding: '10px 12px', borderRadius: 9, fontSize: 13 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="number" min="0" max="100" value={comp.weight} onChange={e => {
                        const c = [...caFormula.components]; c[i].weight = parseInt(e.target.value) || 0;
                        setCAFormula({ ...caFormula, components: c });
                      }} className="input-field" style={{ width: 70, padding: '10px 12px', borderRadius: 9, fontSize: 13, textAlign: 'center' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>%</span>
                    </div>
                    <button onClick={() => {
                      const c = caFormula.components.filter((_, j) => j !== i);
                      setCAFormula({ ...caFormula, components: c });
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4757', padding: 6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <button onClick={() => setCAFormula({ ...caFormula, components: [...caFormula.components, { name: '', weight: 0 }] })}
                    style={{ fontSize: 13, color: '#2979ff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    + Add Component
                  </button>
                  <div style={{ fontSize: 13, fontWeight: 700, color: caFormula.components.reduce((s, c) => s + c.weight, 0) === 100 ? '#00c896' : '#ff4757' }}>
                    Total: {caFormula.components.reduce((s, c) => s + c.weight, 0)}%
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Final Mark Formula
                </label>
                <input value={caFormula.finalMarkFormula} onChange={e => setCAFormula({ ...caFormula, finalMarkFormula: e.target.value })}
                  className="input-field" placeholder="e.g. ca * 0.4 + exam * 0.6"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13, fontFamily: 'monospace' }} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Use <code style={{ color: '#ffaa00' }}>ca</code> for CA score and <code style={{ color: '#ffaa00' }}>exam</code> for exam score
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowCAModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={calculateCA} className="btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
                  Calculate CA & Finals
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD LEARNER MODAL */}
      <AnimatePresence>
        {showAddLearner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowAddLearner(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>Add Learner</h2>
                <button onClick={() => setShowAddLearner(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={addLearner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'full_name', label: 'Full Name *', placeholder: 'Learner full name' },
                  { key: 'student_number', label: 'Student Number *', placeholder: 'e.g. STU2024001' },
                  { key: 'grade_level', label: 'Grade Level *', placeholder: 'e.g. Grade 10' },
                  { key: 'parent_contact', label: 'Parent Contact', placeholder: '+264 81 000 0000' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>{f.label}</label>
                    <input required={f.label.includes('*')} className="input-field" placeholder={f.placeholder}
                      value={learnerForm[f.key]} onChange={e => setLearnerForm({ ...learnerForm, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Gender</label>
                  <select className="input-field" value={learnerForm.gender} onChange={e => setLearnerForm({ ...learnerForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setShowAddLearner(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary"
                    style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Add Learner'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD GRADE MODAL */}
      <AnimatePresence>
        {showAddGrade && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}
            onClick={() => setShowAddGrade(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>Record Grade</h2>
                <button onClick={() => setShowAddGrade(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <form onSubmit={addGrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Learner *</label>
                  <select required className="input-field" value={gradeForm.learner_id} onChange={e => setGradeForm({ ...gradeForm, learner_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }}>
                    <option value="">Select learner</option>
                    {learners.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Type *</label>
                    <select required className="input-field" value={gradeForm.assessment_type} onChange={e => setGradeForm({ ...gradeForm, assessment_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }}>
                      {['test', 'assignment', 'exam', 'project', 'CA'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Term *</label>
                    <select required className="input-field" value={gradeForm.term} onChange={e => setGradeForm({ ...gradeForm, term: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }}>
                      {['Term 1', 'Term 2', 'Term 3', 'Term 4'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Assessment Name *</label>
                  <input required className="input-field" placeholder="e.g. June Test, Assignment 1"
                    value={gradeForm.assessment_name} onChange={e => setGradeForm({ ...gradeForm, assessment_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Marks Obtained *</label>
                    <input required type="number" min="0" className="input-field" placeholder="e.g. 78"
                      value={gradeForm.marks_obtained} onChange={e => setGradeForm({ ...gradeForm, marks_obtained: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Total Marks *</label>
                    <input required type="number" min="1" className="input-field" placeholder="e.g. 100"
                      value={gradeForm.total_marks} onChange={e => setGradeForm({ ...gradeForm, total_marks: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: 13 }} />
                  </div>
                </div>
                {gradeForm.marks_obtained && gradeForm.total_marks && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)', fontSize: 13 }}>
                    Score: <strong style={{ color: parseFloat(gradeForm.marks_obtained) / parseFloat(gradeForm.total_marks) >= 0.5 ? '#00c896' : '#ff4757' }}>
                      {((parseFloat(gradeForm.marks_obtained) / parseFloat(gradeForm.total_marks)) * 100).toFixed(1)}%
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button type="button" onClick={() => setShowAddGrade(false)}
                    style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary"
                    style={{ flex: 1, padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Record Grade'}
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