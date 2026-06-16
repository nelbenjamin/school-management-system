const { pool } = require('../config/db');

const getNotifications = async (req, res) => {
  try {
    const [notifs] = await pool.query(
      `SELECT n.*, u.full_name as sender_name, u.role as sender_role
       FROM notifications n
       JOIN users u ON n.sender_id = u.id
       WHERE n.target_role = 'all' OR n.target_role = ?
       ORDER BY n.created_at DESC LIMIT 50`,
      [req.user.role]
    );
    const unread = notifs.filter(n => {
      const readBy = typeof n.is_read_by === 'string' ? JSON.parse(n.is_read_by) : (n.is_read_by || []);
      return !readBy.includes(req.user.id);
    }).length;
    res.json({ notifications: notifs, unread });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const sendNotification = async (req, res) => {
  try {
    const { title, message, type, target_role } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message required.' });

    const [result] = await pool.query(
      'INSERT INTO notifications (sender_id, title, message, type, target_role) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, message, type || 'announcement', target_role || 'all']
    );

    const [notif] = await pool.query(
      `SELECT n.*, u.full_name as sender_name FROM notifications n
       JOIN users u ON n.sender_id = u.id WHERE n.id = ?`,
      [result.insertId]
    );

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      if (target_role === 'all') {
        io.emit('new_notification', notif[0]);
      } else {
        io.to(`role_${target_role}`).emit('new_notification', notif[0]);
      }
    }

    res.status(201).json({ message: 'Notification sent.', notification: notif[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT is_read_by FROM notifications WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found.' });

    let readBy = typeof rows[0].is_read_by === 'string' ? JSON.parse(rows[0].is_read_by) : (rows[0].is_read_by || []);
    if (!readBy.includes(req.user.id)) readBy.push(req.user.id);

    await pool.query('UPDATE notifications SET is_read_by = ? WHERE id = ?', [JSON.stringify(readBy), id]);
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getNotifications, sendNotification, markRead, deleteNotification };