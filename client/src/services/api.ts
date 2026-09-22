import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Generate a correlation ID if one doesn't exist to track request across systems
    if (!config.headers['X-Request-ID']) {
       config.headers['X-Request-ID'] = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Add a response interceptor to handle 401 and 403 errors globally
api.interceptors.response.use(
  (response) => {
    // We could capture response.headers['x-request-id'] here if needed for analytics
    return response;
  },
  (error) => {
    const requestId = error.response?.headers?.['x-request-id'] || error.config?.headers?.['X-Request-ID'];
    
    if (error.response && error.response.status === 401) {
      console.warn(`[Req: ${requestId}] Unauthorized. Redirecting to login.`);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response && error.response.status === 403) {
      console.error(`[Req: ${requestId}] Forbidden: You do not have permission for this action.`);
    } else {
      console.error(`[Req: ${requestId}] API Error:`, error.response?.data?.error?.message || error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
