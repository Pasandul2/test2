'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  remote_allowed: boolean;
  application_deadline?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_size: string;
  industry: string;
  company_location: string;
  company_description: string;
  required_skills?: Array<{
    id: number;
    name: string;
    category: string;
    required_level: string;
    is_required: boolean;
  }>;
}

interface Application {
  id: number;
  student_id: number;
  application_status: string;
  cover_letter: string;
  applied_at: string;
  student_name: string;
  student_email: string;
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchJobDetails();
    fetchApplications();
  }, [params.id]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/jobs/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setJob(data.data);
      } else {
        setError('Job not found');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to fetch job details');
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/jobs/${params.id}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: number, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/jobs/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setApplications(applications.map(app => 
          app.id === applicationId ? { ...app, application_status: status } : app
        ));
        alert('Application status updated successfully');
      } else {
        alert('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Failed to update application status');
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Salary not specified';
    if (!max) return `$${min?.toLocaleString()}+`;
    if (!min) return `Up to $${max?.toLocaleString()}`;
    return `$${min?.toLocaleString()} - $${max?.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/employer/jobs"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/employer/jobs" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
              ← Back to Jobs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-2">{job.company_name} • {job.location}</p>
          </div>
          <div className="flex space-x-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                job.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {job.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Job Details
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications ({applications.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
                </div>
              </div>

              {job.required_skills && job.required_skills.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map((skill) => (
                      <span
                        key={skill.id}
                        className={`px-3 py-1 rounded-full text-sm ${
                          skill.is_required
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {skill.name} ({skill.required_level})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Employment Type</label>
                    <p className="text-gray-900 capitalize">{job.employment_type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Experience Level</label>
                    <p className="text-gray-900 capitalize">{job.experience_level}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Salary Range</label>
                    <p className="text-gray-900">{formatSalary(job.salary_min, job.salary_max)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Remote Work</label>
                    <p className="text-gray-900">{job.remote_allowed ? 'Allowed' : 'Not allowed'}</p>
                  </div>
                  {job.application_deadline && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Application Deadline</label>
                      <p className="text-gray-900">{formatDate(job.application_deadline)}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Posted</label>
                    <p className="text-gray-900">{formatDate(job.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Company Size</label>
                    <p className="text-gray-900 capitalize">{job.company_size}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Industry</label>
                    <p className="text-gray-900 capitalize">{job.industry}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{job.company_location}</p>
                  </div>
                  {job.company_description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">About Company</label>
                      <p className="text-gray-700 text-sm">{job.company_description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow"
          >
            {applications.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600">Applications will appear here when candidates apply for this job.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => (
                      <tr key={application.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.student_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.student_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(application.applied_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              application.application_status === 'applied'
                                ? 'bg-blue-100 text-blue-800'
                                : application.application_status === 'reviewed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : application.application_status === 'interview'
                                ? 'bg-purple-100 text-purple-800'
                                : application.application_status === 'hired'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {application.application_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                              className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                            >
                              Review
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'interview')}
                              className="text-purple-600 hover:text-purple-900 text-xs bg-purple-50 px-2 py-1 rounded"
                            >
                              Interview
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'hired')}
                              className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded"
                            >
                              Hire
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
