'use client';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface OpportunityAlert {
  id: number
  job_id: number
  match_score: number
  alert_type: 'new_match' | 'score_update' | 'deadline_reminder'
  is_viewed: boolean
  is_dismissed: boolean
  created_at: string
  job_title: string
  description: string
  location: string
  employment_type: string
  salary_min?: number
  salary_max?: number
  application_deadline?: string
  company_name: string
  industry: string
  company_location: string
}

export default function OpportunityAlerts() {
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unviewed' | 'high_match'>('all')

  useEffect(() => {
    fetchAlerts()
  }, [filter])

  const fetchAlerts = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/opportunities/student?filter=${filter}&mark_viewed=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewAlerts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/opportunities/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Generated ${data.data.new_alerts.length} new opportunity alerts!`)
        fetchAlerts() // Refresh the list
      }
    } catch (error) {
      console.error('Error generating alerts:', error)
      alert('Failed to generate new alerts. Please try again.')
    }
  }

  const dismissAlert = async (alertId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/opportunities/${alertId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      }
    } catch (error) {
      console.error('Error dismissing alert:', error)
    }
  }

  const applyToJob = async (jobId: number, alertId: number) => {
    const coverLetter = prompt('Enter a brief cover letter (optional):')
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/opportunities/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          coverLetter: coverLetter || '',
          resumeUrl: '' // Can be enhanced to upload resume
        })
      })

      if (response.ok) {
        alert('Application submitted successfully!')
        // Remove the alert or mark as applied
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error applying to job:', error)
      alert('Failed to submit application. Please try again.')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'new_match': return '🎯'
      case 'score_update': return '📈'
      case 'deadline_reminder': return '⏰'
      default: return '💼'
    }
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified'
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    if (min) return `From $${min.toLocaleString()}`
    if (max) return `Up to $${max.toLocaleString()}`
    return 'Salary not specified'
  }

  const isDeadlineApproaching = (deadline?: string) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Opportunity Alerts</h1>
          <p className="text-gray-600 mt-2">Personalized job recommendations based on your profile</p>
        </div>

        {/* Actions & Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Alerts</option>
                <option value="unviewed">Unviewed</option>
                <option value="high_match">High Match (70%+)</option>
              </select>
            </div>

            <button
              onClick={generateNewAlerts}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
              🔄 Find New Opportunities
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading opportunities...</p>
          </div>
        )}

        {/* No Alerts */}
        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No opportunities found. Try generating new alerts!</p>
          </div>
        )}

        {/* Alerts List */}
        {!isLoading && alerts.length > 0 && (
          <div className="space-y-6">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  !alert.is_viewed ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getAlertTypeIcon(alert.alert_type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{alert.job_title}</h3>
                      <p className="text-gray-600">{alert.company_name} • {alert.company_location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(alert.match_score)}`}>
                      {alert.match_score}% Match
                    </span>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Type:</span> {alert.employment_type}</p>
                      <p><span className="font-medium">Location:</span> {alert.location}</p>
                      <p><span className="font-medium">Industry:</span> {alert.industry}</p>
                      <p><span className="font-medium">Salary:</span> {formatSalary(alert.salary_min, alert.salary_max)}</p>
                      {alert.application_deadline && (
                        <p className={`${isDeadlineApproaching(alert.application_deadline) ? 'text-red-600 font-medium' : ''}`}>
                          <span className="font-medium">Deadline:</span> {new Date(alert.application_deadline).toLocaleDateString()}
                          {isDeadlineApproaching(alert.application_deadline) && ' ⚠️ Soon!'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">{alert.description}</p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => applyToJob(alert.job_id, alert.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to job details page (you can implement this)
                      window.open(`/jobs/${alert.job_id}`, '_blank')
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    View Details
                  </button>
                </div>

                {/* Alert metadata */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Alert created: {new Date(alert.created_at).toLocaleString()}
                    {!alert.is_viewed && <span className="ml-2 text-blue-600 font-medium">• New</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
