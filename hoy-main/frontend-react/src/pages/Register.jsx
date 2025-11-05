import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Register = () => {
  const [formData, setFormData] = useState({
    client_name: '',
    name: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/register', formData)
      const data = res.data
      setLoading(false)

      if (res.status >= 200 && res.status < 300 && data.success) {
        if (data.token && data.user) {
          // First user bootstrap: auto-login and go to dashboard
          localStorage.setItem('userToken', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          navigate('/dashboard')
        } else {
          // Normal flow: require email verification
          localStorage.setItem('pending_email', formData.email)
          
          // Show different message based on environment
          if (data.verificationUrl) {
            // Development mode: show URL and token
            alert(`สมัครสมาชิกสำเร็จ!\n\nกรุณายืนยันอีเมลของคุณโดยคลิกที่ลิงก์นี้:\n${data.verificationUrl}\n\nหรือคัดลอก token นี้: ${data.verificationToken}\n\n(Development mode: Email ถูกส่งไปแล้ว กรุณาเช็คในคอนโซล)`)
          } else {
            // Production mode: just inform user to check email
            alert(`สมัครสมาชิกสำเร็จ!\n\nเราได้ส่งอีเมลยืนยันตัวตนไปยัง ${formData.email} แล้ว\n\nกรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อยืนยันการสมัครสมาชิก\n\n(ตรวจสอบในโฟลเดอร์ Spam ด้วยหากไม่พบอีเมล)`)
          }
          
          navigate('/login')
        }
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch (err) {
      setLoading(false)
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up for RGA Dashboard</p>
        </div>
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name (Optional)
              </label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                className="input"
                placeholder="My Company"
                value={formData.client_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name (Optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
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
                value={formData.email}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register



