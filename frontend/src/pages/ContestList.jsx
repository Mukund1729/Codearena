import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contestService } from '../services/contestService'
import { Calendar, Users, Clock } from 'lucide-react'
const ContestList = () => {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  useEffect(() => {
    loadContests()
  }, [statusFilter])
  const loadContests = async () => {
    try {
      setLoading(true)
      const data = statusFilter === 'ALL'
        ? await contestService.getAllContests()
        : await contestService.getContestsByStatus(statusFilter)
      setContests(data.content || data)
    } catch (error) {
      console.error('Error loading contests:', error)
    } finally {
      setLoading(false)
    }
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ENDED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getDurationText = (contest) => {
    if (contest.durationMinutes != null) {
      return `${contest.durationMinutes} minutes`
    }

    if (contest.startTime && contest.endTime) {
      const diff = new Date(contest.endTime) - new Date(contest.startTime)
      return diff > 0 ? `${Math.round(diff / 60000)} minutes` : 'N/A'
    }

    return 'N/A'
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft'
      case 'UPCOMING':
        return 'Upcoming'
      case 'ACTIVE':
        return 'Active'
      case 'ENDED':
        return 'Ended'
      case 'ARCHIVED':
        return 'Archived'
      default:
        return status || 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Contests</h1>
          <p className="text-sm text-slate-500">Browse upcoming, active, and completed contests.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'UPCOMING', 'ACTIVE', 'ENDED', 'ARCHIVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                statusFilter === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading contests...</p>
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          <p className="text-lg font-semibold">No contests are available right now.</p>
          <p className="mt-2 text-sm">Check back later for new contests or explore problems in the meantime.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.map((contest) => (
            <Link
              key={contest.id}
              to={`/contests/${contest.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{contest.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{contest.description || 'No description provided.'}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Starts: {formatDate(contest.startTime)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Ends: {contest.endTime ? formatDate(contest.endTime) : 'TBD'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Duration: {getDurationText(contest)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{contest.participants?.length ?? 0} participants</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contest.status)}`}>
                    {getStatusLabel(contest.status)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContestList
