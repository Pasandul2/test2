const db = require('../config/database');

class CareerPathwayService {

  /**
   * Generate personalized career pathways for student
   * @param {number} studentId - Student user ID
   * @returns {Object} Generated pathways
   */
  async generateCareerPathways(studentId) {
    try {
      // Get student profile and analysis
      const studentProfile = await this.getStudentCompleteProfile(studentId);
      
      // Get labor market data
      const laborMarketData = await this.getLaborMarketData(studentProfile.field_of_study);
      
      // Generate pathway options
      const pathways = await this.createPathwayOptions(studentProfile, laborMarketData);
      
      // Check for bias and adjust if needed
      const biasCheckResult = this.checkForBias(pathways, studentProfile);
      
      let finalPathways = pathways;
      if (biasCheckResult.biasFound) {
        finalPathways = this.adjustForBias(pathways, biasCheckResult, studentProfile);
      }
      
      // Store generated pathways
      await this.storeCareerPathways(studentId, finalPathways, biasCheckResult);
      
      return {
        success: true,
        student_profile: {
          name: `${studentProfile.first_name} ${studentProfile.last_name}`,
          field_of_study: studentProfile.field_of_study,
          graduation_year: studentProfile.graduation_year
        },
        pathways: finalPathways,
        bias_check: biasCheckResult,
        labor_market_insights: laborMarketData.insights
      };

    } catch (error) {
      console.error('Career pathway generation error:', error);
      throw new Error('Failed to generate career pathways');
    }
  }

  /**
   * Get complete student profile with all relevant data
   */
  async getStudentCompleteProfile(studentId) {
    const query = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        u.gender,
        u.date_of_birth,
        spa.technical_skills_score,
        spa.soft_skills_score,
        spa.education_score,
        spa.experience_score,
        spa.socioeconomic_score,
        spa.analysis_data
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
    student.analysis_data = JSON.parse(student.analysis_data || '{}');

    // Get student skills
    const skillsQuery = `
      SELECT s.name, s.category, ss.proficiency_level, s.market_demand
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.student_id = ?
      ORDER BY ss.proficiency_level DESC
    `;
    const [skills] = await db.execute(skillsQuery, [studentId]);
    student.skills = skills;

    // Get education details
    const educationQuery = `
      SELECT * FROM student_education WHERE student_id = ? ORDER BY graduation_year DESC
    `;
    const [education] = await db.execute(educationQuery, [studentId]);
    student.education_history = education;

    // Get experience
    const experienceQuery = `
      SELECT * FROM student_experience WHERE student_id = ? ORDER BY end_date DESC
    `;
    const [experience] = await db.execute(experienceQuery, [studentId]);
    student.work_experience = experience;

    return student;
  }

  /**
   * Get labor market data for specific field
   */
  async getLaborMarketData(fieldOfStudy) {
    // In a real implementation, this would integrate with external APIs
    // For now, we'll use stored market data
    
    const query = `
      SELECT * FROM labor_market_data 
      WHERE field = ? OR field = 'general'
      ORDER BY last_updated DESC
      LIMIT 10
    `;

    const [marketRows] = await db.execute(query, [fieldOfStudy]);

    // Default market data if none found
    const defaultData = {
      field: fieldOfStudy,
      growth_rate: 5.2,
      avg_salary_entry: 45000,
      avg_salary_mid: 65000,
      avg_salary_senior: 85000,
      job_availability: 'moderate',
      trending_skills: []
    };

    const marketData = marketRows.length > 0 ? marketRows[0] : defaultData;

    return {
      ...marketData,
      insights: this.generateMarketInsights(marketData)
    };
  }

  /**
   * Generate market insights from data
   */
  generateMarketInsights(marketData) {
    const insights = [];

    if (marketData.growth_rate > 10) {
      insights.push({
        type: 'opportunity',
        message: `High growth field with ${marketData.growth_rate}% annual growth rate`,
        priority: 'high'
      });
    } else if (marketData.growth_rate < 2) {
      insights.push({
        type: 'concern',
        message: `Slower growing field with ${marketData.growth_rate}% growth rate`,
        priority: 'medium'
      });
    }

    if (marketData.job_availability === 'high') {
      insights.push({
        type: 'opportunity',
        message: 'High job availability in this field',
        priority: 'medium'
      });
    }

    return insights;
  }

  /**
   * Create pathway options based on student profile and market data
   */
  async createPathwayOptions(studentProfile, laborMarketData) {
    const pathways = [];

    // 1. Direct Entry Pathway
    const directEntry = await this.createDirectEntryPathway(studentProfile, laborMarketData);
    pathways.push(directEntry);

    // 2. Skill Development Pathway
    const skillDevelopment = await this.createSkillDevelopmentPathway(studentProfile, laborMarketData);
    pathways.push(skillDevelopment);

    // 3. Advanced Education Pathway
    const advancedEducation = await this.createAdvancedEducationPathway(studentProfile, laborMarketData);
    pathways.push(advancedEducation);

    // 4. Entrepreneurial Pathway (if applicable)
    if (studentProfile.soft_skills_score >= 70) {
      const entrepreneurial = await this.createEntrepreneurialPathway(studentProfile, laborMarketData);
      pathways.push(entrepreneurial);
    }

    // 5. Alternative Field Pathway (if current field has low prospects)
    if (laborMarketData.growth_rate < 3) {
      const alternative = await this.createAlternativeFieldPathway(studentProfile);
      pathways.push(alternative);
    }

    return pathways;
  }

  /**
   * Create direct entry career pathway
   */
  async createDirectEntryPathway(studentProfile, laborMarketData) {
    const timeline = [];
    const requirements = [];
    let feasibilityScore = 70;

    // Immediate (0-6 months)
    timeline.push({
      phase: 'immediate',
      duration: '0-6 months',
      activities: [
        'Complete current education program',
        'Build portfolio/resume',
        'Network with industry professionals',
        'Apply for entry-level positions'
      ]
    });

    // Short-term (6-18 months)
    timeline.push({
      phase: 'short_term',
      duration: '6-18 months',
      activities: [
        'Secure entry-level position',
        'Learn on-the-job skills',
        'Build professional relationships',
        'Seek mentorship opportunities'
      ]
    });

    // Medium-term (1-3 years)
    timeline.push({
      phase: 'medium_term',
      duration: '1-3 years',
      activities: [
        'Gain specialized experience',
        'Take on additional responsibilities',
        'Pursue relevant certifications',
        'Build leadership skills'
      ]
    });

    // Adjust feasibility based on student profile
    if (studentProfile.technical_skills_score >= 70) feasibilityScore += 15;
    if (studentProfile.education_score >= 60) feasibilityScore += 10;
    if (studentProfile.work_experience?.length > 0) feasibilityScore += 10;

    // Socioeconomic adjustments
    if (studentProfile.socioeconomic_score < 40) {
      feasibilityScore -= 15;
      requirements.push('Seek financial support for job search period');
    }

    return {
      id: 'direct_entry',
      title: 'Direct Entry Career Path',
      description: `Enter the ${studentProfile.field_of_study} field directly after graduation`,
      feasibility_score: Math.min(100, feasibilityScore),
      timeline,
      requirements,
      expected_salary: {
        entry: laborMarketData.avg_salary_entry,
        year_3: Math.round(laborMarketData.avg_salary_entry * 1.3),
        year_5: Math.round(laborMarketData.avg_salary_entry * 1.6)
      },
      pros: [
        'Immediate income generation',
        'Real-world experience',
        'Professional network building'
      ],
      cons: [
        'May start at lower salary',
        'Limited initial responsibilities',
        'Competitive entry-level market'
      ]
    };
  }

  /**
   * Create skill development pathway
   */
  async createSkillDevelopmentPathway(studentProfile, laborMarketData) {
    const skillGaps = this.identifySkillGaps(studentProfile);
    const timeline = [];
    let feasibilityScore = 85;

    timeline.push({
      phase: 'skill_building',
      duration: '3-9 months',
      activities: [
        'Complete targeted skill training',
        'Earn industry certifications',
        'Build project portfolio',
        'Participate in bootcamps/workshops'
      ]
    });

    timeline.push({
      phase: 'application',
      duration: '6-12 months',
      activities: [
        'Apply enhanced skills in projects',
        'Seek internships or contract work',
        'Network with industry professionals',
        'Build online presence'
      ]
    });

    if (studentProfile.socioeconomic_score < 50) {
      feasibilityScore -= 20;
    }

    return {
      id: 'skill_development',
      title: 'Skill Enhancement Path',
      description: 'Focus on developing specific skills before entering the job market',
      feasibility_score: feasibilityScore,
      timeline,
      skill_gaps: skillGaps,
      recommended_training: this.getRecommendedTraining(skillGaps),
      expected_salary: {
        entry: Math.round(laborMarketData.avg_salary_entry * 1.2),
        year_3: Math.round(laborMarketData.avg_salary_entry * 1.5),
        year_5: Math.round(laborMarketData.avg_salary_entry * 1.8)
      },
      pros: [
        'Higher starting salary potential',
        'Competitive advantage',
        'Specialized expertise'
      ],
      cons: [
        'Delayed income',
        'Training costs',
        'Time investment required'
      ]
    };
  }

  /**
   * Create advanced education pathway
   */
  async createAdvancedEducationPathway(studentProfile, laborMarketData) {
    let feasibilityScore = 60;
    
    if (studentProfile.education_score >= 70) feasibilityScore += 20;
    if (studentProfile.socioeconomic_score >= 60) feasibilityScore += 15;
    
    return {
      id: 'advanced_education',
      title: 'Advanced Education Path',
      description: 'Pursue graduate studies or professional degrees',
      feasibility_score: feasibilityScore,
      timeline: [
        {
          phase: 'preparation',
          duration: '6-12 months',
          activities: [
            'Research programs and requirements',
            'Prepare for entrance exams',
            'Apply for scholarships/funding',
            'Submit applications'
          ]
        },
        {
          phase: 'education',
          duration: '1-3 years',
          activities: [
            'Complete advanced degree program',
            'Engage in research/thesis work',
            'Build academic network',
            'Seek internships/assistantships'
          ]
        }
      ],
      expected_salary: {
        entry: Math.round(laborMarketData.avg_salary_mid),
        year_3: Math.round(laborMarketData.avg_salary_senior),
        year_5: Math.round(laborMarketData.avg_salary_senior * 1.3)
      },
      pros: [
        'Higher earning potential',
        'Advanced expertise',
        'Research opportunities',
        'Academic network'
      ],
      cons: [
        'Significant time investment',
        'Educational costs',
        'Delayed earnings',
        'Competitive admission'
      ]
    };
  }

  /**
   * Create entrepreneurial pathway
   */
  async createEntrepreneurialPathway(studentProfile, laborMarketData) {
    return {
      id: 'entrepreneurial',
      title: 'Entrepreneurial Path',
      description: 'Start your own business or venture',
      feasibility_score: 50,
      timeline: [
        {
          phase: 'planning',
          duration: '3-6 months',
          activities: [
            'Develop business idea',
            'Market research and validation',
            'Create business plan',
            'Seek mentorship'
          ]
        },
        {
          phase: 'launch',
          duration: '6-18 months',
          activities: [
            'Secure initial funding',
            'Build minimum viable product',
            'Launch and test market',
            'Iterate based on feedback'
          ]
        }
      ],
      expected_salary: {
        entry: 20000, // Highly variable
        year_3: 50000,
        year_5: 100000
      },
      pros: [
        'Unlimited earning potential',
        'Creative freedom',
        'Be your own boss',
        'Impact on society'
      ],
      cons: [
        'High risk',
        'Financial uncertainty',
        'Long hours',
        'High failure rate'
      ]
    };
  }

  /**
   * Create alternative field pathway
   */
  async createAlternativeFieldPathway(studentProfile) {
    const transferableSkills = this.identifyTransferableSkills(studentProfile);
    
    return {
      id: 'alternative_field',
      title: 'Alternative Field Transition',
      description: 'Transition to a related field with better prospects',
      feasibility_score: 65,
      transferable_skills: transferableSkills,
      suggested_fields: this.getSuggestedAlternativeFields(studentProfile),
      timeline: [
        {
          phase: 'exploration',
          duration: '1-3 months',
          activities: [
            'Research alternative fields',
            'Identify skill transferability',
            'Network with professionals',
            'Attend industry events'
          ]
        },
        {
          phase: 'transition',
          duration: '6-12 months',
          activities: [
            'Acquire field-specific skills',
            'Build relevant portfolio',
            'Gain experience through projects',
            'Apply for transition roles'
          ]
        }
      ],
      pros: [
        'Better job prospects',
        'Use existing skills',
        'Career growth opportunities'
      ],
      cons: [
        'Learning curve',
        'Potential salary adjustment',
        'Network rebuilding required'
      ]
    };
  }

  /**
   * Check for bias in generated pathways
   */
  checkForBias(pathways, studentProfile) {
    const biasFlags = [];
    let biasFound = false;

    // Gender bias check
    if (studentProfile.gender && studentProfile.field_of_study) {
      const genderBias = this.checkGenderBias(pathways, studentProfile);
      if (genderBias.detected) {
        biasFlags.push(genderBias);
        biasFound = true;
      }
    }

    // Socioeconomic bias check
    const socioeconomicBias = this.checkSocioeconomicBias(pathways, studentProfile);
    if (socioeconomicBias.detected) {
      biasFlags.push(socioeconomicBias);
      biasFound = true;
    }

    // Age bias check
    const ageBias = this.checkAgeBias(pathways, studentProfile);
    if (ageBias.detected) {
      biasFlags.push(ageBias);
      biasFound = true;
    }

    return {
      biasFound,
      flags: biasFlags,
      confidence: biasFound ? 0.8 : 0.95
    };
  }

  /**
   * Check for gender bias
   */
  checkGenderBias(pathways, studentProfile) {
    // Simple bias detection - can be enhanced
    const maleFields = ['engineering', 'computer science', 'technology'];
    const femaleFields = ['nursing', 'education', 'social work'];
    
    const field = studentProfile.field_of_study.toLowerCase();
    const gender = studentProfile.gender.toLowerCase();

    let biasDetected = false;
    let message = '';

    if (gender === 'female' && maleFields.some(f => field.includes(f))) {
      const entrepreneurialPath = pathways.find(p => p.id === 'entrepreneurial');
      if (!entrepreneurialPath || entrepreneurialPath.feasibility_score < 50) {
        biasDetected = true;
        message = 'Potential gender bias: Entrepreneurial opportunities may be underrepresented for women in tech';
      }
    }

    return {
      detected: biasDetected,
      type: 'gender',
      message,
      recommendation: biasDetected ? 'Ensure equal representation of leadership and entrepreneurial opportunities' : null
    };
  }

  /**
   * Check for socioeconomic bias
   */
  checkSocioeconomicBias(pathways, studentProfile) {
    const socioScore = studentProfile.socioeconomic_score || 50;
    
    let biasDetected = false;
    let message = '';

    if (socioScore < 40) {
      const advancedEducationPath = pathways.find(p => p.id === 'advanced_education');
      if (advancedEducationPath && advancedEducationPath.feasibility_score < 30) {
        biasDetected = true;
        message = 'Potential socioeconomic bias: Advanced education pathway may be unfairly penalized due to financial constraints';
      }
    }

    return {
      detected: biasDetected,
      type: 'socioeconomic',
      message,
      recommendation: biasDetected ? 'Include financial aid and scholarship information for advanced education options' : null
    };
  }

  /**
   * Check for age bias
   */
  checkAgeBias(pathways, studentProfile) {
    const currentYear = new Date().getFullYear();
    const graduationYear = studentProfile.graduation_year;
    const yearsPostGrad = currentYear - graduationYear;

    let biasDetected = false;
    let message = '';

    if (yearsPostGrad > 5) {
      const entrepreneurialPath = pathways.find(p => p.id === 'entrepreneurial');
      if (entrepreneurialPath && entrepreneurialPath.feasibility_score < 40) {
        biasDetected = true;
        message = 'Potential age bias: Entrepreneurial opportunities may be undervalued for experienced professionals';
      }
    }

    return {
      detected: biasDetected,
      type: 'age',
      message,
      recommendation: biasDetected ? 'Consider experience as an asset for entrepreneurial ventures' : null
    };
  }

  /**
   * Adjust pathways to reduce bias
   */
  adjustForBias(pathways, biasCheckResult, studentProfile) {
    const adjustedPathways = [...pathways];

    biasCheckResult.flags.forEach(bias => {
      if (bias.type === 'gender' && bias.detected) {
        // Boost entrepreneurial pathway for underrepresented groups
        const entrepreneurialIndex = adjustedPathways.findIndex(p => p.id === 'entrepreneurial');
        if (entrepreneurialIndex !== -1) {
          adjustedPathways[entrepreneurialIndex].feasibility_score = Math.min(100, 
            adjustedPathways[entrepreneurialIndex].feasibility_score + 20
          );
          adjustedPathways[entrepreneurialIndex].bias_adjustment = 'Adjusted for gender representation';
        }
      }

      if (bias.type === 'socioeconomic' && bias.detected) {
        // Add financial support information
        const advancedEducationIndex = adjustedPathways.findIndex(p => p.id === 'advanced_education');
        if (advancedEducationIndex !== -1) {
          adjustedPathways[advancedEducationIndex].financial_support_options = [
            'Federal financial aid programs',
            'Merit-based scholarships',
            'Graduate assistantships',
            'Employer tuition reimbursement'
          ];
          adjustedPathways[advancedEducationIndex].feasibility_score = Math.min(100,
            adjustedPathways[advancedEducationIndex].feasibility_score + 15
          );
        }
      }
    });

    return adjustedPathways;
  }

  /**
   * Identify skill gaps for student
   */
  identifySkillGaps(studentProfile) {
    const currentSkills = studentProfile.skills || [];
    const skillGaps = [];

    // Get market-demanded skills for the field
    const highDemandSkills = currentSkills.filter(s => s.market_demand === 'high');
    const studentHighSkills = currentSkills.filter(s => s.proficiency_level >= 4);

    // Find gaps in high-demand skills
    const missingHighDemandSkills = highDemandSkills.filter(marketSkill => 
      !studentHighSkills.some(studentSkill => studentSkill.name === marketSkill.name)
    );

    missingHighDemandSkills.forEach(skill => {
      skillGaps.push({
        skill_name: skill.name,
        category: skill.category,
        current_level: 0,
        target_level: 4,
        priority: 'high'
      });
    });

    return skillGaps;
  }

  /**
   * Get recommended training for skill gaps
   */
  getRecommendedTraining(skillGaps) {
    return skillGaps.map(gap => ({
      skill: gap.skill_name,
      training_options: [
        'Online courses (Coursera, Udemy)',
        'Professional certification programs',
        'Industry workshops and seminars',
        'Hands-on project experience'
      ],
      estimated_duration: gap.priority === 'high' ? '2-4 months' : '1-2 months'
    }));
  }

  /**
   * Identify transferable skills
   */
  identifyTransferableSkills(studentProfile) {
    const transferableSkills = [];
    const skills = studentProfile.skills || [];

    skills.forEach(skill => {
      if (skill.category === 'soft' || skill.proficiency_level >= 4) {
        transferableSkills.push({
          skill_name: skill.name,
          proficiency: skill.proficiency_level,
          applicability: skill.category === 'soft' ? 'universal' : 'technical'
        });
      }
    });

    return transferableSkills;
  }

  /**
   * Get suggested alternative fields
   */
  getSuggestedAlternativeFields(studentProfile) {
    // This would typically use a mapping database
    const fieldMappings = {
      'computer science': ['data science', 'cybersecurity', 'product management'],
      'business': ['marketing', 'consulting', 'project management'],
      'engineering': ['technical sales', 'product development', 'quality assurance']
    };

    const currentField = studentProfile.field_of_study.toLowerCase();
    
    for (const [field, alternatives] of Object.entries(fieldMappings)) {
      if (currentField.includes(field)) {
        return alternatives.map(alt => ({
          field_name: alt,
          similarity_score: 80,
          growth_prospects: 'good'
        }));
      }
    }

    return [];
  }

  /**
   * Store generated career pathways
   */
  async storeCareerPathways(studentId, pathways, biasCheckResult) {
    // Clear existing pathways for this student
    await db.execute('DELETE FROM career_pathways WHERE student_id = ?', [studentId]);

    // Insert new pathways
    for (let pathway of pathways) {
      const insertQuery = `
        INSERT INTO career_pathways (
          student_id, pathway_id, title, description, feasibility_score,
          timeline_data, requirements_data, salary_projection, 
          pros_cons, bias_check_result, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      await db.execute(insertQuery, [
        studentId,
        pathway.id,
        pathway.title,
        pathway.description,
        pathway.feasibility_score,
        JSON.stringify(pathway.timeline),
        JSON.stringify(pathway.requirements || []),
        JSON.stringify(pathway.expected_salary),
        JSON.stringify({ pros: pathway.pros, cons: pathway.cons }),
        JSON.stringify(biasCheckResult)
      ]);
    }
  }

  /**
   * Get stored career pathways for student
   */
  async getStudentCareerPathways(studentId) {
    const query = `
      SELECT * FROM career_pathways 
      WHERE student_id = ?
      ORDER BY feasibility_score DESC
    `;

    const [pathways] = await db.execute(query, [studentId]);

    return pathways.map(pathway => ({
      ...pathway,
      timeline_data: JSON.parse(pathway.timeline_data || '[]'),
      requirements_data: JSON.parse(pathway.requirements_data || '[]'),
      salary_projection: JSON.parse(pathway.salary_projection || '{}'),
      pros_cons: JSON.parse(pathway.pros_cons || '{}'),
      bias_check_result: JSON.parse(pathway.bias_check_result || '{}')
    }));
  }
}

module.exports = new CareerPathwayService();
