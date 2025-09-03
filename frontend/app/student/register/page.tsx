'use client';

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function StudentRegistration() {
  console.log('StudentRegistration component loaded')
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    password: '',
    university: '',
    studyLevel: '',
    fieldOfStudy: '',
    
    // Socioeconomic Constraints
    annualBudget: '',
    preferredLocation: '',
    familyObligations: '',
    transportationLimitations: '',
    preferredWorkSchedule: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, '=', value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNextStep = () => {
    console.log('Next step clicked. Current form data:', formData);
    if (currentStep < 2) {
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
    
    console.log('Form submitted! Current step:', currentStep)
    console.log('Current form data:', formData)
    
    if (currentStep < 2) {
      console.log('Moving to next step')
      setCurrentStep(currentStep + 1)
      return
    }

    console.log('Starting registration process...')
    
    // Validate required fields before submission
    const requiredFields = ['fullName', 'email', 'password', 'university', 'studyLevel', 'fieldOfStudy'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting registration data:', formData)
      
      const requestData = {
        email: formData.email,
        password: formData.password,
        userType: 'student',
        fullName: formData.fullName,
        university: formData.university,
        studyLevel: formData.studyLevel,
        fieldOfStudy: formData.fieldOfStudy,
        annualBudget: formData.annualBudget,
        preferredLocation: formData.preferredLocation,
        familyObligations: formData.familyObligations,
        transportationLimitations: formData.transportationLimitations,
        preferredWorkSchedule: formData.preferredWorkSchedule
      };
      
      console.log('Request data being sent:', requestData);
      
      // Submit to backend API using direct fetch
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json()
        console.log('Registration successful:', data)
        alert('Registration successful! Please log in with your credentials.')
        // Redirect to login page
        window.location.href = '/login'
      } else {
        const errorText = await response.text();
        console.error('Registration failed - Raw response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('Registration failed - Parsed error:', errorData);
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errorMessages = errorData.errors.map((err: any) => 
              `${err.path || err.field || err.param}: ${err.msg || err.message}`
            ).join('\n');
            alert(`Registration failed:\n${errorMessages}`);
          } else {
            alert(`Registration failed: ${errorData.message || 'Unknown error'}`)
          }
        } catch (parseError) {
          alert(`Registration failed: ${response.statusText} (${response.status})`)
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      alert('Registration failed. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Pathway Decider</h1>
          <Link href="/" className="text-blue-200 hover:text-white">
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
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 2</span>
              <span className="text-sm font-medium text-gray-600">{currentStep === 1 ? 'Personal Information' : 'Socioeconomic Constraints'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Create Your Student Profile
          </h2>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your email address"
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
                    className="input-field"
                    placeholder="Create a secure password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University/College *
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your educational institution"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Level (Undergraduate/Graduate) *
                  </label>
                  <select
                    name="studyLevel"
                    value={formData.studyLevel}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select study level</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="doctorate">Doctorate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field of Study *
                  </label>
                  <input
                    type="text"
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Computer Science, Business, Engineering"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Continue to Skills Assessment
                </button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Socioeconomic Constraints</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Budget for Education/Training *
                  </label>
                  <select
                    name="annualBudget"
                    value={formData.annualBudget}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select budget range</option>
                    <option value="0-1000">$0 - $1,000</option>
                    <option value="1000-5000">$1,000 - $5,000</option>
                    <option value="5000-10000">$5,000 - $10,000</option>
                    <option value="10000+">$10,000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Location (Remote/On-site/Hybrid) *
                  </label>
                  <select
                    name="preferredLocation"
                    value={formData.preferredLocation}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select preference</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">On-site</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Obligations (Yes/No) *
                  </label>
                  <select
                    name="familyObligations"
                    value={formData.familyObligations}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transportation Limitations *
                  </label>
                  <input
                    type="text"
                    name="transportationLimitations"
                    value={formData.transportationLimitations}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Describe any transportation constraints"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Work Schedule *
                  </label>
                  <select
                    name="preferredWorkSchedule"
                    value={formData.preferredWorkSchedule}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select schedule</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="flexible">Flexible hours</option>
                    <option value="weekends">Weekends only</option>
                  </select>
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
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
