'use client';

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Smart Pathway Decider
              </Link>
              <div className="ml-10 flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
                <Link href="/about" className="text-blue-600 font-medium">About</Link>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About Smart Pathway Decider
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering students and connecting employers through AI-driven career pathway recommendations 
            and intelligent job matching.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-8 mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-gray-700 text-center max-w-4xl mx-auto leading-relaxed">
            To bridge the gap between education and employment by providing students with personalized 
            career guidance and helping employers find the best talent through advanced AI-powered 
            matching algorithms.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          {/* For Students */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">For Students</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• AI-powered career pathway recommendations</li>
              <li>• Personalized job matching based on skills</li>
              <li>• Skills assessment and gap analysis</li>
              <li>• Application tracking and management</li>
              <li>• Career development resources</li>
            </ul>
          </div>

          {/* For Employers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">For Employers</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Easy job posting and management</li>
              <li>• AI-matched candidate recommendations</li>
              <li>• Skills-based candidate filtering</li>
              <li>• Application and interview management</li>
              <li>• Analytics and hiring insights</li>
            </ul>
          </div>

          {/* AI Technology */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Technology</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Machine learning compatibility scoring</li>
              <li>• Natural language processing</li>
              <li>• Predictive career pathway analysis</li>
              <li>• Intelligent matching algorithms</li>
              <li>• Continuous learning and improvement</li>
            </ul>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-8 mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile & Assessment</h3>
              <p className="text-gray-600">
                Students complete comprehensive skills assessments and build detailed profiles
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes profiles and job requirements to create personalized matches
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect & Grow</h3>
              <p className="text-gray-600">
                Students and employers connect, interview, and build successful career paths
              </p>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md p-8 text-white mb-12"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Platform Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">Students Registered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Partner Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2,500+</div>
              <div className="text-blue-100">Successful Placements</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-xl shadow-md p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started Today</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students and employers who are already using Smart Pathway Decider 
            to build successful careers and find the right talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/student/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Join as Student
            </Link>
            <Link 
              href="/employer/register" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Join as Employer
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
