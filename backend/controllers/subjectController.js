const { pool } = require('../config/db');

const getSubjects = async (req, res) => {
  try {
    const [subjects] = await pool.query(
      'SELECT * FROM subjects WHERE teacher_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, grade_level, code } = req.body;
    if (!name || !grade_level) return res.status(400).json({ message: 'Name and grade level required.' });

    const [result] = await pool.query(
      'INSERT INTO subjects (teacher_id, name, grade_level, code) VALUES (?, ?, ?, ?)',
      [req.user.id, name, grade_level, code || null]
    );

    const [subject] = await pool.query('SELECT * FROM subjects WHERE id = ?', [result.insertId]);
    res.status(201).json({ message: 'Subject created.', subject: subject[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM subjects WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
    res.json({ message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getSubjects, createSubject, deleteSubject };