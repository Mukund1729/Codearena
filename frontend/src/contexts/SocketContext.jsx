import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()
  const submissionCallbacks = useRef(new Map())
  const leaderboardCallbacks = useRef(new Set())

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3004'
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
      })

      newSocket.on('connect', () => setConnected(true))
      newSocket.on('disconnect', () => setConnected(false))

      newSocket.on('submission-result', (data) => {
        const cb = submissionCallbacks.current.get(data.submissionId)
        if (cb) cb(data)
        submissionCallbacks.current.forEach((callback, id) => {
          if (id === data.submissionId) callback(data)
        })
      })

      newSocket.on('leaderboard-updated', (data) => {
        leaderboardCallbacks.current.forEach((cb) => cb(data))
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
        submissionCallbacks.current.clear()
        leaderboardCallbacks.current.clear()
      }
    }
  }, [user])

  const joinContest = useCallback((contestId) => {
    socket?.emit('join-contest', contestId)
  }, [socket])

  const leaveContest = useCallback((contestId) => {
    socket?.emit('leave-contest', contestId)
  }, [socket])

  const subscribeSubmission = useCallback((submissionId, callback) => {
    if (socket) {
      socket.emit('subscribe-submission', submissionId)
    }
    if (callback) {
      submissionCallbacks.current.set(submissionId, callback)
    }
  }, [socket])

  const onLeaderboardUpdate = useCallback((callback) => {
    leaderboardCallbacks.current.add(callback)
    return () => leaderboardCallbacks.current.delete(callback)
  }, [])

  return (
    <SocketContext.Provider value={{
      socket, connected, joinContest, leaveContest,
      subscribeSubmission, onLeaderboardUpdate,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
