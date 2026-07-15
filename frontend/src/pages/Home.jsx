import { Link } from 'react-router-dom'
import { Code2, Trophy, Zap, Shield, ArrowRight } from 'lucide-react'
const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 px-8 py-16 md:py-24 text-white">
        <div className="relative z-10 max-w-2xl">
          <p className="text-primary-300 text-sm font-semibold uppercase tracking-widest mb-3">Online Judge Platform</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Master coding with real contest problems
          </h1>
          <p className="mt-5 text-lg text-slate-300 leading-relaxed">
            Practice from Codeforces and Kattis, compete in live contests, and get AI-powered code reviews — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/problems" className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors">
              Browse Problems <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contests" className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Join Contests
            </Link>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '500+', label: 'Codeforces Problems' },
          { value: '39', label: 'Kattis Problems' },
          { value: '4', label: 'Languages Supported' },
          { value: 'Live', label: 'Real-time Updates' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Code2, title: 'Dual Problem Sources', desc: 'Switch between Codeforces and Kattis problem sets with full statements and samples.' },
          { icon: Trophy, title: 'Live Contests', desc: 'Compete in real-time with live leaderboards updated via WebSocket.' },
          { icon: Zap, title: 'AI Code Review', desc: 'Get intelligent feedback and plagiarism detection powered by AI.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Security */}
      <section className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-slate-900">Built for Safety</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Sandboxed Execution</h3>
            <p>Code runs in isolated containers with strict CPU, memory, and time limits.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-1">Plagiarism Detection</h3>
            <p>Vector-based similarity checks catch copied solutions across submissions.</p>
          </div>
        </div>
      </section>

      <section className="text-center py-4">
        <Link to="/register" className="btn-primary text-base px-8 py-3 inline-block">
          Create Free Account
        </Link>
      </section>
    </div>
  )                                                        
}

export default Home
