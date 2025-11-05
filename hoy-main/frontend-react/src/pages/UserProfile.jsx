import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

const UserProfile = () => {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/profile')
      const userData = response.data
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        newPassword: '',
        confirmPassword: '',
        role: userData.role || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Validate password if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'รหัสผ่านใหม่ไม่ตรงกัน' })
          setLoading(false)
          return
        }
        if (formData.newPassword.length < 6) {
          setMessage({ type: 'error', text: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
          setLoading(false)
          return
        }
      }

      const updateData = {
        name: formData.name,
        email: formData.email
      }

      if (formData.newPassword) {
        updateData.password = formData.password
        updateData.newPassword = formData.newPassword
      }

      const response = await api.put('/api/users/profile', updateData)
      
      if (response.data.user) {
        // Update auth context
        setUser(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        setMessage({ type: 'success', text: 'อัปเดตข้อมูลสำเร็จ' })
        
        // Clear password fields
        setFormData({
          ...formData,
          password: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!window.confirm('คุณต้องการเปลี่ยนสิทธิ์เป็น Admin ใช่หรือไม่?\n\n(หมายเหตุ: Super Admin เท่านั้นที่สามารถเปลี่ยนเป็น Super Admin ได้)')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await api.put('/api/users/profile/role', {
        role: 'admin'
      })

      if (response.data.user) {
        setUser(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setMessage({ type: 'success', text: 'เปลี่ยนสิทธิ์เป็น Admin สำเร็จ' })
        
        // Refresh page to show admin dashboard
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ผู้ใช้</h1>
        <p className="text-gray-600 mt-1">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ชื่อของคุณ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="อีเมลของคุณ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สิทธิ์ปัจจุบัน
            </label>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                formData.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {formData.role === 'admin' ? 'Admin' : formData.role === 'manager' ? 'Manager' : 'Viewer'}
              </span>
              {formData.role !== 'admin' && formData.role !== 'superadmin' && (
                <button
                  type="button"
                  onClick={handleChangeRole}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  เปลี่ยนเป็น Admin
                </button>
              )}
              {formData.role === 'superadmin' && (
                <span className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                  SUPER ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">เปลี่ยนรหัสผ่าน</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกรหัสผ่านปัจจุบัน (ถ้าต้องการเปลี่ยน)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ยืนยันรหัสผ่านใหม่"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserProfile

