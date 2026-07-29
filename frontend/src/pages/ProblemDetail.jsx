import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { problemService } from '../services/problemService'
import { submissionService } from '../services/submissionService'
import { aiService } from '../services/aiService'
import { useSocket } from '../contexts/SocketContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Play, Send, Clock, HardDrive, CheckCircle, XCircle,
  Loader2, ExternalLink, ArrowLeft, AlertCircle, Wifi, WifiOff,
  Sparkles, ShieldCheck, ShieldAlert,
} from 'lucide-react'

const SOURCE_BADGE = {
  Codeforces: 'bg-blue-100 text-blue-800',
  Kattis: 'bg-emerald-100 text-emerald-800',
  Platform: 'bg-slate-100 text-slate-800',
}

const ProblemDetail = () => {
  const { id, source: sourceParam } = useParams()
  const source = sourceParam || 'codeforces'
  const [problem, setProblem] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [customInput, setCustomInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [mode, setMode] = useState('submit')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [plagiarismLoading, setPlagiarismLoading] = useState(false)
  const [plagiarismResult, setPlagiarismResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const { subscribeSubmission, connected } = useSocket()
  const { user } = useAuth()

  useEffect(() => {
    loadProblem()
  }, [id, source])

  useEffect(() => {
    if (problem?.sampleInput) {
      setCustomInput(problem.sampleInput)
    }
  }, [problem])

  const loadProblem = async () => {
    try {
      setLoadError(null)
      setProblem(null)
      const data = await problemService.getProblemById(id, source)
      if (!data || !data.title) {
        setLoadError('Problem not found')
        return
      }
      setProblem(data)
      setCode(getDefaultCode(language))
    } catch {
      setLoadError('Failed to load problem. Check that services are running.')
    }
  }

  const getDefaultCode = (lang) => {
    const templates = {
      python: `# ${problem?.title || 'Solution'}\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
      javascript: `function solve() {\n    // Read from stdin, write to stdout\n}\n\nsolve()`,
    }
    return templates[lang] || ''
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    setCode(getDefaultCode(newLanguage))
  }

  const handleSubmissionUpdate = (data) => {
    setSubmissionResult(data)
    setSubmitting(false)
  }

  const submitCode = async (isRun) => {
    if (!user) {
      setSubmitError('Please log in to run or submit code.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    setSubmissionResult(null)
    setMode(isRun ? 'run' : 'submit')
    try {
      const payload = {
        problemId: problemIdToNumeric(id),
        language,
        code,
        ...(isRun && customInput ? { customInput } : {}),
      }
      const result = await submissionService.submitCode(payload)
      setSubmissionResult(result)
      if (result.submissionId) {
        subscribeSubmission(result.submissionId, handleSubmissionUpdate)
      }
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Are you logged in?')
    } finally {
      setSubmitting(false)
    }
  }

  const requestCodeReview = async () => {
    if (!user) {
      setAnalysisError('Please log in to request a review.')
      return
    }

    setReviewLoading(true)
    setAnalysisError(null)
    try {
      const result = await aiService.reviewCode({
        problemStatement: problem.description || problem.inputFormat || '',
        userCode: code,
        failedTestCase: submissionResult?.errorMessage ? { errorMessage: submissionResult.errorMessage } : null,
      })
      setReviewText(result.review || result?.analysis || 'AI review is not available.')
    } catch (err) {
      setAnalysisError(err.response?.data?.error || 'Code review request failed.')
    } finally {
      setReviewLoading(false)
    }
  }

  const checkPlagiarism = async () => {
    if (!user) {
      setAnalysisError('Please log in to run plagiarism check.')
      return
    }

    setPlagiarismLoading(true)
    setAnalysisError(null)
    try {
      const result = await aiService.checkPlagiarism({
        problemId: problemIdToNumeric(id),
        code,
        userId: user.id,
      })
      setPlagiarismResult(result)
    } catch (err) {
      setAnalysisError(err.response?.data?.error || 'Plagiarism check failed.')
    } finally {
      setPlagiarismLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'RUNNING':
      case 'PENDING': return <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
      default: return <XCircle className="h-5 w-5 text-rose-600" />
    }
  }

  const getDifficultyColor = (d) => {
    if (d === 'EASY') return 'bg-emerald-100 text-emerald-800'
    if (d === 'HARD') return 'bg-rose-100 text-rose-800'
    return 'bg-amber-100 text-amber-800'
  }

  if (loadError) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-700">{loadError}</p>
        <Link to="/problems" className="mt-4 inline-block text-primary-600 hover:underline">
          Back to problems
        </Link>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="text-center py-16">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading problem...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/problems" className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to problems
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{problem.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${SOURCE_BADGE[problem.source] || 'bg-slate-100 text-slate-800'}`}>
              {problem.source}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{problem.timeLimit}ms</span>
            <span className="flex items-center gap-1"><HardDrive className="h-4 w-4" />{problem.memoryLimit}MB</span>
            <span>{problem.points} points</span>
            {problem.url && (
              <a href={problem.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                View original <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {connected ? <Wifi className="h-4 w-4 text-emerald-500" /> : <WifiOff className="h-4 w-4" />}
          {connected ? 'Live updates' : 'Offline'}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Statement */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Description</h2>
            {problem.description?.includes('Solve problem') && problem.url ? (
              <div className="space-y-3">
                <p className="text-slate-700 leading-relaxed">
                  This problem is sourced from {problem.source}. For the complete problem statement, please visit the original source.
                </p>
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Full Problem Statement on {problem.source} <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
            )}
          </section>
          {problem.inputFormat && !problem.inputFormat.includes('See problem statement') && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Input</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{problem.inputFormat}</p>
            </section>
          )}
          {problem.outputFormat && !problem.outputFormat.includes('See problem statement') && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Output</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{problem.outputFormat}</p>
            </section>
          )}
          {problem.constraints && !problem.constraints.includes('See problem statement') && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Constraints</h2>
              <p className="text-slate-700">{problem.constraints}</p>
            </section>
          )}
          {problem.sampleInput && problem.sampleInput !== 'See problem statement on Codeforces' && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Sample Input</h2>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">{problem.sampleInput}</pre>
            </section>
          )}
          {problem.sampleOutput && problem.sampleOutput !== 'See problem statement on Codeforces' && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Sample Output</h2>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">{problem.sampleOutput}</pre>
            </section>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <select className="input w-auto" value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => { setMode('run'); submitCode(true) }}
                disabled={submitting}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'run'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {submitting && mode === 'run' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run
              </button>
              <button
                onClick={() => { setMode('submit'); submitCode(false) }}
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-1.5 text-sm disabled:opacity-50"
              >
                {submitting && mode === 'submit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-700">
            <Editor
              height="380px"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          {(mode === 'run' || customInput) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Custom Input</h3>
              <textarea
                className="input font-mono text-sm"
                rows={4}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter custom input..."
              />
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
              {!user && <Link to="/login" className="ml-auto font-medium underline">Log in</Link>}
            </div>
          )}

          {submissionResult && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Result</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(submissionResult.status)}
                  <span className="font-semibold text-sm">{submissionResult.status}</span>
                </div>
              </div>
              {submissionResult.executionTime != null && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Time:</span> <span className="font-medium">{submissionResult.executionTime}ms</span></div>
                  <div><span className="text-slate-500">Memory:</span> <span className="font-medium">{submissionResult.memoryUsed}MB</span></div>
                </div>
              )}
              {submissionResult.testCasesPassed != null && (
                <p className="text-sm text-slate-600">
                  Passed {submissionResult.testCasesPassed} / {submissionResult.totalTestCases} test cases
                </p>
              )}
              {submissionResult.errorMessage && (
                <pre className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg overflow-x-auto">{submissionResult.errorMessage}</pre>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">AI Review</h3>
                <p className="text-sm text-slate-500">Get AI feedback on your code and catch issues early.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={requestCodeReview}
                  disabled={reviewLoading}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  {reviewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Review Code
                </button>
                <button
                  onClick={checkPlagiarism}
                  disabled={plagiarismLoading}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  {plagiarismLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Check Plagiarism
                </button>
              </div>
            </div>

            {analysisError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {analysisError}
              </div>
            )}

            {reviewText && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-800">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-semibold">AI Review Output</span>
                </div>
                <pre className="rounded-lg bg-white border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap">{reviewText}</pre>
              </div>
            )}

            {plagiarismResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="font-semibold">Plagiarism Check</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Similarity</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{plagiarismResult.similarityScore ?? 'N/A'}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{plagiarismResult.isPlagiarized ? 'Flagged' : 'Clean'}</p>
                  </div>
                </div>
                {plagiarismResult.matches && plagiarismResult.matches.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-600">Matched Sources:</p>
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-700 space-y-1">
                      {plagiarismResult.matches.slice(0, 5).map((match, index) => (
                        <li key={index}>{match.source || match.description || JSON.stringify(match)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProblemDetail
