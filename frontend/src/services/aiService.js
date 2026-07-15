import api from './api'

export const aiService = {
  reviewCode: async ({ problemStatement, userCode, failedTestCase }) => {
    const response = await api.post('/ai/review', {
      problemStatement,
      userCode,
      failedTestCase,
    })
    return response.data
  },

  checkPlagiarism: async ({ problemId, code, userId }) => {
    const response = await api.post('/ai/plagiarism', {
      problemId,
      code,
      userId,
    })
    return response.data
  }
}
