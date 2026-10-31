import axios from 'axios';

const getBaseURL = () => {
  const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const cleanUrl = String(rawUrl).trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('citimaids_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — only redirect to login on protected admin routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Only force-logout on protected routes, NOT on public endpoints like /services
      const isPublicRoute = url === '/services' || url.startsWith('/services?') || url === '/bookings' || url === '/reviews' || url.startsWith('/reviews');
      const isAdminRoute = window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login';
      
      if (!isPublicRoute && isAdminRoute) {
        localStorage.removeItem('citimaids_token');
        localStorage.removeItem('citimaids_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
