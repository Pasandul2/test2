'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardStats {
  activeJobPosts: number
  candidateMatches: number
  applicationsToday: number
}

interface TopCandidate {
  id: string
  name: string
  matchScore: number
  skills: string
  careerGoal: string
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobPosts: 8,
    candidateMatches: 47,
    applicationsToday: 15
  })

  const [topCandidates] = useState<TopCandidate[]>([
    {
      id: '1',
      name: 'Sarah M.',
      matchScore: 94,
      skills: 'React, Node.js',
      careerGoal: 'Full-stack dev'
    },
    {
      id: '2',
      name: 'Mike L.',
      matchScore: 87,
      skills: 'Python, Data',
      careerGoal: 'Backend dev'
    },
    {
      id: '3',
      name: 'Anna K.',
      matchScore: 82,
      skills: 'UI/UX, JS',
      careerGoal: 'Frontend spec'
    }
  ])

  const handleLogout = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Smart Pathway Decider</h1>
              <div className="ml-10 flex space-x-8">
                <Link href="/employer/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
                <Link href="/employer/jobs" className="text-gray-600 hover:text-gray-900">Manage Jobs</Link>
                <Link href="/employer/student-pool" className="text-gray-600 hover:text-gray-900">Student Pool</Link>
                <Link href="/employer/analytics" className="text-gray-600 hover:text-gray-900">Analytics</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, TechCorp Inc!</h2>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ACTIVE JOB POSTS</p>
                <p className="text-3xl font-bold text-blue-600">{stats.activeJobPosts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">CANDIDATE MATCHES</p>
                <p className="text-3xl font-bold text-green-600">{stats.candidateMatches}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">APPLICATIONS TODAY</p>
                <p className="text-3xl font-bold text-purple-600">{stats.applicationsToday}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/employer/jobs/post" className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="font-medium">Post New Job</span>
              </Link>

              <Link href="/employer/jobs" className="flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="font-medium">Manage Jobs</span>
              </Link>

              <Link href="/employer/student-pool" className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-medium">Browse Student Pool</span>
              </Link>

              <Link href="/admin/bidirectional-matching" className="flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="font-medium">Matching Dashboard</span>
              </Link>
            </div>
          </motion.div>

          {/* Top AI-Matched Candidates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top AI-Matched Candidates</h3>
            <div className="space-y-4">
              {topCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{candidate.name.split(' ')[0][0]}{candidate.name.split(' ')[1] ? candidate.name.split(' ')[1][0] : ''}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{candidate.name}</p>
                      <p className="text-sm text-gray-600">{candidate.skills}</p>
                      <p className="text-sm text-gray-500">{candidate.careerGoal}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium mb-2">
                      {candidate.matchScore}%
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/employer/candidates" className="block text-center text-blue-600 hover:text-blue-700 mt-4 font-medium">
              View All Candidates →
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
