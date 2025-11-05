import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResendMessage('')
    setShowResendButton(false)
    setLoading(true)

    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      // Always redirect to dashboard after login
      navigate('/dashboard')
    } else {
      setError(result.message || 'Login failed')
      
      // Show resend verification option if email not verified
      if (result.message && result.message.includes('verify')) {
        setShowResendButton(true)
      }
    }
  }

  const handleResendVerification = async () => {
    setResendMessage('')
    setLoading(true)

    try {
      const res = await api.post('/auth/resend-verification', { email })
      const data = res.data
      setLoading(false)

      if (res.status >= 200 && res.status < 300 && data.success) {
        setResendMessage(`ส่งอีเมลยืนยันใหม่แล้ว!\n\nคลิกที่ลิงก์นี้: ${data.verificationUrl}\n\nหรือ token: ${data.verificationToken}`)
        alert(`ส่งอีเมลยืนยันใหม่แล้ว!\n\nคลิกที่ลิงก์นี้: ${data.verificationUrl}\n\nหรือ token: ${data.verificationToken}`)
      } else {
        setResendMessage(data.message || 'Failed to resend verification')
      }
    } catch (err) {
      setLoading(false)
      setResendMessage('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">RGA Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {showResendButton && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <p className="text-sm mb-2">ยังไม่ได้ยืนยันอีเมล?</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                >
                  ส่งอีเมลยืนยันใหม่
                </button>
              </div>
            )}
            {resendMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {resendMessage}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            <div className="text-center">
              <Link to="/register" className="text-sm text-primary-600 hover:text-primary-500">
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login



