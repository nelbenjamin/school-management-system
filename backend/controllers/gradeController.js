const { pool } = require('../config/db');

const getGradesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const [grades] = await pool.query(
      `SELECT g.*, l.full_name as learner_name, l.student_number
       FROM grades g
       JOIN learners l ON g.learner_id = l.id
       WHERE g.subject_id = ?
       ORDER BY l.full_name, g.term, g.recorded_at`,
      [subjectId]
    );
    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const addGrade = async (req, res) => {
  try {
    const { learner_id, subject_id, assessment_type, assessment_name, marks_obtained, total_marks, term, year } = req.body;
    if (!learner_id || !subject_id || !assessment_type || !marks_obtained || !total_marks || !term)
      return res.status(400).json({ message: 'All grade fields are required.' });

    const [result] = await pool.query(
      'INSERT INTO grades (learner_id, subject_id, assessment_type, assessment_name, marks_obtained, total_marks, term, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [learner_id, subject_id, assessment_type, assessment_name, marks_obtained, total_marks, term, year || new Date().getFullYear()]
    );

    const [grade] = await pool.query('SELECT * FROM grades WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Grade added.', grade: grade[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM grades WHERE id = ?', [id]);
    res.json({ message: 'Grade deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const getStudentAnalytics = async (req, res) => {
  try {
    const { learnerId, subjectId } = req.params;
    const [grades] = await pool.query(
      'SELECT * FROM grades WHERE learner_id = ? AND subject_id = ? ORDER BY term, recorded_at',
      [learnerId, subjectId]
    );

    if (grades.length === 0) return res.json({ analytics: null, feedback: 'No grades recorded yet.' });

    const avg = grades.reduce((sum, g) => sum + parseFloat(g.percentage), 0) / grades.length;

    let feedback = '';
    let status = '';

    if (avg >= 80) {
      status = 'excellent';
      feedback = `Outstanding performance with an average of ${avg.toFixed(1)}%. This student demonstrates excellent understanding. Encourage participation in advanced work or competitions.`;
    } else if (avg >= 65) {
      status = 'good';
      feedback = `Good performance with an average of ${avg.toFixed(1)}%. The student shows solid understanding. Focus on consistency and pushing for excellence in weaker assessments.`;
    } else if (avg >= 50) {
      status = 'average';
      feedback = `Average performance at ${avg.toFixed(1)}%. The student is passing but needs improvement. Identify specific topics where marks dropped and provide targeted support.`;
    } else if (avg >= 40) {
      status = 'at-risk';
      feedback = `Below average at ${avg.toFixed(1)}%. This student is at risk of failing. Immediate intervention recommended — extra classes, parent contact, and focused revision.`;
    } else {
      status = 'critical';
      feedback = `Critical — average of ${avg.toFixed(1)}%. Urgent intervention needed. Consider remedial support, parent meetings, and a structured improvement plan immediately.`;
    }

    res.json({ analytics: { grades, average: avg.toFixed(1), status }, feedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getGradesBySubject, addGrade, deleteGrade, getStudentAnalytics };