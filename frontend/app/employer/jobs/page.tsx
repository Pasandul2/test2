'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface JobPosting {
  id: number
  title: string
  description: string
  location: string
  employment_type: string
  experience_level: string
  salary_min: number
  salary_max: number
  remote_allowed: boolean
  application_deadline: string
  skills: string[]
  benefits: string[]
  is_active: boolean
  created_at: string
  applications_count?: number
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, active, draft, expired

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Please log in to view your jobs')
        setIsLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/jobs/employer/my-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch jobs')
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleJobStatus = async (jobId: number, is_active: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !is_active })
      })

      if (response.ok) {
        // Update local state
        setJobs(prevJobs => 
          prevJobs.map(job => 
            job.id === jobId ? { ...job, is_active: !is_active } : job
          )
        )
      } else {
        alert('Failed to update job status')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('Failed to update job status')
    }
  }

  const deleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId))
        alert('Job deleted successfully')
      } else {
        alert('Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    if (filter === 'active') return job.is_active
    if (filter === 'draft') return !job.is_active
    if (filter === 'expired') {
      const deadline = new Date(job.application_deadline)
      return deadline < new Date()
    }
    return true
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const formatSalary = (min: number, max: number) => {
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`
    } else if (min) {
      return `$${min.toLocaleString()}+`
    } else {
      return 'Salary not specified'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isExpired = (deadline: string) => {
    return new Date(deadline) < new Date()
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
                <Link href="/employer/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/employer/jobs" className="text-blue-600 font-medium">Manage Jobs</Link>
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Manage Jobs</h2>
            <p className="text-gray-600 mt-2">View and manage all your job postings</p>
          </div>
          <Link 
            href="/employer/jobs/post" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Post New Job</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({jobs.filter(j => j.is_active).length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'draft' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Drafts ({jobs.filter(j => !j.is_active).length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'expired' 
                  ? 'bg-red-100 text-red-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Expired ({jobs.filter(j => isExpired(j.application_deadline)).length})
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading jobs...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchJobs}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs found`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Start by posting your first job to attract talented candidates.'
                : `You don't have any ${filter} jobs at the moment.`
              }
            </p>
            <Link 
              href="/employer/jobs/post"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Post Your First Job</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.is_active ? 'Active' : 'Draft'}
                        </span>
                        {isExpired(job.application_deadline) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.employment_type}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {formatSalary(job.salary_min, job.salary_max)}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Deadline: {formatDate(job.application_deadline)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {job.applications_count !== undefined && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {job.applications_count} applicants
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            +{job.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Posted {formatDate(job.created_at)}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/employer/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => toggleJobStatus(job.id, job.is_active)}
                        className={`font-medium text-sm ${
                          job.is_active 
                            ? 'text-yellow-600 hover:text-yellow-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {job.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link
                        href={`/employer/jobs/${job.id}/edit`}
                        className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
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
