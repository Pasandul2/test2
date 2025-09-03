'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  salaryMin: string;
  salaryMax: string;
  remoteAllowed: boolean;
  applicationDeadline: string;
  skills: string[];
  benefits: string[];
  companyOverview: string;
}

const skillOptions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL',
  'Data Analysis', 'Machine Learning', 'Project Management', 'Communication',
  'Problem Solving', 'Leadership', 'Teamwork', 'Marketing', 'Sales', 'Design'
];

const benefitOptions = [
  'Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k) Match',
  'Flexible Schedule', 'Remote Work', 'Paid Time Off', 'Professional Development',
  'Tuition Reimbursement', 'Stock Options', 'Bonus Programs', 'Gym Membership',
  'Free Meals', 'Transportation Allowance'
];

export default function PostJobPage() {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full-time',
    experienceLevel: 'entry',
    salaryMin: '',
    salaryMax: '',
    remoteAllowed: false,
    applicationDeadline: '',
    skills: [],
    benefits: [],
    companyOverview: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleBenefitToggle = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('Job title is required');
    } else if (formData.title.trim().length < 5) {
      errors.push('Job title must be at least 5 characters');
    }
    
    if (!formData.description.trim()) {
      errors.push('Job description is required');
    } else if (formData.description.trim().length < 50) {
      errors.push(`Job description must be at least 50 characters (currently ${formData.description.trim().length})`);
    }
    
    if (!formData.requirements.trim()) {
      errors.push('Job requirements are required');
    } else if (formData.requirements.trim().length < 20) {
      errors.push(`Job requirements must be at least 20 characters (currently ${formData.requirements.trim().length})`);
    }
    
    if (!formData.location.trim()) {
      errors.push('Location is required');
    } else if (formData.location.trim().length < 2) {
      errors.push('Location must be at least 2 characters');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
      return;
    }
    
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to post a job');
        return;
      }

      console.log('Posting job with data:', formData);

      const response = await fetch('http://localhost:5000/api/jobs/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          salaryMin: parseFloat(formData.salaryMin) || 0,
          salaryMax: parseFloat(formData.salaryMax) || 0
        })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Job posted successfully:', data);
        alert('Job posted successfully!');
        // Redirect to jobs management page
        window.location.href = '/employer/jobs';
      } else {
        const errorText = await response.text();
        console.error('Job posting failed - Raw response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('Job posting failed - Parsed error:', errorData);
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((error: any) => 
              `${error.path}: ${error.msg}`
            ).join('\n');
            alert(`Validation errors:\n${errorMessages}`);
          } else {
            alert(`Job posting failed: ${errorData.message || 'Unknown error'}`);
          }
        } catch (parseError) {
          alert(`Job posting failed: ${response.statusText} (${response.status})`);
        }
      }
    } catch (error: any) {
      console.error('Job posting error:', error);
      alert('Job posting failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 before proceeding
      const step1Errors = [];
      if (!formData.title.trim() || formData.title.trim().length < 5) {
        step1Errors.push('Job title must be at least 5 characters');
      }
      if (!formData.description.trim() || formData.description.trim().length < 50) {
        step1Errors.push(`Job description must be at least 50 characters (currently ${formData.description.trim().length})`);
      }
      if (!formData.location.trim() || formData.location.trim().length < 2) {
        step1Errors.push('Location must be at least 2 characters');
      }
      
      if (step1Errors.length > 0) {
        alert('Please complete the following before proceeding:\n\n' + step1Errors.join('\n'));
        return;
      }
    }
    
    if (currentStep === 2) {
      // Validate step 2 before proceeding
      if (!formData.requirements.trim() || formData.requirements.trim().length < 20) {
        alert(`Job requirements must be at least 20 characters (currently ${formData.requirements.trim().length})`);
        return;
      }
    }
    
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Post New Job</h1>
          <p className="text-blue-200">Create a job posting to attract talented candidates</p>
          <Link href="/employer/dashboard" className="text-blue-200 hover:text-white mt-2 inline-block">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-300 text-blue-600'
                  }`}
                >
                  {step}
                </div>
                <span className="ml-2 text-white text-sm">
                  {step === 1 && 'Job Details'}
                  {step === 2 && 'Requirements'}
                  {step === 3 && 'Benefits & Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-lg shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Software Engineer, Marketing Manager"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description * (minimum 50 characters)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    minLength={50}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.description.length > 0 && formData.description.trim().length < 50 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Describe the role, responsibilities, and what makes this position exciting... (minimum 50 characters required)"
                  />
                  <p className={`text-sm mt-1 ${
                    formData.description.trim().length < 50 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {formData.description.trim().length}/50 characters
                    {formData.description.length > 0 && formData.description.trim().length < 50 && (
                      <span className="font-medium"> - Need {50 - formData.description.trim().length} more characters</span>
                    )}
                  </p>
                  
                  {/* Validation Warning */}
                  {formData.description.length > 0 && formData.description.trim().length < 50 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-yellow-800 font-medium">
                          Description too short - need {50 - formData.description.trim().length} more characters for validation
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. New York, NY or Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="lead">Lead/Principal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="remoteAllowed"
                      checked={formData.remoteAllowed}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Remote work allowed
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Requirements */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-lg shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements & Skills</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Requirements * (minimum 20 characters)
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    required
                    minLength={20}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.requirements.length > 0 && formData.requirements.trim().length < 20 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="List the required qualifications, education, experience, and other requirements... (minimum 20 characters required)"
                  />
                  <p className={`text-sm mt-1 ${
                    formData.requirements.trim().length < 20 ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {formData.requirements.trim().length}/20 characters
                    {formData.requirements.length > 0 && formData.requirements.trim().length < 20 && (
                      <span className="font-medium"> - Need {20 - formData.requirements.trim().length} more characters</span>
                    )}
                  </p>
                  
                  {/* Validation Warning */}
                  {formData.requirements.length > 0 && formData.requirements.trim().length < 20 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-yellow-800 font-medium">
                          Requirements too short - need {20 - formData.requirements.trim().length} more characters for validation
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Required Skills
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Salary ($)
                    </label>
                    <input
                      type="number"
                      name="salaryMin"
                      value={formData.salaryMin}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Salary ($)
                    </label>
                    <input
                      type="number"
                      name="salaryMax"
                      value={formData.salaryMax}
                      onChange={handleInputChange}
                      min="0"
                      step="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="80000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next Step
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Benefits & Review */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white rounded-lg shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Benefits & Company Overview</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Benefits Offered
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {benefitOptions.map((benefit) => (
                      <label key={benefit} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.benefits.includes(benefit)}
                          onChange={() => handleBenefitToggle(benefit)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Overview
                  </label>
                  <textarea
                    name="companyOverview"
                    value={formData.companyOverview}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell candidates about your company culture, mission, and what makes it a great place to work..."
                  />
                </div>

                {/* Job Preview */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Preview</h3>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">{formData.title || 'Job Title'}</h4>
                    <p className="text-sm text-gray-600">{formData.location} • {formData.employmentType}</p>
                    <p className="text-sm text-gray-600">Experience: {formData.experienceLevel}</p>
                    {(formData.salaryMin || formData.salaryMax) && (
                      <p className="text-sm text-gray-600">
                        Salary: ${formData.salaryMin ? parseInt(formData.salaryMin).toLocaleString() : '0'} - 
                        ${formData.salaryMax ? parseInt(formData.salaryMax).toLocaleString() : '0'}
                      </p>
                    )}
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.skills.slice(0, 5).map((skill) => (
                          <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                        {formData.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{formData.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    formData.description.trim().length < 50 || 
                    formData.requirements.trim().length < 20 ||
                    !formData.title.trim() ||
                    !formData.location.trim()
                  }
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting Job...' : 'Post Job'}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}
