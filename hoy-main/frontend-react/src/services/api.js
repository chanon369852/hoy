import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // This will be proxied to http://localhost:5000/api by Vite
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Important for cookies, if using sessions
});

// Add request interceptor to attach token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('userToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api



