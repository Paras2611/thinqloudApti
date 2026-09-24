import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://thinqloudapti.onrender.com/api');

// Normalize baseURL so it always points to the /api namespace
if (rawBase && !rawBase.endsWith('/api') && !rawBase.endsWith('/api/')) {
  rawBase = `${rawBase.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL: rawBase,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token from localStorage as fallback for non-cookie environments
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
