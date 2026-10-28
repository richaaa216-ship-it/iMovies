import axios from 'axios';

/**
 * Dynamically determine API Base URL:
 * 1. Checks VITE_API_URL environment variable (e.g. http://localhost:5000/api)
 * 2. If running on localhost / 127.0.0.1, defaults to http://localhost:5000/api
 * 3. Falls back to production backend URL
 */
const resolveBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api';
  }

  return 'https://imovies1802.onrender.com/api';
};

const API = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach auth tokens and ensure clean URL resolution (preventing duplicate /api or missing /api)
API.interceptors.request.use(
  (config) => {
    // 1. Attach authentication tokens from localStorage
    const token = localStorage.getItem('imovies-user-token');
    const adminToken = localStorage.getItem('imovies-admin-token');
    if (token) {
      config.headers['auth-token'] = token;
    }
    if (adminToken) {
      config.headers['admin-token'] = adminToken;
    }

    // 2. Ensure /api is properly appended without duplication
    if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      const baseHasApi = config.baseURL && config.baseURL.replace(/\/+$/, '').endsWith('/api');
      const urlHasApi = config.url.replace(/^\/+/, '').startsWith('api/') || config.url === '/api' || config.url === 'api';

      if (baseHasApi && urlHasApi) {
        // Strip duplicate /api from relative URL if baseURL already contains /api
        config.url = config.url.replace(/^\/?api/, '');
        if (!config.url.startsWith('/')) {
          config.url = '/' + config.url;
        }
      } else if (!baseHasApi && !urlHasApi) {
        // Prepend /api to relative URL if baseURL does not contain /api
        const cleanUrl = config.url.startsWith('/') ? config.url : '/' + config.url;
        config.url = '/api' + cleanUrl;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
