'use client';

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SoftSkill {
  name: string;
  rating: number;
}

interface SelectedSkills {
  technical: string[];
  soft: SoftSkill[];
  interests: string;
}

export default function SkillsAssessment() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkills>({
    technical: [],
    soft: [
      { name: 'Communication', rating: 0 },
      { name: 'Leadership', rating: 0 },
      { name: 'Problem Solving', rating: 0 },
      { name: 'Teamwork', rating: 0 }
    ],
    interests: ''
  })

  const technicalSkills = [
    'Python', 'JavaScript', 'Java', 'C++', 'React', 'Node.js', 
    'Firebase', 'Git', 'HTML/CSS', 'SQL'
  ]

  const handleTechnicalSkillToggle = (skill: string) => {
    setSelectedSkills(prev => ({
      ...prev,
      technical: prev.technical.includes(skill)
        ? prev.technical.filter(s => s !== skill)
        : [...prev.technical, skill]
    }))
  }

  const handleSoftSkillRating = (skillName: string, rating: number) => {
    setSelectedSkills(prev => ({
      ...prev,
      soft: prev.soft.map(skill => 
        skill.name === skillName ? { ...skill, rating } : skill
      )
    }))
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

  const handleSubmit = () => {
    console.log('Skills assessment data:', selectedSkills)
    // Redirect to pathway generation
    window.location.href = '/student/pathways'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Smart Pathway Decider</h1>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full inline-block mb-4">
            <span className="text-sm font-medium">Progress: 3/5 Steps</span>
          </div>
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
                {currentStep === 1 ? 'Technical Skills' : 
                 currentStep === 2 ? 'Soft Skills' : 'Career Interests'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Skills Assessment
          </h2>

          {/* Step 1: Technical Skills */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Skills</h3>
                <p className="text-gray-600 mb-6">Programming Languages</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {technicalSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleTechnicalSkillToggle(skill)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedSkills.technical.includes(skill)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Frameworks & Tools</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {['React', 'Node.js', 'Firebase', 'Git'].map((tool) => (
                    <button
                      key={tool}
                      onClick={() => handleTechnicalSkillToggle(tool)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedSkills.technical.includes(tool)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                Next: Generate Pathways
              </button>
            </motion.div>
          )}

          {/* Step 2: Soft Skills */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Soft Skills</h3>
              
              <div className="space-y-6">
                {selectedSkills.soft.map((skill: SoftSkill) => (
                  <div key={skill.name} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {skill.name} (Rate 1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={skill.rating}
                      onChange={(e) => handleSoftSkillRating(skill.name, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Beginner</span>
                      <span className="font-medium">{skill.rating}/10</span>
                      <span>Expert</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handlePreviousStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Previous Step
                </button>
                <button
                  onClick={handleNextStep}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Next: Generate Pathways
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Career Interests */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Career Interests</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your career aspirations...
                </label>
                <textarea
                  value={selectedSkills.interests}
                  onChange={(e) => setSelectedSkills(prev => ({ ...prev, interests: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                  rows={6}
                  placeholder="Describe your career goals, interests, and what type of work environment you prefer..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handlePreviousStep}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Previous Step
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Next: Generate Pathways
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
