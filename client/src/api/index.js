import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../context/AuthContext';

const PROD_API_URL = 'https://asset-surprised-panda.abasthan.app';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1');

  if (isProduction) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return PROD_API_URL;
    }
    return envUrl;
  }
  return envUrl || 'http://localhost:5000';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor: attach JWT token if present in localStorage and ensure production URL on production hosts
api.interceptors.request.use((config) => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (!config.baseURL || config.baseURL.includes('localhost') || config.baseURL.includes('127.0.0.1')) {
      config.baseURL = PROD_API_URL;
    }
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle 401 Unauthorized by logging out and redirecting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Only redirect if not already on the login page to avoid erasing login form error messages
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Public APIs
export const getStations      = ()           => api.get('/api/stations');
export const getStationById   = (id)         => api.get(`/api/stations/${id}`);
export const getStationNodes  = (id, params) => api.get(`/api/stations/${id}/nodes`, { params });
export const getStationEdges  = (id)         => api.get(`/api/stations/${id}/edges`);
export const getRoute         = (params)     => api.get('/api/route',   { params });
export const getNearest       = (params)     => api.get('/api/nearest', { params });

// Auth APIs
export const loginAdmin       = (credentials)=> api.post('/api/auth/login', credentials);

// Admin Station APIs
export const createStation    = (data)       => api.post('/api/stations', data);
export const updateStation    = (id, data)   => api.put(`/api/stations/${id}`, data);
export const deleteStation    = (id)         => api.delete(`/api/stations/${id}`);

// Admin Node APIs
export const createNode       = (data)       => api.post('/api/nodes', data);
export const updateNode       = (id, data)   => api.put(`/api/nodes/${id}`, data);
export const deleteNode       = (id)         => api.delete(`/api/nodes/${id}`);

// Admin Edge APIs
export const createEdge       = (data)       => api.post('/api/edges', data);
export const updateEdge       = (id, data)   => api.put(`/api/edges/${id}`, data);
export const deleteEdge       = (id)         => api.delete(`/api/edges/${id}`);

export default api;
