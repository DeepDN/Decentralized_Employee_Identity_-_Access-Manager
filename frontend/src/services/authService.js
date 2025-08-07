import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  async validateToken(token) {
    try {
      const response = await this.api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data.user
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh')
      return response.data
    } catch (error) {
      throw new Error('Token refresh failed')
    }
  }

  logout() {
    localStorage.removeItem('authToken')
  }
}

export const authService = new AuthService()
