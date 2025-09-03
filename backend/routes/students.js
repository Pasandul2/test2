const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private (Student)
router.get('/profile', auth, async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT s.*, u.email, u.created_at as user_created_at
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [req.user.userId]);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get student skills
    const [skills] = await pool.execute(`
      SELECT sk.name, sk.category, ss.proficiency_level, ss.years_of_experience
      FROM student_skills ss
      JOIN skills sk ON ss.skill_id = sk.id
      WHERE ss.student_id = ?
    `, [students[0].id]);

    res.json({
      success: true,
      data: {
        ...students[0],
        skills
      }
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/students/profile
// @desc    Update student profile
// @access  Private (Student)
router.put('/profile', auth, [
  body('fullName').trim().isLength({ min: 2 }).optional(),
  body('university').trim().optional(),
  body('fieldOfStudy').trim().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const updateFields = {};
    const allowedFields = [
      'full_name', 'university', 'study_level', 'field_of_study',
      'annual_budget', 'preferred_location', 'family_obligations',
      'transportation_limitations', 'preferred_work_schedule',
      'bio', 'linkedin_url', 'github_url', 'portfolio_url'
    ];

    // Map request body to database fields
    const fieldMapping = {
      fullName: 'full_name',
      studyLevel: 'study_level',
      fieldOfStudy: 'field_of_study',
      annualBudget: 'annual_budget',
      preferredLocation: 'preferred_location',
      familyObligations: 'family_obligations',
      transportationLimitations: 'transportation_limitations',
      preferredWorkSchedule: 'preferred_work_schedule',
      linkedinUrl: 'linkedin_url',
      githubUrl: 'github_url',
      portfolioUrl: 'portfolio_url'
    };

    Object.keys(req.body).forEach(key => {
      const dbField = fieldMapping[key] || key;
      if (allowedFields.includes(dbField)) {
        updateFields[dbField] = req.body[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const setClause = Object.keys(updateFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updateFields);
    values.push(req.user.userId);

    await pool.execute(
      `UPDATE students SET ${setClause} WHERE user_id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/students/skills
// @desc    Add skill to student profile
// @access  Private (Student)
router.post('/skills', auth, [
  body('skillId').isInt().toInt(),
  body('proficiencyLevel').isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('yearsOfExperience').isFloat({ min: 0 }).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { skillId, proficiencyLevel, yearsOfExperience = 0 } = req.body;

    // Get student ID
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].id;

    // Add or update skill
    await pool.execute(`
      INSERT INTO student_skills (student_id, skill_id, proficiency_level, years_of_experience)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      proficiency_level = VALUES(proficiency_level),
      years_of_experience = VALUES(years_of_experience)
    `, [studentId, skillId, proficiencyLevel, yearsOfExperience]);

    res.json({
      success: true,
      message: 'Skill added successfully'
    });

  } catch (error) {
    console.error('Add student skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/students/skills/:skillId
// @desc    Remove skill from student profile
// @access  Private (Student)
router.delete('/skills/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;

    // Get student ID
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].id;

    await pool.execute(
      'DELETE FROM student_skills WHERE student_id = ? AND skill_id = ?',
      [studentId, skillId]
    );

    res.json({
      success: true,
      message: 'Skill removed successfully'
    });

  } catch (error) {
    console.error('Remove student skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/students/pathways
// @desc    Get student career pathways
// @access  Private (Student)
router.get('/pathways', auth, async (req, res) => {
  try {
    // Get student ID
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].id;

    // Get pathways with steps
    const [pathways] = await pool.execute(`
      SELECT cp.*, 
        (SELECT COUNT(*) FROM pathway_steps ps WHERE ps.pathway_id = cp.id AND ps.is_completed = true) as completed_steps
      FROM career_pathways cp
      WHERE cp.student_id = ?
      ORDER BY cp.created_at DESC
    `, [studentId]);

    // Get steps for each pathway
    for (let pathway of pathways) {
      const [steps] = await pool.execute(
        'SELECT * FROM pathway_steps WHERE pathway_id = ? ORDER BY step_number',
        [pathway.id]
      );
      pathway.steps = steps;
    }

    res.json({
      success: true,
      data: pathways
    });

  } catch (error) {
    console.error('Get student pathways error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/students/matches
// @desc    Get job matches for student
// @access  Private (Student)
router.get('/matches', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Get student ID
    const [students] = await pool.execute(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.userId]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentId = students[0].id;

    let query = `
      SELECT m.*, jp.title, jp.description, jp.location, jp.employment_type,
        jp.salary_min, jp.salary_max, e.company_name
      FROM matches m
      JOIN job_postings jp ON m.job_id = jp.id
      JOIN employers e ON jp.employer_id = e.id
      WHERE m.student_id = ?
    `;
    const queryParams = [studentId];

    if (status) {
      query += ' AND m.status = ?';
      queryParams.push(status);
    }

    query += ' ORDER BY m.match_score DESC LIMIT ? OFFSET ?';
    queryParams.push(parseInt(limit), parseInt(offset));

    const [matches] = await pool.execute(query, queryParams);

    // Mark matches as viewed
    await pool.execute(
      'UPDATE matches SET viewed_by_student = true WHERE student_id = ? AND viewed_by_student = false',
      [studentId]
    );

    res.json({
      success: true,
      data: matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: matches.length
      }
    });

  } catch (error) {
    console.error('Get student matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
