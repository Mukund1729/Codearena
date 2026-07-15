import { useEffect, useState } from 'react'
import { Plus, Save, Trash2, AlertCircle } from 'lucide-react'
import { problemService } from '../services/problemService'
import { contestService } from '../services/contestService'

const Admin = () => {
  const [activeTab, setActiveTab] = useState('problems')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [problems, setProblems] = useState([])
  const [contests, setContests] = useState([])

  const [showProblemForm, setShowProblemForm] = useState(false)
  const [newProblem, setNewProblem] = useState({
    title: '',
    slug: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    difficulty: 'EASY',
    tags: 'implementation',
    timeLimit: 1000,
    memoryLimit: 256,
    totalTestCases: 1,
    status: 'PUBLISHED',
    points: 10,
    acceptanceRate: 0,
  })

  const [showContestForm, setShowContestForm] = useState(false)
  const [newContest, setNewContest] = useState({
    title: '',
    slug: '',
    description: '',
    startTime: '',
    endTime: '',
    status: 'UPCOMING',
    durationMinutes: 60,
    scoringFormula: 'accepted',
    rules: '',
  })

  useEffect(() => {
    if (activeTab === 'problems') {
      loadProblems()
    } else if (activeTab === 'contests') {
      loadContests()
    }
  }, [activeTab])

  const loadProblems = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await problemService.getInternalProblems({ page: 0, size: 50 })
      setProblems(data.content || [])
    } catch (err) {
      setError('Unable to load problems. Check backend connectivity.')
    } finally {
      setLoading(false)
    }
  }

  const loadContests = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await contestService.getAllContests({ page: 0, size: 50 })
      setContests(data.content || [])
    } catch (err) {
      setError('Unable to load contests. Check backend connectivity.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProblem = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await problemService.createProblem(newProblem)
      setSuccess('Problem created successfully.')
      setShowProblemForm(false)
      setNewProblem({
        title: '',
        slug: '',
        description: '',
        inputFormat: '',
        outputFormat: '',
        constraints: '',
        sampleInput: '',
        sampleOutput: '',
        difficulty: 'EASY',
        tags: 'implementation',
        timeLimit: 1000,
        memoryLimit: 256,
        totalTestCases: 1,
        status: 'PUBLISHED',
        points: 10,
        acceptanceRate: 0,
      })
      loadProblems()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create problem.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await contestService.createContest(newContest)
      setSuccess('Contest created successfully.')
      setShowContestForm(false)
      setNewContest({
        title: '',
        slug: '',
        description: '',
        startTime: '',
        endTime: '',
        status: 'UPCOMING',
        durationMinutes: 60,
        scoringFormula: 'accepted',
        rules: '',
      })
      loadContests()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="flex flex-wrap gap-3 border-b pb-4">
        {['problems', 'contests', 'users'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium rounded-lg ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-700">Action required</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      {activeTab === 'problems' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Manage Problems</h2>
            <button
              onClick={() => setShowProblemForm((current) => !current)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showProblemForm ? 'Cancel' : 'Add Problem'}
            </button>
          </div>

          {showProblemForm && (
            <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreateProblem}>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span>Title</span>
                  <input
                    value={newProblem.title}
                    onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Slug</span>
                  <input
                    value={newProblem.slug}
                    onChange={(e) => setNewProblem({ ...newProblem, slug: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Difficulty</span>
                  <select
                    value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    className="input w-full"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Points</span>
                  <input
                    type="number"
                    min="1"
                    value={newProblem.points}
                    onChange={(e) => setNewProblem({ ...newProblem, points: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Time limit (ms)</span>
                  <input
                    type="number"
                    min="1"
                    value={newProblem.timeLimit}
                    onChange={(e) => setNewProblem({ ...newProblem, timeLimit: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Memory limit (MB)</span>
                  <input
                    type="number"
                    min="1"
                    value={newProblem.memoryLimit}
                    onChange={(e) => setNewProblem({ ...newProblem, memoryLimit: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Tags</span>
                  <input
                    value={newProblem.tags}
                    onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                    className="input w-full"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Status</span>
                  <select
                    value={newProblem.status}
                    onChange={(e) => setNewProblem({ ...newProblem, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span>Description</span>
                <textarea
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  className="input h-28 w-full"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Input Format</span>
                <textarea
                  value={newProblem.inputFormat}
                  onChange={(e) => setNewProblem({ ...newProblem, inputFormat: e.target.value })}
                  className="input h-20 w-full"
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                <span>Output Format</span>
                <textarea
                  value={newProblem.outputFormat}
                  onChange={(e) => setNewProblem({ ...newProblem, outputFormat: e.target.value })}
                  className="input h-20 w-full"
                  required
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span>Sample Input</span>
                  <textarea
                    value={newProblem.sampleInput}
                    onChange={(e) => setNewProblem({ ...newProblem, sampleInput: e.target.value })}
                    className="input h-20 w-full"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Sample Output</span>
                  <textarea
                    value={newProblem.sampleOutput}
                    onChange={(e) => setNewProblem({ ...newProblem, sampleOutput: e.target.value })}
                    className="input h-20 w-full"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span>Constraints</span>
                <textarea
                  value={newProblem.constraints}
                  onChange={(e) => setNewProblem({ ...newProblem, constraints: e.target.value })}
                  className="input h-20 w-full"
                  required
                />
              </label>
              <button disabled={loading} className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3">
                <Save className="h-4 w-4" /> Save Problem
              </button>
            </form>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Existing Problems</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading problems...</p>
            ) : problems.length === 0 ? (
              <p className="text-sm text-slate-500">No problems found.</p>
            ) : (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div key={problem.id || problem.slug} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{problem.title}</h4>
                        <p className="text-sm text-slate-500">Slug: {problem.slug}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{problem.difficulty}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{problem.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contests' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Manage Contests</h2>
            <button
              onClick={() => setShowContestForm((current) => !current)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showContestForm ? 'Cancel' : 'Add Contest'}
            </button>
          </div>

          {showContestForm && (
            <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleCreateContest}>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span>Title</span>
                  <input
                    value={newContest.title}
                    onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Slug</span>
                  <input
                    value={newContest.slug}
                    onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span>Description</span>
                <textarea
                  value={newContest.description}
                  onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                  className="input h-24 w-full"
                />
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm">
                  <span>Start time</span>
                  <input
                    type="datetime-local"
                    value={newContest.startTime}
                    onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>End time</span>
                  <input
                    type="datetime-local"
                    value={newContest.endTime}
                    onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <label className="space-y-2 text-sm">
                  <span>Status</span>
                  <select
                    value={newContest.status}
                    onChange={(e) => setNewContest({ ...newContest, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ENDED">Ended</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span>Duration (minutes)</span>
                  <input
                    type="number"
                    min="1"
                    value={newContest.durationMinutes}
                    onChange={(e) => setNewContest({ ...newContest, durationMinutes: Number(e.target.value) })}
                    className="input w-full"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span>Scoring formula</span>
                  <input
                    value={newContest.scoringFormula}
                    onChange={(e) => setNewContest({ ...newContest, scoringFormula: e.target.value })}
                    className="input w-full"
                    required
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span>Rules</span>
                <textarea
                  value={newContest.rules}
                  onChange={(e) => setNewContest({ ...newContest, rules: e.target.value })}
                  className="input h-24 w-full"
                />
              </label>
              <button disabled={loading} className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3">
                <Save className="h-4 w-4" /> Save Contest
              </button>
            </form>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Existing Contests</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading contests...</p>
            ) : contests.length === 0 ? (
              <p className="text-sm text-slate-500">No contests found.</p>
            ) : (
              <div className="space-y-3">
                {contests.map((contest) => (
                  <div key={contest.id || contest.slug} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{contest.title}</h4>
                        <p className="text-sm text-slate-500">{contest.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{contest.status}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{contest.durationMinutes} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-3">Manage Users</h2>
          <p className="text-sm text-slate-500">User management is not available in this demo yet.</p>
        </div>
      )}
    </div>
  )
}

export default Admin
