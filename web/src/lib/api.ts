import axios from 'axios';

/**
 * SynesthesiaPay API Base URL
 * 
 * Production endpoint deployed on AWS API Gateway.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hpjg3vun6j.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Axios instance for SynesthesiaPay API.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for Auth (Cognito JWT) - currently disabled for testing
api.interceptors.request.use((config) => {
  // In a real app, you'd pull the token from your auth state/session
  // const token = getAuthToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default api;
