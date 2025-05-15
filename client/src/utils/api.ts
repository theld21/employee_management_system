import axios from 'axios';
import Cookies from 'js-cookie';

// API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

console.log('Creating API instance with base URL:', `${API_BASE_URL}/api`);

// Create axios instance with base URL including /api path
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add request interceptor to add auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration, redirect to login, etc.
    if (error.response && error.response.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 