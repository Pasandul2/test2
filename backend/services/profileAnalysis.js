const db = require('../config/database');

class ProfileAnalysisService {
  
  /**
   * Analyze student profile based on skills, socioeconomic factors, and preferences
   * @param {Object} studentData - Student profile data
   * @returns {Object} Analysis results
   */
  async analyzeStudentProfile(studentData) {
    try {
      const {
        userId,
        skills,
        education,
        experience,
        preferences,
        socioeconomic,
        location
      } = studentData;

      // Calculate skill scores
      const skillAnalysis = await this.calculateSkillScores(skills);
      
      // Analyze socioeconomic factors
      const socioeconomicAnalysis = this.analyzeSocioeconomicFactors(socioeconomic);
      
      // Calculate education weight
      const educationScore = this.calculateEducationScore(education);
      
      // Calculate experience weight
      const experienceScore = this.calculateExperienceScore(experience);

      const profileScore = {
        technical_skills: skillAnalysis.technical,
        soft_skills: skillAnalysis.soft,
        education_level: educationScore,
        experience_level: experienceScore,
        socioeconomic_score: socioeconomicAnalysis.score,
        location_flexibility: location?.flexibility || 'local'
      };

      // Store analysis results
      await this.storeProfileAnalysis(userId, profileScore, socioeconomicAnalysis);

      return {
        success: true,
        profileScore,
        analysis: {
          strengths: skillAnalysis.strengths,
          improvements: skillAnalysis.improvements,
          recommendations: socioeconomicAnalysis.recommendations
        }
      };

    } catch (error) {
      console.error('Profile analysis error:', error);
      throw new Error('Failed to analyze student profile');
    }
  }

  /**
   * Calculate skill scores based on student assessments
   */
  async calculateSkillScores(skills) {
    const technicalSkills = skills.filter(s => s.category === 'technical');
    const softSkills = skills.filter(s => s.category === 'soft');

    const technicalScore = technicalSkills.reduce((sum, skill) => sum + skill.level, 0) / technicalSkills.length || 0;
    const softSkillScore = softSkills.reduce((sum, skill) => sum + skill.level, 0) / softSkills.length || 0;

    // Identify strengths and improvement areas
    const strengths = skills.filter(s => s.level >= 4).map(s => s.name);
    const improvements = skills.filter(s => s.level <= 2).map(s => s.name);

    return {
      technical: Math.round(technicalScore * 20), // Convert to 100 scale
      soft: Math.round(softSkillScore * 20),
      strengths,
      improvements
    };
  }

  /**
   * Analyze socioeconomic factors for bias-free recommendations
   */
  analyzeSocioeconomicFactors(socioeconomic) {
    const factors = {
      income_level: socioeconomic?.income_level || 'not_specified',
      family_support: socioeconomic?.family_support || 'moderate',
      transportation: socioeconomic?.transportation || 'public',
      financial_constraints: socioeconomic?.financial_constraints || false
    };

    // Calculate support score (higher means more support available)
    let supportScore = 50; // Base score

    if (factors.income_level === 'high') supportScore += 20;
    else if (factors.income_level === 'low') supportScore -= 10;

    if (factors.family_support === 'high') supportScore += 15;
    else if (factors.family_support === 'low') supportScore -= 15;

    if (factors.transportation === 'personal') supportScore += 10;
    else if (factors.transportation === 'limited') supportScore -= 10;

    if (factors.financial_constraints) supportScore -= 20;

    // Generate recommendations based on constraints
    const recommendations = this.generateSocioeconomicRecommendations(factors, supportScore);

    return {
      score: Math.max(0, Math.min(100, supportScore)),
      factors,
      recommendations
    };
  }

  /**
   * Generate recommendations based on socioeconomic analysis
   */
  generateSocioeconomicRecommendations(factors, supportScore) {
    const recommendations = [];

    if (factors.financial_constraints) {
      recommendations.push({
        type: 'financial_support',
        message: 'Consider exploring scholarship opportunities and paid internships',
        priority: 'high'
      });
    }

    if (factors.transportation === 'limited') {
      recommendations.push({
        type: 'remote_opportunities',
        message: 'Focus on remote work opportunities and online skill development',
        priority: 'medium'
      });
    }

    if (supportScore < 40) {
      recommendations.push({
        type: 'mentorship',
        message: 'Connect with mentorship programs for additional guidance and support',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Calculate education score
   */
  calculateEducationScore(education) {
    const levelMapping = {
      'high_school': 20,
      'associate': 40,
      'bachelor': 60,
      'master': 80,
      'phd': 100
    };

    let score = levelMapping[education?.level] || 20;
    
    // Adjust for GPA if available
    if (education?.gpa) {
      const gpaBonus = (education.gpa - 2.0) * 10; // Scale from 2.0-4.0 to 0-20
      score += Math.max(0, Math.min(20, gpaBonus));
    }

    return Math.min(100, score);
  }

  /**
   * Calculate experience score
   */
  calculateExperienceScore(experience) {
    if (!experience || !experience.length) return 0;

    let totalScore = 0;
    experience.forEach(exp => {
      let expScore = 0;
      
      // Years of experience
      expScore += Math.min(30, exp.years * 10);
      
      // Relevance to field
      if (exp.relevant) expScore += 20;
      
      // Leadership or advanced roles
      if (exp.leadership) expScore += 15;
      
      totalScore += expScore;
    });

    return Math.min(100, totalScore / experience.length);
  }

  /**
   * Store profile analysis results
   */
  async storeProfileAnalysis(userId, profileScore, socioeconomicAnalysis) {
    const query = `
      INSERT INTO student_profile_analysis (
        user_id, technical_skills_score, soft_skills_score, 
        education_score, experience_score, socioeconomic_score,
        location_flexibility, analysis_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        technical_skills_score = VALUES(technical_skills_score),
        soft_skills_score = VALUES(soft_skills_score),
        education_score = VALUES(education_score),
        experience_score = VALUES(experience_score),
        socioeconomic_score = VALUES(socioeconomic_score),
        location_flexibility = VALUES(location_flexibility),
        analysis_data = VALUES(analysis_data),
        updated_at = NOW()
    `;

    const analysisData = JSON.stringify({
      socioeconomic_factors: socioeconomicAnalysis.factors,
      recommendations: socioeconomicAnalysis.recommendations
    });

    await db.execute(query, [
      userId,
      profileScore.technical_skills,
      profileScore.soft_skills,
      profileScore.education_level,
      profileScore.experience_level,
      profileScore.socioeconomic_score,
      profileScore.location_flexibility,
      analysisData
    ]);
  }

  /**
   * Get stored profile analysis
   */
  async getProfileAnalysis(userId) {
    const query = `
      SELECT * FROM student_profile_analysis 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [userId]);
    
    if (rows.length === 0) {
      return null;
    }

    const analysis = rows[0];
    analysis.analysis_data = JSON.parse(analysis.analysis_data || '{}');
    
    return analysis;
  }
}

module.exports = new ProfileAnalysisService();
