const { pool } = require('../config/db');

const getStats = async (req, res) => {
  try {
    const [[{ totalStaff }]] = await pool.query('SELECT COUNT(*) as totalStaff FROM users WHERE is_active = 1');
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher' AND is_active = 1");
    const [[{ totalSubjects }]] = await pool.query('SELECT COUNT(*) as totalSubjects FROM subjects');
    const [[{ totalLearners }]] = await pool.query('SELECT COUNT(*) as totalLearners FROM learners');
    const [[{ totalGrades }]] = await pool.query('SELECT COUNT(*) as totalGrades FROM grades');
    const [[{ avgScore }]] = await pool.query('SELECT AVG(percentage) as avgScore FROM grades');
    const [[{ passCount }]] = await pool.query('SELECT COUNT(*) as passCount FROM grades WHERE percentage >= 50');
    const [[{ failCount }]] = await pool.query('SELECT COUNT(*) as failCount FROM grades WHERE percentage < 50');

    res.json({
      stats: {
        totalStaff, totalTeachers, totalSubjects, totalLearners,
        totalGrades, avgScore: avgScore ? parseFloat(avgScore).toFixed(1) : 0,
        passCount, failCount,
        passRate: totalGrades > 0 ? ((passCount / totalGrades) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const [staff] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.employee_id, u.phone, u.is_active, u.created_at,
       COUNT(DISTINCT s.id) as subject_count
       FROM users u
       LEFT JOIN subjects s ON s.teacher_id = u.id
       GROUP BY u.id ORDER BY u.created_at DESC`
    );
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const toggleStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ message: 'Staff status updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.query(
      `SELECT s.*, u.full_name as teacher_name,
       COUNT(DISTINCT sl.learner_id) as learner_count,
       COUNT(DISTINCT g.id) as grade_count,
       AVG(g.percentage) as avg_score
       FROM subjects s
       JOIN users u ON s.teacher_id = u.id
       LEFT JOIN subject_learners sl ON sl.subject_id = s.id
       LEFT JOIN grades g ON g.subject_id = s.id
       GROUP BY s.id ORDER BY s.created_at DESC`
    );
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getGradesOverview = async (req, res) => {
  try {
    const [byTerm] = await pool.query(
      `SELECT term, AVG(percentage) as avg, COUNT(*) as count FROM grades GROUP BY term ORDER BY term`
    );
    const [bySubject] = await pool.query(
      `SELECT s.name, s.grade_level, AVG(g.percentage) as avg, COUNT(g.id) as count
       FROM grades g JOIN subjects s ON g.subject_id = s.id
       GROUP BY s.id ORDER BY avg DESC LIMIT 10`
    );
    const [distribution] = await pool.query(
      `SELECT
        SUM(CASE WHEN percentage >= 80 THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN percentage >= 65 AND percentage < 80 THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN percentage >= 50 AND percentage < 65 THEN 1 ELSE 0 END) as average,
        SUM(CASE WHEN percentage >= 40 AND percentage < 50 THEN 1 ELSE 0 END) as at_risk,
        SUM(CASE WHEN percentage < 40 THEN 1 ELSE 0 END) as critical
       FROM grades`
    );
    res.json({ byTerm, bySubject, distribution: distribution[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getStats, getAllStaff, toggleStaffStatus, getAllSubjects, getGradesOverview };