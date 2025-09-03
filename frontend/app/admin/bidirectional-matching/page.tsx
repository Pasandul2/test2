'use client';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MatchingStats {
  total_matches: number
  contacted_matches: number
  active_jobs: number
  alerts_sent: number
  successful_matches: number
}

interface MatchSuccess {
  id: number
  employer_id: number
  student_id: number
  job_id: number
  match_score: number
  employer_accepted_at: string | null
  student_accepted_at: string | null
  interview_scheduled_at: string | null
  final_status: string
  job_title: string
  student_name: string
  company_name: string
  created_at: string
}

interface DashboardData {
  employer_stats?: MatchingStats[]
  student_stats?: MatchingStats[]
  system_stats?: {
    total_matches_generated: number
    total_alerts_sent: number
    total_applications: number
    total_successful_matches: number
    total_hires: number
    avg_compatibility_score: number
  }
  statistics: {
    total_matches: number
    pending_matches: number
    interview_ready: number
    interviewed: number
    hired: number
    declined: number
    avg_match_score: number
  }
  recent_matches: MatchSuccess[]
}

export default function BidirectionalMatchingDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState<string>('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserType(user.userType || '')
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Fetch bidirectional dashboard data
      const dashboardResponse = await fetch('http://localhost:5000/api/matches/bidirectional-dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Fetch success statistics
      const statsResponse = await fetch('http://localhost:5000/api/matches/success-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dashboardResponse.ok && statsResponse.ok) {
        const dashboardData = await dashboardResponse.json()
        const statsData = await statsResponse.json()
        
        setDashboardData({
          ...dashboardData.data,
          ...statsData.data
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const recordMatchAction = async (studentId: number, jobId: number, action: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/matches/record-success', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          otherPartyId: studentId,
          jobId,
          action
        })
      })

      if (response.ok) {
        alert(`Match ${action} recorded successfully!`)
        fetchDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error recording match action:', error)
      alert('Failed to record action. Please try again.')
    }
  }

  const scheduleInterview = async (studentId: number, jobId: number) => {
    const interviewDate = prompt('Enter interview date and time (YYYY-MM-DD HH:MM):')
    if (!interviewDate) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/matches/schedule-interview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          jobId,
          interviewDateTime: interviewDate,
          notes: ''
        })
      })

      if (response.ok) {
        alert('Interview scheduled successfully!')
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
      alert('Failed to schedule interview. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'interview_ready': return 'bg-blue-100 text-blue-800'
      case 'interviewed': return 'bg-purple-100 text-purple-800'
      case 'hired': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading bidirectional matching dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bidirectional Matching Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {userType === 'employer' ? 'Employer-Student Matching Overview' : 
             userType === 'student' ? 'Your Opportunity Matches' : 'System-wide Matching Statistics'}
          </p>
        </div>

        {/* Statistics Cards */}
        {dashboardData?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Total Matches</h3>
              <p className="text-3xl font-bold text-indigo-600">{dashboardData.statistics.total_matches}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Interview Ready</h3>
              <p className="text-3xl font-bold text-blue-600">{dashboardData.statistics.interview_ready}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Successful Hires</h3>
              <p className="text-3xl font-bold text-green-600">{dashboardData.statistics.hired}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Avg Match Score</h3>
              <p className="text-3xl font-bold text-purple-600">{Math.round(dashboardData.statistics.avg_match_score || 0)}%</p>
            </motion.div>
          </div>
        )}

        {/* System Statistics for Admin */}
        {dashboardData?.system_stats && userType === 'admin' && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">System-wide Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Matches Generated</p>
                <p className="text-2xl font-bold text-indigo-600">{dashboardData.system_stats.total_matches_generated}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Alerts Sent</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.system_stats.total_alerts_sent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.system_stats.total_applications}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful Matches</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardData.system_stats.total_successful_matches}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Hires</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.system_stats.total_hires}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Compatibility</p>
                <p className="text-2xl font-bold text-pink-600">{Math.round(dashboardData.system_stats.avg_compatibility_score || 0)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {dashboardData?.recent_matches && dashboardData.recent_matches.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Recent Matches</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.recent_matches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{match.job_title}</h3>
                          <p className="text-gray-600">{match.company_name} • {match.student_name}</p>
                          <p className="text-sm text-gray-500">
                            Match Score: {match.match_score}% • 
                            Created: {new Date(match.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.final_status)}`}>
                        {match.final_status.replace('_', ' ')}
                      </span>
                      
                      {userType === 'employer' && match.final_status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => recordMatchAction(match.student_id, match.job_id, 'accept')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => recordMatchAction(match.student_id, match.job_id, 'decline')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      {userType === 'employer' && match.final_status === 'interview_ready' && !match.interview_scheduled_at && (
                        <button
                          onClick={() => scheduleInterview(match.student_id, match.job_id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Schedule Interview
                        </button>
                      )}
                      
                      {match.interview_scheduled_at && (
                        <div className="text-sm text-gray-600">
                          Interview: {new Date(match.interview_scheduled_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {!dashboardData?.recent_matches?.length && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No matching data found. Start by generating some matches!</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
              Refresh Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
