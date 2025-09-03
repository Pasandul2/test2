'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { apiCall } from '@/lib/apiConfig'

interface Pathway {
  id: string;
  title: string;
  description: string;
  feasibility_score: number;
  status: 'recommended' | 'in_progress' | 'completed';
  next_milestone?: string;
  steps: PathwayStep[];
}

interface PathwayStep {
  id: string;
  title: string;
  description: string;
  estimated_duration: string;
  status: 'not_started' | 'in_progress' | 'completed';
  resources: string[];
}

export default function StudentPathways() {
  const router = useRouter()
  const [pathways, setPathways] = useState<Pathway[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null)

  useEffect(() => {
    fetchPathways()
  }, [])

  const fetchPathways = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token || !user) {
        router.push('/login')
        return
      }

      const userData = JSON.parse(user)
      
      // Mock data for now since API might not be fully implemented
      setPathways([
        {
          id: '1',
          title: 'Software Development Path',
          description: 'Comprehensive pathway to become a full-stack developer with focus on modern web technologies.',
          feasibility_score: 87,
          status: 'recommended',
          next_milestone: 'Complete React.js fundamentals course',
          steps: [
            {
              id: '1-1',
              title: 'HTML/CSS Fundamentals',
              description: 'Master the basics of web markup and styling',
              estimated_duration: '4 weeks',
              status: 'completed',
              resources: ['MDN Web Docs', 'freeCodeCamp', 'CSS Grid Garden']
            },
            {
              id: '1-2',
              title: 'JavaScript Programming',
              description: 'Learn modern JavaScript and ES6+ features',
              estimated_duration: '6 weeks',
              status: 'in_progress',
              resources: ['JavaScript.info', 'Eloquent JavaScript', 'You Don\'t Know JS']
            },
            {
              id: '1-3',
              title: 'React.js Framework',
              description: 'Build interactive user interfaces with React',
              estimated_duration: '8 weeks',
              status: 'not_started',
              resources: ['React Documentation', 'React for Beginners', 'The Road to React']
            }
          ]
        },
        {
          id: '2',
          title: 'Data Science Career Path',
          description: 'Transform into a data scientist with Python, machine learning, and statistical analysis skills.',
          feasibility_score: 72,
          status: 'recommended',
          next_milestone: 'Set up Python development environment',
          steps: [
            {
              id: '2-1',
              title: 'Python Programming',
              description: 'Learn Python basics and data manipulation',
              estimated_duration: '6 weeks',
              status: 'not_started',
              resources: ['Python.org Tutorial', 'Automate the Boring Stuff', 'Python Crash Course']
            },
            {
              id: '2-2',
              title: 'Data Analysis with Pandas',
              description: 'Master data manipulation and analysis',
              estimated_duration: '4 weeks',
              status: 'not_started',
              resources: ['Pandas Documentation', 'Python for Data Analysis', 'DataCamp']
            }
          ]
        }
      ])
    } catch (error) {
      console.error('Failed to fetch pathways:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'recommended': return 'bg-yellow-100 text-yellow-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500'
      case 'not_started': return 'bg-gray-300'
      default: return 'bg-gray-300'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900">Loading Pathways...</h2>
          <p className="text-gray-600">Getting your personalized career paths</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Career Pathways</h1>
              <p className="text-gray-600">Explore your personalized learning and career paths</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pathways List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Pathways</h2>
            <div className="space-y-4">
              {pathways.map((pathway) => (
                <motion.div
                  key={pathway.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer border-2 ${
                    selectedPathway?.id === pathway.id ? 'border-blue-500' : 'border-transparent'
                  } hover:border-blue-300`}
                  onClick={() => setSelectedPathway(pathway)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{pathway.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pathway.status)}`}>
                      {pathway.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{pathway.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Feasibility: {pathway.feasibility_score}%
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${pathway.feasibility_score}%` }}
                      ></div>
                    </div>
                  </div>
                  {pathway.next_milestone && (
                    <div className="mt-3 text-sm text-blue-600">
                      Next: {pathway.next_milestone}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pathway Details */}
          <div className="lg:col-span-2">
            {selectedPathway ? (
              <motion.div
                key={selectedPathway.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPathway.title}</h2>
                      <p className="text-gray-600 mt-2">{selectedPathway.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPathway.status)}`}>
                      {selectedPathway.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Feasibility Score: {selectedPathway.feasibility_score}%
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${selectedPathway.feasibility_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Steps</h3>
                  <div className="space-y-4">
                    {selectedPathway.steps.map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full ${getStepStatusColor(step.status)} flex items-center justify-center`}>
                            <span className="text-white text-sm font-medium">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-md font-medium text-gray-900">{step.title}</h4>
                            <span className="text-sm text-gray-500">{step.estimated_duration}</span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-gray-700">Resources:</h5>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {step.resources.map((resource, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                >
                                  {resource}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex space-x-4">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                      Start This Pathway
                    </button>
                    <button className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">
                      Save for Later
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Pathway</h3>
                <p className="text-gray-600">Choose a career pathway from the list to view detailed steps and resources.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}