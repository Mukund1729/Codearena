import api from './api'

function normalizeProblem(problem) {
  return {
    ...problem,
    acceptanceRate: problem.acceptance_rate ?? problem.acceptanceRate ?? 50,
    timeLimit: problem.time_limit ?? problem.timeLimit ?? 1000,
    memoryLimit: problem.memory_limit ?? problem.memoryLimit ?? 256,
    inputFormat: problem.input_format ?? problem.inputFormat ?? '',
    outputFormat: problem.output_format ?? problem.outputFormat ?? '',
    sampleInput: problem.sample_input ?? problem.sampleInput ?? '',
    sampleOutput: problem.sample_output ?? problem.sampleOutput ?? '',
    source: problem.source ?? problem.sourceName ?? 'Platform',
  }
}

function normalizeList(data) {
  const list = Array.isArray(data) ? data : []
  return list.map(normalizeProblem)
}

export function problemIdToNumeric(id) {
  if (typeof id === 'number') return id
  if (/^\d+$/.test(String(id))) return parseInt(id, 10)
  let hash = 0
  for (let i = 0; i < String(id).length; i++) {
    hash = (hash << 5) - hash + String(id).charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

export const problemService = {
  getAllProblems: async (params = {}) => {
    const response = await api.get('/auth/codeforces/problems', { params })
    return normalizeList(response.data)
  },

  getKattisProblems: async (params = {}) => {
    const response = await api.get('/auth/kattis/problems', { params })
    return normalizeList(response.data)
  },

  getPublishedProblems: async (params = {}) => {
    const response = await api.get('/problems/published', { params })
    const data = response.data
    if (Array.isArray(data)) {
      return normalizeList(data)
    }
    return {
      ...data,
      content: normalizeList(data.content || []),
    }
  },

  getProblemById: async (id, source = 'codeforces') => {
    let endpoint
    if (source === 'kattis') {
      endpoint = `/auth/kattis/problems/${id}`
    } else if (source === 'internal' || source === 'platform') {
      endpoint = isNaN(Number(id))
        ? `/problems/slug/${id}`
        : `/problems/${id}`
    } else {
      endpoint = `/auth/codeforces/problems/${id}`
    }

    const response = await api.get(endpoint)
    if (!response.data) {
      throw new Error('Problem not found')
    }
    return normalizeProblem(response.data)
  },

  searchProblems: async (filters) => {
    const response = await api.get('/problems/search', { params: filters })
    return response.data
  },

  getInternalProblems: async (params = {}) => {
    const response = await api.get('/problems', { params })
    return response.data
  },

  createProblem: async (data) => {
    const response = await api.post('/problems', data)
    return response.data
  }
}
