import api from './api'

export const contestService = {
  getAllContests: async (params = {}) => {
    const response = await api.get('/contests', { params })
    return response.data
  },

  getContestById: async (id) => {
    const response = await api.get(`/contests/${id}`)
    return response.data
  },

  getLeaderboard: async (contestId) => {
    const response = await api.get(`/contests/${contestId}/leaderboard`)
    return response.data
  },

  getContestsByStatus: async (status) => {
    const response = await api.get(`/contests/status/${status}`)
    return response.data
  },

  createContest: async (data) => {
    const response = await api.post('/contests', data)
    return response.data
  }
}
