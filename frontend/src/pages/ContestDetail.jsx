import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { contestService } from '../services/contestService'
import { useSocket } from '../contexts/SocketContext'
import { Trophy, Clock, Users, TrendingUp } from 'lucide-react'

const ContestDetail = () => {
  const { id } = useParams()
  const [contest, setContest] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const { joinContest, leaveContest, onLeaderboardUpdate } = useSocket()

  useEffect(() => {
    loadContest()
    loadLeaderboard()
    joinContest(id)

    const unsubscribe = onLeaderboardUpdate?.((data) => {
      if (String(data.contestId) === String(id)) {
        setLeaderboard(data.leaderboard || data.entries || [])
      }
    })

    return () => {
      leaveContest(id)
      unsubscribe?.()
    }
  }, [id])

  const loadContest = async () => {
    try {
      const data = await contestService.getContestById(id)
      setContest(data)
    } catch (error) {
      console.error('Error loading contest:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const data = await contestService.getLeaderboard(id)
      setLeaderboard(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const getTimeRemaining = (endTime) => {
    const diff = new Date(endTime) - new Date()
    if (diff <= 0) return 'Contest Ended'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${h}h ${m}m ${s}s`
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-slate-600">Loading contest...</p>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600">Contest not found</p>
        <Link to="/contests" className="mt-4 inline-block text-primary-600 hover:underline">Back to contests</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{contest.title}</h1>
            <p className="text-slate-600 mt-1">{contest.description}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-2 text-slate-600">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{getTimeRemaining(contest.endTime)}</span>
            </div>
            <div className="flex items-center justify-end gap-2 text-slate-500 text-sm">
              <Users className="h-4 w-4" />
              <span>{contest.participants?.length || 0} participants</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Problems</h2>
          {contest.problems?.length ? contest.problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problems/codeforces/${problem.slug || problem.id}`}
              className="flex justify-between items-center bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{problem.title}</h3>
                <p className="text-sm text-slate-500">Problem {problem.problemOrder}</p>
              </div>
              <span className="font-medium text-primary-700">{problem.points} pts</span>
            </Link>
          )) : (
            <p className="text-slate-500 text-sm">No problems assigned yet.</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900">Leaderboard</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No entries yet</p>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between p-2.5 rounded-lg ${
                      index === 0 ? 'bg-amber-50' : index === 1 ? 'bg-slate-50' : index === 2 ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-400 w-6 text-sm">#{entry.rank || index + 1}</span>
                      <span className="font-medium text-sm text-slate-800">{entry.username || entry.userId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary-600" />
                      <span className="font-semibold text-sm">{entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContestDetail
