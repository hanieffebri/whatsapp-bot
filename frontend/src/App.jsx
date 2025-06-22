import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import io from 'socket.io-client'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Messages from './pages/Messages'
import Webhooks from './pages/Webhooks'
import Login from './pages/Login'
import Register from './pages/Register'
import Settings from './pages/Settings'

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function App() {
  const [user, setUser] = useState(null)
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(JSON.parse(userData))
      
      // Initialize socket connection
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        auth: { token }
      })
      setSocket(newSocket)

      // Listen for new messages
      newSocket.on('new_message', (message) => {
        setMessages(prev => [message, ...prev])
      })

      newSocket.on('message_status', (update) => {
        setMessages(prev => prev.map(msg => 
          msg.id === update.message_id ? { ...msg, status: update.status } : msg
        ))
      })
    }

    setLoading(false)

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials)
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`
      setUser(response.data.data.user)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      await axios.post('/auth/logout')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      if (socket) socket.disconnect()
      return { success: true }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Logout failed' }
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register onRegister={register} /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Layout user={user} onLogout={logout} /> : <Navigate to="/login" />}>
        <Route index element={<Dashboard messages={messages} />} />
        <Route path="messages" element={<Messages messages={messages} setMessages={setMessages} />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="settings" element={<Settings user={user} setUser={setUser} />} />
      </Route>
    </Routes>
  )
}

export default App