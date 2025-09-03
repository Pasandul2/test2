'use client';

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function EmployerRegistration() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Company Information
    email: '',
    password: '',
    companyName: '',
    companySize: '',
    industry: '',
    location: '',
    
    // Growth & Culture
    companyDescription: '',
    growthTrajectory: '',
    workCulture: '',
    benefits: [] as string[],
    
    // Job Requirements (Initial)
    typicalJobTypes: [] as string[],
    preferredSkills: [] as string[],
    experienceLevels: [] as string[]
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMultiSelect = (name: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof typeof prev] as string[]
      return {
        ...prev,
        [name]: currentArray.includes(value)
          ? currentArray.filter((item: string) => item !== value)
          : [...currentArray, value]
      }
    })
  }

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentStep < 3) {
      handleNextStep()
      return
    }

    setIsSubmitting(true)
    
    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        userType: 'employer',
        companyName: formData.companyName,
        companySize: formData.companySize,
        industry: formData.industry,
        location: formData.location,
        companyDescription: formData.companyDescription,
        growthTrajectory: formData.growthTrajectory,
        workCulture: formData.workCulture,
        benefits: formData.benefits,
        typicalJobTypes: formData.typicalJobTypes,
        preferredSkills: formData.preferredSkills,
        experienceLevels: formData.experienceLevels
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (response.ok) {
        const data = await response.json()
        alert('Registration successful! Please log in with your credentials.')
        window.location.href = '/login'
      } else {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          alert(`Registration failed: ${errorData.message || 'Unknown error'}`)
        } catch (parseError) {
          alert(`Registration failed: ${response.statusText} (${response.status})`)
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      alert('Registration failed. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Pathway Decider</h1>
          <Link href="/" className="text-orange-200 hover:text-white">
            ← Back to Home
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 3</span>
              <span className="text-sm font-medium text-gray-600">
                {currentStep === 1 ? 'Company Information' : 
                 currentStep === 2 ? 'Growth & Culture' : 'Job Requirements'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Create Your Employer Profile
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter company email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Create a secure password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size *
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select company size</option>
                    <option value="startup">Startup (1-10 employees)</option>
                    <option value="small">Small (11-50 employees)</option>
                    <option value="medium">Medium (51-200 employees)</option>
                    <option value="large">Large (201-1000 employees)</option>
                    <option value="enterprise">Enterprise (1000+ employees)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="consulting">Consulting</option>
                    <option value="media">Media & Entertainment</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="City, State/Country"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Continue to Growth & Culture
                </button>
              </motion.div>
            )}

            {/* Step 2: Growth & Culture */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Growth & Culture</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description *
                  </label>
                  <textarea
                    name="companyDescription"
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe your company, mission, and what makes it unique..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Growth Trajectory *
                  </label>
                  <select
                    name="growthTrajectory"
                    value={formData.growthTrajectory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select growth stage</option>
                    <option value="startup">Early-stage startup</option>
                    <option value="high_growth">High growth</option>
                    <option value="stable">Stable/Established</option>
                    <option value="expanding">Expanding to new markets</option>
                    <option value="mature">Mature company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Culture *
                  </label>
                  <select
                    name="workCulture"
                    value={formData.workCulture}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select work culture</option>
                    <option value="collaborative">Collaborative</option>
                    <option value="innovative">Innovation-focused</option>
                    <option value="results_driven">Results-driven</option>
                    <option value="flexible">Flexible/Remote-friendly</option>
                    <option value="traditional">Traditional/Structured</option>
                    <option value="fast_paced">Fast-paced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Benefits (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Health Insurance', 'Retirement Plan', 'Flexible Hours', 'Remote Work', 'Professional Development', 'Stock Options', 'Paid Time Off', 'Parental Leave'].map((benefit) => (
                      <label key={benefit} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.benefits.includes(benefit)}
                          onChange={() => handleMultiSelect('benefits', benefit)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{benefit}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    Previous Step
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    Continue to Job Requirements
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Job Requirements */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Typical Job Requirements</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Typical Job Types (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.typicalJobTypes.includes(type)}
                          onChange={() => handleMultiSelect('typicalJobTypes', type)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Common Skills You Look For (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Project Management', 'Communication', 'Leadership', 'Problem Solving', 'Team Work', 'Data Analysis', 'Design'].map((skill) => (
                      <label key={skill} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferredSkills.includes(skill)}
                          onChange={() => handleMultiSelect('preferredSkills', skill)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Levels You Hire (Select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Manager', 'Internship', 'Fresh Graduate'].map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.experienceLevels.includes(level)}
                          onChange={() => handleMultiSelect('experienceLevels', level)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    Previous Step
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
