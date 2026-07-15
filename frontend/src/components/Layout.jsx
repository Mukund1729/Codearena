import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Code2, Trophy, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Layout = ({ children }) => {
  const { user, logout, loading } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/problems', label: 'Problems' },
    { path: '/contests', label: 'Contests' },
  ]

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
                CodeArena
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {!loading && (user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {user.username}
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm px-4 py-2">
                    Get Started
                  </Link>
                </>
              ))}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(item.path) ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!loading && (user ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-600">Profile</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false) }} className="block w-full text-left px-3 py-2.5 text-sm text-slate-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-slate-600">Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-primary-600 font-medium">Register</Link>
              </>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-slate-500">CodeArena — Practice, Compete, Improve</p>
          <p className="text-xs text-slate-400">Codeforces & Kattis problems · Live contests · AI review</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
