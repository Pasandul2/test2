const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// @route   GET /api/skills
// @desc    Get all skills
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = 'SELECT * FROM skills WHERE 1=1';
    const queryParams = [];

    if (category) {
      query += ' AND category = ?';
      queryParams.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY name';

    const [skills] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/skills/categories
// @desc    Get skill categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT category, COUNT(*) as count
      FROM skills
      GROUP BY category
      ORDER BY category
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get skill categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
