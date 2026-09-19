import axios from 'axios'

// Problem Service API
export const problemApi = axios.create({
  baseURL: import.meta.env.VITE_PROBLEM_SERVICE_URL || 'https://codearena-problem.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Execution Service API
export const executionApi = axios.create({
  baseURL: import.meta.env.VITE_EXECUTION_SERVICE_URL || 'https://codearena-execution-service.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Contest Service API
export const contestApi = axios.create({
  baseURL: import.meta.env.VITE_CONTEST_SERVICE_URL || 'https://codearena-rmpu.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Generic API (for backward compatibility)
export const api = problemApi

// Add token interceptor to all APIs
const addTokenInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

addTokenInterceptor(problemApi)
addTokenInterceptor(executionApi)
addTokenInterceptor(contestApi)

export default api
