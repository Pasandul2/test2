// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Auth endpoints
    login: '/api/auth/login',
    register: '/api/auth/register',
    
    // Student endpoints
    studentDashboard: (userId: string) => `/api/flow/student/${userId}/dashboard-data`,
    completeAssessment: '/api/flow/student/complete-assessment',
    findOpportunities: '/api/matching/student/find-opportunities',
    
    // Pathway endpoints
    generatePathways: '/api/pathways/generate',
    getPathways: (studentId: string) => `/api/pathways/student/${studentId}`,
    pathwayFeedback: '/api/pathways/feedback',
    
    // Employer endpoints
    employerDashboard: (employerId: string) => `/api/flow/employer/${employerId}/dashboard-data`,
    employerSetup: '/api/flow/employer/setup-complete',
    generateMatches: '/api/matching/employer/generate',
    
    // Demo endpoints
    processFlow: '/api/demo/process-flow',
    testFlow: '/api/demo/test-complete-flow'
  }
};

// Helper function to make API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          window.location.href = '/login';
        }
        throw new Error('Unauthorized');
      }
      
      // For other errors, let the calling code handle the response
      throw { response, status: response.status };
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export default apiConfig;
