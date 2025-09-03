const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple auth middleware for testing
const simpleAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    // For now, just pass through - we'll add JWT verification later
    req.user = { id: 1, userType: 'admin' }; // Mock user for testing
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0 || rows[0].user_type !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard statistics
router.get('/stats', simpleAuth, requireAdmin, async (req, res) => {
  try {
    // Get total users count
    const [totalUsersResult] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0].count;

    // Get active users count
    const [activeUsersResult] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    const activeUsers = activeUsersResult[0].count;

    // Get users by type
    const [studentsResult] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE user_type = "student"');
    const totalStudents = studentsResult[0].count;

    const [employersResult] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE user_type = "employer"');
    const totalEmployers = employersResult[0].count;

    const [adminsResult] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE user_type = "admin"');
    const totalAdmins = adminsResult[0].count;

    // Get new users today
    const today = new Date().toISOString().split('T')[0];
    const [newUsersResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?',
      [today]
    );
    const newUsersToday = newUsersResult[0].count;

    const stats = {
      totalUsers,
      activeUsers,
      totalStudents,
      totalEmployers,
      totalAdmins,
      newUsersToday
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get all users with optional filtering and pagination
router.get('/users', simpleAuth, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      filter = 'all', 
      search = '',
      sort = 'created_at DESC'
    } = req.query;

    let whereClause = '1=1';
    const queryParams = [];

    // Apply filters
    if (filter !== 'all') {
      if (['student', 'employer', 'admin'].includes(filter)) {
        whereClause += ' AND user_type = ?';
        queryParams.push(filter);
      } else if (filter === 'active') {
        whereClause += ' AND is_active = 1';
      } else if (filter === 'inactive') {
        whereClause += ' AND is_active = 0';
      }
    }

    // Apply search
    if (search) {
      whereClause += ' AND (email LIKE ? OR user_type LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
      queryParams
    );
    const totalUsers = countResult[0].total;

    // Get users with pagination
    const offset = (page - 1) * limit;
    const [users] = await pool.execute(
      `SELECT 
        u.id, 
        u.email, 
        u.user_type, 
        u.is_active, 
        u.email_verified, 
        u.created_at,
        sp.full_name,
        ep.company_name
      FROM users u 
      LEFT JOIN student_profiles sp ON u.id = sp.user_id 
      LEFT JOIN employer_profiles ep ON u.id = ep.user_id 
      WHERE ${whereClause} 
      ORDER BY ${sort} 
      LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Format users data
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      is_active: Boolean(user.is_active),
      email_verified: Boolean(user.email_verified),
      created_at: user.created_at,
      profile: {
        full_name: user.full_name,
        company_name: user.company_name,
        name: user.full_name || user.company_name
      }
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Toggle user active status
router.patch('/users/:id/toggle-status', simpleAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { is_active } = req.body;

    // Don't allow deactivating admin users
    const [userCheck] = await pool.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck[0].user_type === 'admin' && !is_active) {
      return res.status(400).json({ message: 'Cannot deactivate admin users' });
    }

    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:id', simpleAuth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow deleting admin users
    const [userCheck] = await pool.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck[0].user_type === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Delete user and related data (cascading deletes should handle profiles)
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
