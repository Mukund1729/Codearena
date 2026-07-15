import api from './api'

export const submissionService = {
  submitCode: async (data) => {
    const response = await api.post('/submissions', data)
    return response.data
  },

  getSubmission: async (submissionId) => {
    const response = await api.get(`/submissions/${submissionId}`)
    return response.data
  },

  getUserSubmissions: async (params = {}) => {
    const response = await api.get('/submissions', { params })
    return response.data
  },
}
