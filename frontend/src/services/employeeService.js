import { authService } from './authService'

class EmployeeService {
  constructor() {
    this.api = authService.api
  }

  async createEmployee(employeeData) {
    try {
      const response = await this.api.post('/employees', employeeData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create employee')
    }
  }

  async getEmployees(limit = 50, lastEvaluatedKey = null) {
    try {
      const params = { limit }
      if (lastEvaluatedKey) {
        params.lastEvaluatedKey = JSON.stringify(lastEvaluatedKey)
      }
      
      const response = await this.api.get('/employees', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch employees')
    }
  }

  async getEmployee(employeeId) {
    try {
      const response = await this.api.get(`/employees/${employeeId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch employee')
    }
  }

  async updateEmployee(employeeId, updates) {
    try {
      const response = await this.api.put(`/employees/${employeeId}`, updates)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update employee')
    }
  }

  async deleteEmployee(employeeId, reason) {
    try {
      const response = await this.api.delete(`/employees/${employeeId}`, {
        data: { reason }
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete employee')
    }
  }

  async getEmployeeCredentials(employeeId) {
    try {
      const response = await this.api.get(`/employees/${employeeId}/credentials`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch credentials')
    }
  }

  async issueAccessCredential(employeeId, accessData) {
    try {
      const response = await this.api.post(`/employees/${employeeId}/access-credentials`, accessData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to issue access credential')
    }
  }

  async getEmployeeDID(employeeId) {
    try {
      const response = await this.api.get(`/employees/${employeeId}/did`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch DID')
    }
  }
}

export const employeeService = new EmployeeService()
