import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const VerifyEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify/${token}`)
        if (response.data.token) {
          // Save token and user data
          localStorage.setItem('userToken', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))
          setStatus('success')
          setMessage(response.data.message)
          setUser(response.data.user)
          
          // Redirect to dashboard after verification
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.message || 'Verification failed. Please try again.')
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token, navigate])

  const handleResend = async () => {
    const userEmail = user?.email || localStorage.getItem('pending_email') || ''
    if (!userEmail) {
      setMessage('กรุณาระบุอีเมลที่ต้องการส่งยืนยันใหม่')
      return
    }

    try {
      const response = await api.post('/auth/resend-verification', {
        email: userEmail
      })
      if (response.data.success) {
        setMessage(`${response.data.message}\n\nลิงก์: ${response.data.verificationUrl}`)
        alert(`ส่งอีเมลยืนยันใหม่แล้ว!\n\nคลิกที่: ${response.data.verificationUrl}`)
      } else {
        setMessage(response.data.message || 'ส่งอีเมลยืนยันใหม่ไม่สำเร็จ')
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Email Verified!</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Verification Failed</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResend}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Resend Verification Email
                </button>
                <Link
                  to="/login"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail

