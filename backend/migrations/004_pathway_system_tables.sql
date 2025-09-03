-- Additional tables for the complete pathway system

-- Student Profile Analysis Table
CREATE TABLE IF NOT EXISTS student_profile_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    technical_skills_score INT DEFAULT 0,
    soft_skills_score INT DEFAULT 0,
    education_score INT DEFAULT 0,
    experience_score INT DEFAULT 0,
    socioeconomic_score INT DEFAULT 50,
    location_flexibility ENUM('local', 'flexible', 'remote') DEFAULT 'local',
    analysis_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_analysis (user_id)
);

-- Employer Student Matches Table
CREATE TABLE IF NOT EXISTS employer_student_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    job_id INT NULL,
    student_id INT NOT NULL,
    compatibility_score INT NOT NULL,
    score_breakdown JSON,
    match_reasons JSON,
    status ENUM('pending', 'viewed', 'contacted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employer_score (employer_id, compatibility_score DESC),
    INDEX idx_student_score (student_id, compatibility_score DESC)
);

-- Labor Market Data Table
CREATE TABLE IF NOT EXISTS labor_market_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field VARCHAR(100) NOT NULL,
    growth_rate DECIMAL(5,2) DEFAULT 5.0,
    avg_salary_entry DECIMAL(10,2) DEFAULT 45000,
    avg_salary_mid DECIMAL(10,2) DEFAULT 65000,
    avg_salary_senior DECIMAL(10,2) DEFAULT 85000,
    job_availability ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
    trending_skills JSON,
    region VARCHAR(100) DEFAULT 'national',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_field (field)
);

-- Career Pathways Table
CREATE TABLE IF NOT EXISTS career_pathways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pathway_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    feasibility_score INT NOT NULL,
    timeline_data JSON,
    requirements_data JSON,
    salary_projection JSON,
    pros_cons JSON,
    bias_check_result JSON,
    status ENUM('generated', 'selected', 'in_progress', 'completed') DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_pathways (student_id, feasibility_score DESC)
);

-- Student Education Table (detailed education history)
CREATE TABLE IF NOT EXISTS student_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    degree_type ENUM('high_school', 'associate', 'bachelor', 'master', 'phd', 'certificate') NOT NULL,
    field_of_study VARCHAR(100),
    graduation_year YEAR,
    gpa DECIMAL(3,2),
    honors VARCHAR(100),
    relevant_coursework TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_education (student_id, graduation_year DESC)
);

-- Student Experience Table (work experience details)
CREATE TABLE IF NOT EXISTS student_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company_name VARCHAR(200),
    position_title VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    years DECIMAL(3,1) DEFAULT 0,
    relevant BOOLEAN DEFAULT TRUE,
    leadership BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_experience (student_id, start_date DESC)
);

-- User Feedback Collection Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    feedback_type ENUM('pathway', 'match', 'recommendation', 'general') NOT NULL,
    reference_id INT, -- Can reference pathway_id, match_id, etc.
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_feedback_type (feedback_type, created_at DESC)
);

-- Skills Market Demand Update
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS market_demand ENUM('low', 'moderate', 'high') DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS trend ENUM('declining', 'stable', 'growing') DEFAULT 'stable';

-- Job Skills Junction Table Enhancement
CREATE TABLE IF NOT EXISTS job_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level INT CHECK (required_level BETWEEN 1 AND 5),
    is_required BOOLEAN DEFAULT TRUE,
    weight DECIMAL(3,2) DEFAULT 1.0, -- Importance weight for matching
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE KEY unique_job_skill (job_id, skill_id)
);

-- Insert sample labor market data
INSERT INTO labor_market_data (field, growth_rate, avg_salary_entry, avg_salary_mid, avg_salary_senior, job_availability, trending_skills) VALUES
('Computer Science', 15.2, 65000, 85000, 120000, 'high', '["Python", "Machine Learning", "Cloud Computing", "DevOps"]'),
('Data Science', 18.5, 70000, 95000, 130000, 'high', '["Python", "R", "SQL", "Machine Learning", "Statistics"]'),
('Business Administration', 6.8, 45000, 65000, 90000, 'moderate', '["Project Management", "Digital Marketing", "Data Analysis"]'),
('Engineering', 8.2, 60000, 80000, 110000, 'moderate', '["CAD", "Project Management", "Automation", "Sustainability"]'),
('Healthcare', 12.1, 50000, 70000, 95000, 'high', '["Electronic Health Records", "Telemedicine", "Patient Care"]'),
('Education', 4.2, 35000, 50000, 65000, 'moderate', '["Online Teaching", "Educational Technology", "Curriculum Development"]'),
('Marketing', 9.5, 42000, 62000, 85000, 'moderate', '["Digital Marketing", "Social Media", "Analytics", "Content Creation"]'),
('general', 5.2, 45000, 65000, 85000, 'moderate', '["Communication", "Problem Solving", "Adaptability"]');

-- Update skills with market demand information
UPDATE skills SET market_demand = 'high', trend = 'growing' 
WHERE name IN ('Python', 'JavaScript', 'Machine Learning', 'Data Analysis', 'Cloud Computing', 'Project Management');

UPDATE skills SET market_demand = 'high', trend = 'stable' 
WHERE name IN ('Communication', 'Leadership', 'Problem Solving', 'Teamwork');

UPDATE skills SET market_demand = 'moderate', trend = 'stable' 
WHERE name IN ('Microsoft Office', 'Customer Service', 'Time Management');

UPDATE skills SET market_demand = 'low', trend = 'declining' 
WHERE name IN ('Flash', 'Internet Explorer', 'Legacy Systems');
