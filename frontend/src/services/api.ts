import axios from 'axios';
import { supabase } from '../lib/supabase';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 120000, // Increase timeout to 2 minutes for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Get fresh token from Supabase session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Failed to get session:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with auto token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError || !session) {
          // Refresh failed, redirect to login
          console.error('Token refresh failed:', refreshError);
          // Clear session and redirect to auth page
          await supabase.auth.signOut();
          window.location.href = '/auth';
          return Promise.reject(error);
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        await supabase.auth.signOut();
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || 'An error occurred';
      console.error('API Error:', message);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;