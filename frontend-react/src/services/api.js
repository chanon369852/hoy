import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token from localStorage if exists
const token = localStorage.getItem('userToken')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

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



