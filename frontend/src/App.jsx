import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import ContestList from './pages/ContestList'
import ContestDetail from './pages/ContestDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="/problems/:source/:id" element={<ProblemDetail />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route path="/contests" element={<ContestList />} />
              <Route path="/contests/:id" element={<ContestDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
