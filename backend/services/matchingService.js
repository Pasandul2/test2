const db = require('../config/database');

class MatchingService {

  /**
   * Bidirectional matching between employers and students
   * @param {number} employerId - Employer ID
   * @param {number} jobId - Job posting ID (optional)
   * @returns {Object} Matching results
   */
  async performBidirectionalMatching(employerId, jobId = null) {
    try {
      // Get employer requirements
      const employerData = await this.getEmployerRequirements(employerId, jobId);
      
      // Get student pool
      const studentPool = await this.getAvailableStudents();
      
      // Perform matching algorithm
      const matches = await this.calculateCompatibilityScores(employerData, studentPool);
      
      // Store matching results
      await this.storeMatchingResults(employerId, jobId, matches);
      
      return {
        success: true,
        employer: employerData,
        total_candidates: studentPool.length,
        matches: matches.slice(0, 20), // Top 20 matches
        matching_stats: this.calculateMatchingStats(matches)
      };

    } catch (error) {
      console.error('Bidirectional matching error:', error);
      throw new Error('Failed to perform matching');
    }
  }

  /**
   * Get employer requirements and company data
   */
  async getEmployerRequirements(employerId, jobId) {
    let employerQuery = `
      SELECT e.*, u.company_name, u.location, u.company_size,
             e.industry, e.company_description, e.growth_trajectory
      FROM employers e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    
    const [employerRows] = await db.execute(employerQuery, [employerId]);
    
    if (employerRows.length === 0) {
      throw new Error('Employer not found');
    }

    const employer = employerRows[0];

    // Get job requirements if jobId provided
    let jobRequirements = null;
    if (jobId) {
      const jobQuery = `
        SELECT * FROM job_postings 
        WHERE id = ? AND employer_id = ?
      `;
      const [jobRows] = await db.execute(jobQuery, [jobId, employerId]);
      
      if (jobRows.length > 0) {
        jobRequirements = jobRows[0];
        
        // Get required skills for the job
        const skillsQuery = `
          SELECT s.name, s.category, js.required_level
          FROM job_skills js
          JOIN skills s ON js.skill_id = s.id
          WHERE js.job_id = ?
        `;
        const [skillRows] = await db.execute(skillsQuery, [jobId]);
        jobRequirements.required_skills = skillRows;
      }
    }

    return {
      ...employer,
      job_requirements: jobRequirements
    };
  }

  /**
   * Get available students for matching
   */
  async getAvailableStudents() {
    const query = `
      SELECT DISTINCT
        s.user_id,
        u.first_name,
        u.last_name,
        u.email,
        s.field_of_study,
        s.graduation_year,
        s.availability_status,
        s.location_preference,
        s.employment_type_preference,
        spa.technical_skills_score,
        spa.soft_skills_score,
        spa.education_score,
        spa.experience_score,
        spa.socioeconomic_score,
        spa.location_flexibility
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN student_profile_analysis spa ON s.user_id = spa.user_id
      WHERE s.availability_status IN ('available', 'actively_looking')
        AND u.is_active = 1
      ORDER BY s.user_id
    `;

    const [students] = await db.execute(query);

    // Get skills for each student
    for (let student of students) {
      const skillsQuery = `
        SELECT s.name, s.category, ss.proficiency_level
        FROM student_skills ss
        JOIN skills s ON ss.skill_id = s.id
        WHERE ss.student_id = ?
      `;
      const [skills] = await db.execute(skillsQuery, [student.user_id]);
      student.skills = skills;
    }

    return students;
  }

  /**
   * Calculate compatibility scores between employer requirements and students
   */
  async calculateCompatibilityScores(employerData, studentPool) {
    const matches = [];

    for (let student of studentPool) {
      const compatibility = await this.calculateStudentEmployerCompatibility(
        student, 
        employerData
      );

      if (compatibility.total_score >= 30) { // Minimum threshold
        matches.push({
          student_id: student.user_id,
          student_name: `${student.first_name} ${student.last_name}`,
          compatibility_score: compatibility.total_score,
          score_breakdown: compatibility.breakdown,
          match_reasons: compatibility.reasons,
          potential_concerns: compatibility.concerns,
          student_profile: {
            field_of_study: student.field_of_study,
            graduation_year: student.graduation_year,
            location_preference: student.location_preference,
            employment_type: student.employment_type_preference
          }
        });
      }
    }

    // Sort by compatibility score
    return matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
  }

  /**
   * Calculate detailed compatibility between student and employer
   */
  async calculateStudentEmployerCompatibility(student, employerData) {
    let totalScore = 0;
    const breakdown = {};
    const reasons = [];
    const concerns = [];

    // 1. Skills Matching (40% weight)
    const skillsScore = this.calculateSkillsCompatibility(
      student.skills, 
      employerData.job_requirements?.required_skills || []
    );
    breakdown.skills = skillsScore;
    totalScore += skillsScore * 0.4;

    if (skillsScore >= 70) {
      reasons.push('Strong skills alignment with job requirements');
    } else if (skillsScore < 40) {
      concerns.push('Skills gap may require additional training');
    }

    // 2. Education Level (20% weight)
    const educationScore = student.education_score || 50;
    breakdown.education = educationScore;
    totalScore += educationScore * 0.2;

    // 3. Experience Level (15% weight)
    const experienceScore = student.experience_score || 20;
    breakdown.experience = experienceScore;
    totalScore += experienceScore * 0.15;

    if (experienceScore >= 60) {
      reasons.push('Relevant work experience');
    }

    // 4. Location Compatibility (10% weight)
    const locationScore = this.calculateLocationCompatibility(
      student.location_preference,
      student.location_flexibility,
      employerData.location
    );
    breakdown.location = locationScore;
    totalScore += locationScore * 0.1;

    // 5. Availability and Employment Type (10% weight)
    const availabilityScore = this.calculateAvailabilityCompatibility(
      student.employment_type_preference,
      employerData.job_requirements?.employment_type || 'full_time'
    );
    breakdown.availability = availabilityScore;
    totalScore += availabilityScore * 0.1;

    // 6. Cultural Fit (5% weight)
    const culturalScore = this.calculateCulturalFit(student, employerData);
    breakdown.cultural_fit = culturalScore;
    totalScore += culturalScore * 0.05;

    return {
      total_score: Math.round(totalScore),
      breakdown,
      reasons,
      concerns
    };
  }

  /**
   * Calculate skills compatibility
   */
  calculateSkillsCompatibility(studentSkills, requiredSkills) {
    if (!requiredSkills.length) return 75; // Default score if no specific requirements

    let matchedSkills = 0;
    let totalRequiredSkills = requiredSkills.length;
    let skillScore = 0;

    requiredSkills.forEach(required => {
      const studentSkill = studentSkills.find(s => 
        s.name.toLowerCase() === required.name.toLowerCase()
      );

      if (studentSkill) {
        matchedSkills++;
        // Compare proficiency levels
        const proficiencyScore = Math.min(100, (studentSkill.proficiency_level / required.required_level) * 100);
        skillScore += proficiencyScore;
      }
    });

    const matchPercentage = (matchedSkills / totalRequiredSkills) * 100;
    const avgProficiency = totalRequiredSkills > 0 ? skillScore / totalRequiredSkills : 0;

    return Math.round((matchPercentage * 0.6) + (avgProficiency * 0.4));
  }

  /**
   * Calculate location compatibility
   */
  calculateLocationCompatibility(studentLocation, flexibility, employerLocation) {
    if (flexibility === 'remote') return 100;
    if (flexibility === 'flexible') return 80;
    
    // Simple location matching (can be enhanced with geo-location)
    if (studentLocation?.toLowerCase().includes(employerLocation?.toLowerCase())) {
      return 90;
    }
    
    return 40; // Different locations, local preference
  }

  /**
   * Calculate availability compatibility
   */
  calculateAvailabilityCompatibility(studentPreference, jobType) {
    const compatibilityMatrix = {
      'full_time': { 'full_time': 100, 'part_time': 30, 'contract': 50, 'internship': 70 },
      'part_time': { 'full_time': 60, 'part_time': 100, 'contract': 80, 'internship': 90 },
      'contract': { 'full_time': 40, 'part_time': 70, 'contract': 100, 'internship': 60 },
      'internship': { 'full_time': 80, 'part_time': 60, 'contract': 40, 'internship': 100 }
    };

    return compatibilityMatrix[studentPreference]?.[jobType] || 50;
  }

  /**
   * Calculate cultural fit score
   */
  calculateCulturalFit(student, employerData) {
    // Basic cultural fit calculation
    // Can be enhanced with more sophisticated matching
    
    let score = 70; // Base score

    // Company size preference (can be added to student profile)
    if (employerData.company_size === 'startup' && student.graduation_year >= new Date().getFullYear() - 2) {
      score += 10; // Recent grads might fit well with startups
    }

    // Growth trajectory alignment
    if (employerData.growth_trajectory === 'high_growth') {
      score += 5; // High growth companies offer good opportunities
    }

    return Math.min(100, score);
  }

  /**
   * Store matching results
   */
  async storeMatchingResults(employerId, jobId, matches) {
    // Clear previous matches for this employer/job
    const clearQuery = jobId 
      ? 'DELETE FROM employer_student_matches WHERE employer_id = ? AND job_id = ?'
      : 'DELETE FROM employer_student_matches WHERE employer_id = ? AND job_id IS NULL';
    
    const clearParams = jobId ? [employerId, jobId] : [employerId];
    await db.execute(clearQuery, clearParams);

    // Insert new matches
    for (let match of matches.slice(0, 50)) { // Store top 50 matches
      const insertQuery = `
        INSERT INTO employer_student_matches (
          employer_id, job_id, student_id, compatibility_score,
          score_breakdown, match_reasons, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      await db.execute(insertQuery, [
        employerId,
        jobId,
        match.student_id,
        match.compatibility_score,
        JSON.stringify(match.score_breakdown),
        JSON.stringify(match.match_reasons)
      ]);
    }
  }

  /**
   * Calculate matching statistics
   */
  calculateMatchingStats(matches) {
    if (matches.length === 0) {
      return {
        average_score: 0,
        high_compatibility: 0,
        medium_compatibility: 0,
        low_compatibility: 0
      };
    }

    const totalScore = matches.reduce((sum, match) => sum + match.compatibility_score, 0);
    const averageScore = totalScore / matches.length;

    const high = matches.filter(m => m.compatibility_score >= 80).length;
    const medium = matches.filter(m => m.compatibility_score >= 60 && m.compatibility_score < 80).length;
    const low = matches.filter(m => m.compatibility_score < 60).length;

    return {
      average_score: Math.round(averageScore),
      high_compatibility: high,
      medium_compatibility: medium,
      low_compatibility: low
    };
  }

  /**
   * Get matches for a specific employer
   */
  async getEmployerMatches(employerId, jobId = null, limit = 20) {
    const query = `
      SELECT 
        esm.*,
        u.first_name,
        u.last_name,
        u.email,
        s.field_of_study,
        s.graduation_year,
        s.location_preference
      FROM employer_student_matches esm
      JOIN students s ON esm.student_id = s.user_id
      JOIN users u ON s.user_id = u.id
      WHERE esm.employer_id = ? 
        ${jobId ? 'AND esm.job_id = ?' : 'AND esm.job_id IS NULL'}
      ORDER BY esm.compatibility_score DESC
      LIMIT ?
    `;

    const params = jobId ? [employerId, jobId, limit] : [employerId, limit];
    const [matches] = await db.execute(query, params);

    return matches.map(match => ({
      ...match,
      score_breakdown: JSON.parse(match.score_breakdown || '{}'),
      match_reasons: JSON.parse(match.match_reasons || '[]')
    }));
  }

  /**
   * Student-initiated search for opportunities
   */
  async findOpportunitiesForStudent(studentId) {
    try {
      // Get student profile
      const student = await this.getStudentProfile(studentId);
      
      // Get available job postings
      const jobPostings = await this.getAvailableJobPostings();
      
      // Calculate compatibility with each job
      const opportunities = [];
      
      for (let job of jobPostings) {
        const compatibility = await this.calculateJobStudentCompatibility(job, student);
        
        if (compatibility.total_score >= 40) {
          opportunities.push({
            job_id: job.id,
            job_title: job.title,
            company_name: job.company_name,
            location: job.location,
            employment_type: job.employment_type,
            compatibility_score: compatibility.total_score,
            score_breakdown: compatibility.breakdown,
            match_reasons: compatibility.reasons,
            application_deadline: job.application_deadline
          });
        }
      }

      return opportunities.sort((a, b) => b.compatibility_score - a.compatibility_score);

    } catch (error) {
      console.error('Student opportunity search error:', error);
      throw new Error('Failed to find opportunities');
    }
  }

  /**
   * Get student profile for matching
   */
  async getStudentProfile(studentId) {
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        spa.technical_skills_score,
        spa.soft_skills_score,
        spa.education_score,
        spa.experience_score
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN student_profile_analysis spa ON s.user_id = spa.user_id
      WHERE s.user_id = ?
    `;

    const [studentRows] = await db.execute(query, [studentId]);
    
    if (studentRows.length === 0) {
      throw new Error('Student not found');
    }

    const student = studentRows[0];

    // Get student skills
    const skillsQuery = `
      SELECT s.name, s.category, ss.proficiency_level
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.student_id = ?
    `;
    const [skills] = await db.execute(skillsQuery, [studentId]);
    student.skills = skills;

    return student;
  }

  /**
   * Get available job postings
   */
  async getAvailableJobPostings() {
    const query = `
      SELECT 
        jp.*,
        u.company_name,
        u.location,
        e.industry
      FROM job_postings jp
      JOIN employers e ON jp.employer_id = e.user_id
      JOIN users u ON e.user_id = u.id
      WHERE jp.status = 'active'
        AND (jp.application_deadline IS NULL OR jp.application_deadline > NOW())
      ORDER BY jp.created_at DESC
    `;

    const [jobs] = await db.execute(query);

    // Get required skills for each job
    for (let job of jobs) {
      const skillsQuery = `
        SELECT s.name, s.category, js.required_level
        FROM job_skills js
        JOIN skills s ON js.skill_id = s.id
        WHERE js.job_id = ?
      `;
      const [skills] = await db.execute(skillsQuery, [job.id]);
      job.required_skills = skills;
    }

    return jobs;
  }

  /**
   * Calculate job-student compatibility (reverse of employer-student)
   */
  async calculateJobStudentCompatibility(job, student) {
    // Reuse the compatibility calculation logic
    const mockEmployerData = {
      location: job.location,
      job_requirements: {
        employment_type: job.employment_type,
        required_skills: job.required_skills
      }
    };

    return await this.calculateStudentEmployerCompatibility(student, mockEmployerData);
  }
}

module.exports = new MatchingService();
