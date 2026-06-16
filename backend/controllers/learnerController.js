const { pool } = require('../config/db');

const getLearnersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const [learners] = await pool.query(
      `SELECT l.* FROM learners l
       JOIN subject_learners sl ON l.id = sl.learner_id
       WHERE sl.subject_id = ?`,
      [subjectId]
    );
    res.json({ learners });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createLearner = async (req, res) => {
  try {
    const { full_name, student_number, grade_level, date_of_birth, gender, parent_contact, subject_id } = req.body;

    if (!full_name || !student_number || !grade_level) {
      return res.status(400).json({ message: 'Full name, student number and grade level required.' });
    }

    const [existing] = await pool.query('SELECT id FROM learners WHERE student_number = ?', [student_number]);

    let learnerId;
    if (existing.length > 0) {
      learnerId = existing[0].id;
    } else {
      const [result] = await pool.query(
        'INSERT INTO learners (full_name, student_number, grade_level, date_of_birth, gender, parent_contact) VALUES (?, ?, ?, ?, ?, ?)',
        [full_name, student_number, grade_level, date_of_birth || null, gender || null, parent_contact || null]
      );
      learnerId = result.insertId;
    }

    if (subject_id) {
      await pool.query(
        'INSERT IGNORE INTO subject_learners (subject_id, learner_id) VALUES (?, ?)',
        [subject_id, learnerId]
      );
    }

    const [learner] = await pool.query('SELECT * FROM learners WHERE id = ?', [learnerId]);
    res.status(201).json({ message: 'Learner added.', learner: learner[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteLearner = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id } = req.body;
    await pool.query('DELETE FROM subject_learners WHERE learner_id = ? AND subject_id = ?', [id, subject_id]);
    res.json({ message: 'Learner removed from subject.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLearnersBySubject, createLearner, deleteLearner };