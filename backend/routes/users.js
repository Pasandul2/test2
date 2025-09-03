const express = require('express');
const router = express.Router();

// Placeholder routes for other user types

// @route   GET /api/users/profile
// @desc    Get user profile (generic)
// @access  Private
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint - to be implemented'
  });
});

module.exports = router;
