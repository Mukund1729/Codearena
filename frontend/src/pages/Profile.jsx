import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { submissionService } from '../services/submissionService'
import { User, Trophy, Code2 } from 'lucide-react'

const Profile = () => {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const data = await submissionService.getUserSubmissions()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'RUNNING': return 'bg-blue-100 text-blue-800'
      default: return 'bg-red-100 text-red-800'
    }
  }

  if (!user) {
    return <div>Please log in to view your profile</div>
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card text-center">
          <Trophy className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {submissions.filter(s => s.status === 'ACCEPTED').length}
          </div>
          <div className="text-sm text-gray-600">Problems Solved</div>
        </div>
        <div className="card text-center">
          <Code2 className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">{submissions.length}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="card text-center">
          <Trophy className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {submissions.filter(s => s.status === 'ACCEPTED').length > 0
              ? Math.round((submissions.filter(s => s.status === 'ACCEPTED').length / submissions.length) * 100)
              : 0}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Problem</th>
                  <th className="text-left py-2 px-4">Language</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.submissionId} className="border-b">
                    <td className="py-2 px-4">Problem #{submission.problemId}</td>
                    <td className="py-2 px-4">{submission.language}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
