const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
require('dotenv').config();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { full_name, email, password, role, employee_id, phone } = req.body;
    if (!full_name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, role, employee_id, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, role, employee_id || null, phone || null]
    );

    const newUser = { id: result.insertId, email, role, full_name };
    const { accessToken, refreshToken } = generateTokens(newUser);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [result.insertId, refreshToken, expiresAt]);

    res.status(201).json({
      message: 'Account created successfully.',
      accessToken,
      refreshToken,
      user: { id: result.insertId, full_name, email, role, employee_id, phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const { accessToken, refreshToken } = generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]);

    res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, employee_id: user.employee_id, phone: user.phone }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during logout.' });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, full_name, email, role, employee_id, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: users[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, logout, getMe };