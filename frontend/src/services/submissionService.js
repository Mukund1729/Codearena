import { submissionApi } from './api'

export const submissionService = {
  submitCode: async (data) => {
    const response = await submissionApi.post('/submissions', data)
    return response.data
  },

  getSubmission: async (submissionId) => {
    const response = await submissionApi.get(`/submissions/${submissionId}`)
    return response.data
  },

  getUserSubmissions: async (params = {}) => {
    const response = await submissionApi.get('/submissions', { params })
    return response.data
  },
}
