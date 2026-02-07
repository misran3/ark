import axios from 'axios';

/**
 * Axios instance for SynesthesiaPay API.
 * 
 * In development, this can be toggled to use local mocks by changing the 
 * baseURL or using an axios-mock-adapter.
 */
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for Auth (Cognito JWT)
api.interceptors.request.use((config) => {
  // In a real app, you'd pull the token from your auth state/session
  // const token = getAuthToken();
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

export default api;
