import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { Link } from 'react-router-dom'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClients: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingVerifications: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch all users (admin can see all)
      const [usersRes, clientsRes, ordersRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/clients'),
        api.get('/api/orders').catch(() => ({ data: [] }))
      ])

      const users = usersRes.data || []
      const clients = clientsRes.data || []
      const orders = ordersRes.data || []

      // Calculate stats
      const totalRevenue = orders
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
      
      const pendingVerifications = users.filter(u => u.status === 'pending').length

      setStats({
        totalUsers: users.length,
        totalClients: clients.length,
        totalOrders: orders.length,
        totalRevenue,
        pendingVerifications
      })

      // Get recent users (last 10)
      setRecentUsers(users.slice(0, 10))

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'superadmin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            ยินดีต้อนรับ, <span className="font-medium">{user?.name || (user?.role === 'superadmin' ? 'Super Admin' : 'Admin')}</span>
            {user?.role === 'superadmin' && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                SUPER ADMIN
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/users"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            จัดการผู้ใช้
          </Link>
          <Link
            to="/clients"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            จัดการลูกค้า
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalClients}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">คำสั่งซื้อ</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">รายได้รวม</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">รอยืนยันอีเมล</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.pendingVerifications}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">ผู้ใช้ล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อีเมล</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สิทธิ์</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่สร้าง</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      u.status === 'active' ? 'bg-green-100 text-green-800' :
                      u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/users"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการผู้ใช้</h3>
          <p className="text-sm text-gray-600">ดู แก้ไข และลบผู้ใช้ทั้งหมด</p>
        </Link>

        <Link
          to="/clients"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">จัดการลูกค้า</h3>
          <p className="text-sm text-gray-600">ดูและจัดการข้อมูลลูกค้า</p>
        </Link>

        <Link
          to="/reports"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">รายงาน</h3>
          <p className="text-sm text-gray-600">ดูรายงานและสถิติทั้งหมด</p>
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboard

