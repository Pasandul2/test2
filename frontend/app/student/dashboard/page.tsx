'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { apiCall, apiConfig } from '@/lib/apiConfig'

interface DashboardStats {
  total_pathways: number;
  total_opportunities: number;
  top_compatibility_score: number;
  profile_completeness: number;
  applied_jobs: number;
  saved_jobs: number;
  interview_invitations: number;
}

interface RecommendedJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  compatibility_score: number;
  salary_range: string;
  posted_date: string;
  deadline: string;
  skills_match: string[];
  skills_gap: string[];
  description: string;
  application_status: 'not_applied' | 'applied' | 'interview' | 'offer' | 'rejected';
  is_saved: boolean;
}

interface RecentActivity {
  id: string;
  type: 'assessment' | 'pathway' | 'application' | 'interview' | 'job_view' | 'skill_progress';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'scheduled';
}

interface Pathway {
  id: string;
  title: string;
  description: string;
  feasibility_score: number;
  status: 'recommended' | 'in_progress' | 'completed';
  next_milestone?: string;
}

interface SkillGap {
  skill_name: string;
  current_level: number;
  required_level: number;
  importance: 'high' | 'medium' | 'low';
  learning_resources: string[];
}

interface DashboardData {
  stats: DashboardStats;
  recent_activities: RecentActivity[];
  active_pathways: Pathway[];
  recommended_jobs: RecommendedJob[];
  urgent_deadlines: RecommendedJob[];
  skill_gaps: SkillGap[];
}

export default function StudentDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      
      if (!token || !user) {
        router.push('/login')
        return
      }

      const userData = JSON.parse(user)
      const userId = userData.id

      try {
        const result = await apiCall(apiConfig.endpoints.studentDashboard(userId))
        setData(result.data)
      } catch (error) {
        console.warn('API call failed, using mock data:', error)
        // Enhanced mock data with job recommendations
        setData({
          stats: {
            total_pathways: 4,
            total_opportunities: 25,
            top_compatibility_score: 87,
            profile_completeness: 85,
            applied_jobs: 5,
            saved_jobs: 8,
            interview_invitations: 3
          },
          recent_activities: [
            {
              id: '1',
              type: 'assessment',
              title: 'Completed Skills Assessment',
              description: 'Evaluated technical and soft skills',
              timestamp: new Date().toISOString(),
              status: 'completed'
            },
            {
              id: '2',
              type: 'pathway',
              title: 'Career Pathway Generated',
              description: 'AI-powered pathway recommendations created',
              timestamp: new Date().toISOString(),
              status: 'completed'
            }
          ],
          active_pathways: [
            {
              id: '1',
              title: 'Direct Entry Career Path',
              description: 'Enter the Computer Science field directly after graduation',
              feasibility_score: 85,
              status: 'recommended',
              next_milestone: 'Complete portfolio project'
            },
            {
              id: '2',
              title: 'Skill Enhancement Path',
              description: 'Focus on developing specific skills before entering the job market',
              feasibility_score: 92,
              status: 'in_progress',
              next_milestone: 'Complete Python certification'
            }
          ],
          recommended_jobs: [
            {
              id: '1',
              title: 'Junior Software Developer',
              company_name: 'TechCorp Inc.',
              location: 'Remote',
              employment_type: 'full-time',
              compatibility_score: 87,
              salary_range: '$60,000 - $75,000',
              posted_date: '2025-08-28',
              deadline: '2025-09-15',
              skills_match: ['JavaScript', 'React', 'Python'],
              skills_gap: ['Node.js', 'Docker'],
              description: 'Join our innovative team as a Junior Software Developer and work on cutting-edge web applications. You will collaborate with senior developers to build scalable solutions and contribute to our growing platform.',
              application_status: 'not_applied',
              is_saved: false
            },
            {
              id: '2',
              title: 'Frontend Developer Intern',
              company_name: 'StartupXYZ',
              location: 'New York, NY',
              employment_type: 'internship',
              compatibility_score: 82,
              salary_range: '$25/hour',
              posted_date: '2025-08-30',
              deadline: '2025-09-20',
              skills_match: ['HTML', 'CSS', 'JavaScript', 'React'],
              skills_gap: ['TypeScript', 'Redux'],
              description: 'Exciting internship opportunity to work with our frontend team on modern web applications. Great learning experience with mentorship from senior developers.',
              application_status: 'applied',
              is_saved: true
            },
            {
              id: '3',
              title: 'Data Analyst Trainee',
              company_name: 'DataSoft Solutions',
              location: 'San Francisco, CA',
              employment_type: 'full-time',
              compatibility_score: 75,
              salary_range: '$55,000 - $65,000',
              posted_date: '2025-09-01',
              deadline: '2025-09-25',
              skills_match: ['Python', 'SQL', 'Excel'],
              skills_gap: ['Tableau', 'Machine Learning'],
              description: 'Entry-level position for recent graduates interested in data analysis. You will work with large datasets and create insights that drive business decisions.',
              application_status: 'not_applied',
              is_saved: false
            },
            {
              id: '4',
              title: 'UI/UX Designer',
              company_name: 'Creative Agency',
              location: 'Remote',
              employment_type: 'contract',
              compatibility_score: 68,
              salary_range: '$40/hour',
              posted_date: '2025-09-02',
              deadline: '2025-09-18',
              skills_match: ['Figma', 'Adobe Creative Suite'],
              skills_gap: ['User Research', 'Prototyping'],
              description: 'Contract position for a creative UI/UX designer to work on various client projects. Portfolio review required.',
              application_status: 'interview',
              is_saved: true
            },
            {
              id: '5',
              title: 'Full Stack Developer',
              company_name: 'Innovate Labs',
              location: 'Austin, TX',
              employment_type: 'full-time',
              compatibility_score: 90,
              salary_range: '$70,000 - $85,000',
              posted_date: '2025-09-01',
              deadline: '2025-09-22',
              skills_match: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
              skills_gap: ['AWS', 'GraphQL'],
              description: 'Seeking a passionate full stack developer to join our dynamic team. Work on exciting projects using modern technologies and agile methodologies.',
              application_status: 'not_applied',
              is_saved: false
            }
          ],
          urgent_deadlines: [
            {
              id: '1',
              title: 'Junior Software Developer',
              company_name: 'TechCorp Inc.',
              location: 'Remote',
              employment_type: 'full-time',
              compatibility_score: 87,
              salary_range: '$60,000 - $75,000',
              posted_date: '2025-08-28',
              deadline: '2025-09-15',
              skills_match: ['JavaScript', 'React', 'Python'],
              skills_gap: ['Node.js', 'Docker'],
              description: 'Exciting opportunity for a junior developer...',
              application_status: 'not_applied',
              is_saved: false
            }
          ],
          skill_gaps: [
            {
              skill_name: 'React',
              current_level: 3,
              required_level: 4,
              importance: 'high',
              learning_resources: ['React Official Docs', 'FreeCodeCamp React Course', 'React Testing Library']
            },
            {
              skill_name: 'Node.js',
              current_level: 2,
              required_level: 4,
              importance: 'medium',
              learning_resources: ['Node.js Official Docs', 'Express.js Tutorial', 'MongoDB University']
            }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    if (!data) return;
    
    const updatedJobs = data.recommended_jobs.map(job => 
      job.id === jobId ? { ...job, is_saved: !job.is_saved } : job
    );
    
    setData({
      ...data,
      recommended_jobs: updatedJobs,
      stats: {
        ...data.stats,
        saved_jobs: updatedJobs.filter(job => job.is_saved).length
      }
    });
    
    // TODO: Make API call to save/unsave job
  };

  const handleApplyJob = async (jobId: string) => {
    if (!data) return;
    
    const updatedJobs = data.recommended_jobs.map(job => 
      job.id === jobId ? { ...job, application_status: 'applied' as const } : job
    );
    
    setData({
      ...data,
      recommended_jobs: updatedJobs,
      stats: {
        ...data.stats,
        applied_jobs: data.stats.applied_jobs + 1
      }
    });
    
    // TODO: Make API call to apply to job
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getApplicationStatusBadge = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800'
      case 'interview': return 'bg-purple-100 text-purple-800'
      case 'offer': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'offer': return 'bg-green-100 text-green-800'
      case 'interview': return 'bg-blue-100 text-blue-800'
      case 'applied': return 'bg-yellow-100 text-yellow-800'
      case 'not_applied': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Track your career journey and opportunities</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/student/skills-assessment')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Update Assessment
              </button>
              <button
                onClick={() => router.push('/student/pathways')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                View Pathways
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
        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Career Pathways</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.total_pathways}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 14v.01M12 14v.01M16 14v.01" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Job Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.total_opportunities}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Match Score</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.top_compatibility_score}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.profile_completeness}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applied Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.applied_jobs}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.saved_jobs}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Interview Invites</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.interview_invitations}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Pathways */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Active Career Pathways</h2>
              </div>
              <div className="p-6">
                {data?.active_pathways && data.active_pathways.length > 0 ? (
                  <div className="space-y-4">
                    {data.active_pathways.map((pathway) => (
                      <div key={pathway.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                           onClick={() => router.push('/student/pathways')}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{pathway.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(pathway.status)}`}>
                              {pathway.status.replace('_', ' ')}
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                              {pathway.feasibility_score}% feasible
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{pathway.description}</p>
                        {pathway.next_milestone && (
                          <p className="text-blue-600 text-sm">
                            Next: {pathway.next_milestone}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No active pathways yet</p>
                    <button
                      onClick={() => router.push('/student/skills-assessment')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Take Skills Assessment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Opportunities */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Recommended Job Opportunities</h2>
                  <button
                    onClick={() => router.push('/student/opportunities')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Jobs
                  </button>
                </div>
              </div>
              <div className="p-6">
                {data?.recommended_jobs && data.recommended_jobs.length > 0 ? (
                  <div className="space-y-6">
                    {data.recommended_jobs.slice(0, 3).map((job) => (
                      <motion.div 
                        key={job.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                            <p className="text-blue-600 font-medium">{job.company_name}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 14v.01M12 14v.01M16 14v.01" />
                                </svg>
                                {job.employment_type}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {job.salary_range}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(job.compatibility_score)}`}>
                              {job.compatibility_score}% match
                            </div>
                            <div className="mt-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getApplicationStatusBadge(job.application_status)}`}>
                                {job.application_status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Job Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

                        {/* Skills Match/Gap */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-700">Matching Skills:</span>
                            {job.skills_match.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                          {job.skills_gap.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs font-medium text-gray-700">Skills to Learn:</span>
                              {job.skills_gap.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center justify-between">
                          <p className="text-red-600 text-sm font-medium">
                            Application Deadline: {new Date(job.deadline).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Posted: {new Date(job.posted_date).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex space-x-2">
                            {job.application_status === 'not_applied' ? (
                              <button
                                onClick={() => handleApplyJob(job.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Apply Now
                              </button>
                            ) : (
                              <span className="text-green-600 text-sm font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Applied
                              </span>
                            )}
                            <button
                              onClick={() => handleSaveJob(job.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                job.is_saved 
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {job.is_saved ? (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                  </svg>
                                  Saved
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  Save Job
                                </span>
                              )}
                            </button>
                          </div>
                          <button
                            onClick={() => router.push(`/student/opportunities/${job.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Details →
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* View More Button */}
                    {data.recommended_jobs.length > 3 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => router.push('/student/opportunities')}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          View {data.recommended_jobs.length - 3} More Opportunities
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 14v.01M12 14v.01M16 14v.01" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities available</h3>
                    <p className="mt-1 text-sm text-gray-500">Complete your skills assessment to get personalized job recommendations.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => router.push('/student/skills-assessment')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Take Skills Assessment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Application Tracking */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">My Applications</h2>
              </div>
              <div className="p-6">
                {data?.stats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{data.stats.applied_jobs || 0}</div>
                          <div className="text-sm text-blue-800">Applications Sent</div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{data.stats.interview_invitations || 0}</div>
                          <div className="text-sm text-purple-800">Interview Invites</div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {data.recommended_jobs?.filter(job => job.application_status === 'offer').length || 0}
                          </div>
                          <div className="text-sm text-green-800">Job Offers</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Application Timeline */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Recent Applications</h3>
                      {data.recommended_jobs?.filter(job => job.application_status !== 'not_applied').length > 0 ? (
                        data.recommended_jobs.filter(job => job.application_status !== 'not_applied').map((job, index) => (
                          <div key={job.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              job.application_status === 'offer' ? 'bg-green-500' :
                              job.application_status === 'interview' ? 'bg-purple-500' :
                              job.application_status === 'applied' ? 'bg-blue-500' :
                              'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">{job.company_name}</div>
                            </div>
                            <div className="text-right">
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getApplicationStatusBadge(job.application_status)}`}>
                                {job.application_status.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-500">2 days ago</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No applications yet. Start applying to see your progress here!
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading application data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Job Alerts & Notifications */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Job Alerts</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">3 New Matching Jobs</p>
                        <p className="text-sm text-blue-600">Check out the latest opportunities that match your skills!</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-800">Application Deadlines</p>
                        <p className="text-sm text-yellow-600">2 applications closing in 3 days</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Profile Updated</p>
                        <p className="text-sm text-green-600">Your skills assessment improved your match score!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                {data?.recent_activities && data.recent_activities.length > 0 ? (
                  <div className="space-y-4">
                    {data.recent_activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                          <div className="w-2 h-2 bg-current rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">{activity.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
            </div>

            {/* Career Progress */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Career Progress</h2>
              </div>
              <div className="p-6">
                {data?.stats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Profile Completeness</span>
                        <span className="text-gray-500">{data.stats.profile_completeness || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${data.stats.profile_completeness || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Skills Assessment</span>
                        <span className="text-gray-500">90%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Application Success Rate</span>
                        <span className="text-gray-500">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2 text-sm">Loading progress...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Skill Gaps */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Skill Development</h2>
              </div>
              <div className="p-6">
                {data?.skill_gaps && data.skill_gaps.length > 0 ? (
                  <div className="space-y-4">
                    {data.skill_gaps.slice(0, 3).map((gap, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">{gap.skill_name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            gap.importance === 'high' ? 'bg-red-100 text-red-800' :
                            gap.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {gap.importance}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(gap.current_level / gap.required_level) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Current: {gap.current_level}</span>
                          <span>Target: {gap.required_level}</span>
                        </div>
                        <button className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                          View Learning Resources →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No skill gaps identified</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => router.push('/student/skills-assessment')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Update Skills Assessment</div>
                      <div className="text-sm text-gray-500">Refresh your profile data</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/student/pathways')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Explore Career Pathways</div>
                      <div className="text-sm text-gray-500">Discover new opportunities</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/student/opportunities')}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 14v.01M12 14v.01M16 14v.01" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Browse All Jobs</div>
                      <div className="text-sm text-gray-500">Find matching positions</div>
                    </div>
                  </div>
                </button>
                <button
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">Learning Resources</div>
                      <div className="text-sm text-gray-500">Improve your skills</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
