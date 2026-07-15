import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { problemService } from '../services/problemService'
import { Search, Filter, ExternalLink, AlertCircle } from 'lucide-react'

const SOURCE_CONFIG = {
  codeforces: { label: 'Codeforces', color: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800' },
  kattis: { label: 'Kattis', color: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
  internal: { label: 'Platform', color: 'bg-slate-600', badge: 'bg-slate-100 text-slate-800' },
}

const ProblemList = () => {
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [source, setSource] = useState('kattis')
  const [filters, setFilters] = useState({ difficulty: '', tag: '', search: '' })
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    loadProblems()
  }, [source])

  const loadProblems = async () => {
    try {
      setLoading(true)
      setError(null)
      let data
      if (source === 'codeforces') {
        data = await problemService.getAllProblems()
      } else if (source === 'kattis') {
        data = await problemService.getKattisProblems()
      } else {
        data = await problemService.getPublishedProblems()
      }
      setProblems(Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load problems. Make sure the API gateway and problem service are running.')
      setProblems([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProblems = useMemo(() => problems.filter(problem => {
    const matchesDifficulty = !filters.difficulty || problem.difficulty === filters.difficulty
    const matchesStatus = statusFilter === 'ALL' || problem.difficulty === statusFilter
    const matchesSearch = !filters.search ||
      problem.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      problem.tags?.toLowerCase().includes(filters.search.toLowerCase())
    const matchesTag = !filters.tag || problem.tags?.toLowerCase().includes(filters.tag.toLowerCase())
    return matchesDifficulty && matchesStatus && matchesSearch && matchesTag
  }), [problems, filters, statusFilter])

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'MEDIUM': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'HARD': return 'bg-rose-100 text-rose-800 border-rose-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const config = SOURCE_CONFIG[source]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Problem Library</h1>
          <p className="mt-2 text-slate-300">
            {source === 'codeforces'
              ? `Practice from ${problems.length}+ Codeforces challenges`
              : source === 'kattis'
                ? `Practice from ${problems.length} Kattis challenges`
                : 'Practice from internal curated platform problems'}
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary-500/20 blur-2xl" />
      </div>

      {/* Source toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm border border-slate-200">
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setSource(key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                source === key
                  ? `${cfg.color} text-white shadow-md`
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Show:</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-2 rounded-lg ${statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('EASY')}
            className={`px-3 py-2 rounded-lg ${statusFilter === 'EASY' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Easy
          </button>
          <button
            onClick={() => setStatusFilter('MEDIUM')}
            className={`px-3 py-2 rounded-lg ${statusFilter === 'MEDIUM' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Medium
          </button>
          <button
            onClick={() => setStatusFilter('HARD')}
            className={`px-3 py-2 rounded-lg ${statusFilter === 'HARD' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Hard
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or tags..."
              className="input pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="input w-auto min-w-[160px]"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
          <select
            className="input w-auto min-w-[160px]"
            value={filters.tag}
            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
          >
            <option value="">All Tags</option>
            <option value="implementation">Implementation</option>
            <option value="dynamic-programming">Dynamic Programming</option>
            <option value="graphs">Graphs</option>
            <option value="math">Math</option>
            <option value="strings">Strings</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={loadProblems} className="ml-auto text-sm font-medium underline">Retry</button>
        </div>
      )}

      {/* Problem List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 p-5">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Filter className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No problems match your filters</p>
          <button
            onClick={() => setFilters({ difficulty: '', tag: '', search: '' })}
            className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProblems.map((problem, index) => (
            <Link
              key={problem.id || problem.slug || index}
              to={`/problems/${source}/${problem.slug || problem.id}`}
              className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <span className="text-sm font-mono text-slate-400 w-8 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                    {problem.title}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5 truncate">
                  {problem.tags?.replace(/,/g, ' · ') || 'No tags'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <span className="text-sm text-slate-500 hidden sm:block">{problem.points || 10} pts</span>
                <span className="text-sm text-slate-400 hidden md:block">{problem.acceptanceRate || 50}%</span>
                {problem.url && (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-slate-400 hover:text-primary-600 p-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProblemList
