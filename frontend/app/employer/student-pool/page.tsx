'use client';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface StudentMatch {
  student_id: number
  student_name: string
  compatibility_score: number
  score_breakdown: {
    skills: number
    education: number
    experience: number
    location: number
    availability: number
    cultural_fit: number
  }
  match_reasons: string[]
  potential_concerns: string[]
  student_profile: {
    field_of_study: string
    graduation_year: number
    location_preference: string
    employment_type: string
    university?: string
    study_level?: string
  }
  contact_status?: 'pending' | 'contacted' | 'interviewed' | 'hired'
}

interface MatchingStats {
  total_candidates: number
  high_compatibility: number
  medium_compatibility: number
  low_compatibility: number
  avg_score: number
}

export default function StudentPoolAnalysis() {
  const [matches, setMatches] = useState<StudentMatch[]>([])
  const [stats, setStats] = useState<MatchingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<string>('all')
  const [filterScore, setFilterScore] = useState<number>(0)
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    fetchMatches()
    fetchJobs()
  }, [selectedJob, filterScore])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/jobs/employer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchMatches = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id
      
      // Use the matching service to generate matches
      const response = await fetch('http://localhost:5000/api/matching/employer/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          jobId: selectedJob !== 'all' ? parseInt(selectedJob) : null 
        })
      })

      if (response.ok) {
        const data = await response.json()
        let filteredMatches = data.data.matches || []
        
        // Apply score filter
        if (filterScore > 0) {
          filteredMatches = filteredMatches.filter((match: StudentMatch) => 
            match.compatibility_score >= filterScore
          )
        }

        setMatches(filteredMatches)

        // Calculate stats
        const total = filteredMatches.length
        const high = filteredMatches.filter((m: StudentMatch) => m.compatibility_score >= 70).length
        const medium = filteredMatches.filter((m: StudentMatch) => m.compatibility_score >= 40 && m.compatibility_score < 70).length
        const low = filteredMatches.filter((m: StudentMatch) => m.compatibility_score < 40).length
        const avg = total > 0 ? filteredMatches.reduce((sum: number, m: StudentMatch) => sum + m.compatibility_score, 0) / total : 0

        setStats({
          total_candidates: total,
          high_compatibility: high,
          medium_compatibility: medium,
          low_compatibility: low,
          avg_score: Math.round(avg)
        })
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactStudent = async (studentId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/matching/contact-student', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId })
      })

      if (response.ok) {
        // Update local state to show contacted status
        setMatches(prev => prev.map(match => 
          match.student_id === studentId 
            ? { ...match, contact_status: 'contacted' }
            : match
        ))
        alert('Student contact recorded successfully!')
      }
    } catch (error) {
      console.error('Error contacting student:', error)
      alert('Failed to record contact. Please try again.')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'interviewed': return 'bg-purple-100 text-purple-800'
      case 'hired': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Student Pool Analysis</h1>
          <p className="text-gray-600 mt-2">Bidirectional matching results and candidate overview</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Posting
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Positions</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id.toString()}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Compatibility Score
              </label>
              <select
                value={filterScore}
                onChange={(e) => setFilterScore(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={0}>All Scores</option>
                <option value={70}>High (70%+)</option>
                <option value={40}>Medium (40%+)</option>
                <option value={30}>Low (30%+)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchMatches}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              >
                Refresh Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Total Candidates</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_candidates}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">High Match</h3>
              <p className="text-3xl font-bold text-green-600">{stats.high_compatibility}</p>
              <p className="text-sm text-gray-500">70%+ compatibility</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Medium Match</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.medium_compatibility}</p>
              <p className="text-sm text-gray-500">40-69% compatibility</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Low Match</h3>
              <p className="text-3xl font-bold text-red-600">{stats.low_compatibility}</p>
              <p className="text-sm text-gray-500">Below 40%</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h3 className="text-lg font-medium text-gray-900">Average Score</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.avg_score}%</p>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Analyzing student pool...</p>
          </div>
        )}

        {/* Student Matches */}
        {!isLoading && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No matching students found. Try adjusting your filters.</p>
          </div>
        )}

        {!isLoading && matches.length > 0 && (
          <div className="space-y-6">
            {matches.map((match, index) => (
              <motion.div
                key={match.student_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Student Info */}
                  <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{match.student_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.compatibility_score)}`}>
                        {match.compatibility_score}% Match
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Field:</span> {match.student_profile.field_of_study}</p>
                      <p><span className="font-medium">University:</span> {match.student_profile.university}</p>
                      <p><span className="font-medium">Level:</span> {match.student_profile.study_level}</p>
                      <p><span className="font-medium">Location:</span> {match.student_profile.location_preference}</p>
                      <p><span className="font-medium">Employment:</span> {match.student_profile.employment_type}</p>
                      {match.contact_status && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match.contact_status)}`}>
                          {match.contact_status}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleContactStudent(match.student_id)}
                      disabled={match.contact_status === 'contacted'}
                      className="mt-4 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      {match.contact_status === 'contacted' ? 'Contacted' : 'Contact Student'}
                    </button>
                  </div>

                  {/* Score Breakdown */}
                  <div className="lg:col-span-1">
                    <h4 className="font-medium text-gray-900 mb-4">Compatibility Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(match.score_breakdown).map(([category, score]) => (
                        <div key={category}>
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                            <span>{score}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreColor(score).includes('green') ? 'bg-green-500' : 
                                getScoreColor(score).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Match Reasons & Concerns */}
                  <div className="lg:col-span-1">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Match Reasons</h4>
                      <ul className="space-y-1">
                        {match.match_reasons.map((reason, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start">
                            <span className="text-green-500 mr-2">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {match.potential_concerns && match.potential_concerns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Considerations</h4>
                        <ul className="space-y-1">
                          {match.potential_concerns.map((concern, idx) => (
                            <li key={idx} className="text-sm text-yellow-700 flex items-start">
                              <span className="text-yellow-500 mr-2">⚠</span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
