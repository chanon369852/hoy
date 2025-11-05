import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useEffect } from 'react';
import websocket from '../utils/websocket';

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    clients: 0,
    users: 0,
    products: 0,
    orders: 0,
    alerts: 0,
    onlineUsers: 0,
    latestLine: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [salesData, setSalesData] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [onlineUsersList, setOnlineUsersList] = useState([])
  const [loading, setLoading] = useState({
    stats: true,
    orders: true,
    alerts: true,
    sales: true
  })
  const [error, setError] = useState(null)

  // Define user permissions based on role
  const userPermissions = {
    admin: {
      viewUsers: true,
      viewClients: true,
      viewProducts: true,
      viewOrders: true,
      viewAlerts: true,
      viewAnalytics: true
    },
    manager: {
      viewUsers: false,
      viewClients: true,
      viewProducts: true,
      viewOrders: true,
      viewAlerts: true,
      viewAnalytics: true
    },
    user: {
      viewUsers: false,
      viewClients: false,
      viewProducts: true,
      viewOrders: true,
      viewAlerts: true,
      viewAnalytics: false
    }
  }

  // Get user's role or default to 'user'
  const userRole = user?.role || 'user'
  const permissions = userPermissions[userRole] || userPermissions.user

  // State for clients data
  const [clients, setClients] = useState([]);
  const [onlineClients, setOnlineClients] = useState([]);

  // Fetch clients data
  const fetchClients = async () => {
    try {
      const response = await api.get('/api/clients');
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
        // For demo, mark first 2 clients as online
        setOnlineClients(response.data.slice(0, 2).map(client => client.id));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Real data fetching functions
  const fetchOnlineUsers = async () => {
    try {
      // Fetch all users with their online status
      const [usersResponse, onlineResponse] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/queue/online-users').catch(() => ({ data: { count: 1 } }))
      ]);
      
      const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const onlineCount = onlineResponse.data?.count || 1;
      
      // Mark users as online based on the online count
      return allUsers.map((user, index) => ({
        ...user,
        is_online: index < onlineCount
      }));
    } catch (error) {
      console.error('Error fetching online users:', error);
      // Return current user as online if there's an error
      return user ? [{
        id: user.id || 'current',
        name: user.name || 'คุณ',
        email: user.email || '',
        role: user.role || 'user',
        is_online: true
      }] : [];
    }
  };

  const fetchLatestQueue = async () => {
    try {
      const response = await api.get('/queue/latest');
      return response.data?.queueNumber || 0;
    } catch (error) {
      console.error('Error fetching latest queue:', error);
      return 0;
    }
  };
  
  const fetchTotalUsers = async () => {
    try {
      // Get all users from the database
      const response = await api.get('/users');
      if (response.data && Array.isArray(response.data)) {
        // Update the allUsers state with the latest data
        setAllUsers(response.data);
        return response.data.length;
      }
      
      // If no data, try the count endpoint as fallback
      const countResponse = await api.get('/users/count').catch(() => ({}));
      if (countResponse.data?.count > 0) {
        return countResponse.data.count;
      }
      
      // If still no data, return the current user count or 1
      return allUsers.length > 0 ? allUsers.length : 1;
    } catch (error) {
      console.error('Error fetching total users:', error);
      // Return the current count or 1 if there's an error
      return allUsers.length > 0 ? allUsers.length : 1;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        setLoading(prev => ({ ...prev, stats: true }));
        
        // Fetch all required data in parallel
        const [totalUsers, onlineUsers] = await Promise.all([
          fetchTotalUsers(),
          fetchOnlineUsers(),
          fetchClients()  // Fetch clients data
        ]);

        // Update stats with the fetched data
        setStats(prev => ({
          ...prev,
          users: totalUsers,
          onlineUsers: onlineUsers.filter(u => u.is_online).length,
          clients: clients.length
        }));

        // Update online users list
        if (Array.isArray(onlineUsers)) {
          setOnlineUsersList(onlineUsers);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading({
          stats: false,
          orders: false,
          alerts: false,
          sales: false
        });
      }
    }

    fetchDashboardData()
  }, [])

  const statCards = [
    { 
      label: 'ผู้ใช้งานทั้งหมด', 
      value: (
        <div className="text-center">
          <div className="text-3xl font-bold">{allUsers.length}</div>
          <div className="text-sm text-gray-600">คน</div>
        </div>
      ),
      icon: '👥', 
      color: 'bg-blue-500',
      description: 'จำนวนผู้ใช้งานทั้งหมดในระบบ',
      tooltip: `มีผู้ใช้งานทั้งหมด ${allUsers.length} คน`,
      fullWidth: true
    },
    { 
      label: 'ผู้ใช้งานออนไลน์', 
      value: (
        <div className="text-center">
          <div className="text-3xl font-bold">
            <span className="text-green-500">{stats.onlineUsers}</span>
            <span className="text-gray-400">/{stats.users}</span>
          </div>
          <div className="text-sm text-gray-600">ออนไลน์/ทั้งหมด</div>
        </div>
      ),
      icon: '🌐', 
      color: 'bg-white',
      border: 'border border-green-200',
      fullWidth: true
    },
    { 
      label: 'สินค้าทั้งหมด', 
      value: stats.products, 
      icon: '📦', 
      color: 'bg-yellow-500',
      suffix: ' ชิ้น'
    },
    { 
      label: 'จำนวนคิวล่าสุด', 
      value: stats.latestLine, 
      icon: '📝', 
      color: 'bg-purple-500',
      suffix: ' คิว'
    },
    { 
      label: 'คำสั่งซื้อวันนี้', 
      value: stats.orders, 
      icon: '🛒', 
      color: 'bg-indigo-500',
      suffix: ' อันดับ'
    }
  ]

  const LoadingSpinner = ({ size = 'h-12 w-12' }) => (
    <div className="flex items-center justify-center h-full">
      <div className={`animate-spin rounded-full ${size} border-b-2 border-primary-600`}></div>
    </div>
  )

  if (loading.stats && loading.orders && loading.alerts && loading.sales) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter stat cards based on permissions
  const filteredStatCards = statCards; // Show all cards for now

  return (
    <div className="space-y-6 p-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">แดชบอร์ดระบบ</h1>
            <div className="flex flex-wrap items-center mt-2 gap-4">
              <p className="text-sm text-gray-600">
                ยินดีต้อนรับ, <span className="font-medium">{user?.name || 'ผู้ใช้'}</span>
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {userRole === 'admin' ? 'ผู้ดูแลระบบ' : userRole === 'manager' ? 'ผู้จัดการ' : 'ผู้ใช้งาน'}
                </span>
              </p>
              <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                <span className={`h-2 w-2 rounded-full ${stats.onlineUsers > 0 ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></span>
                <span>ออนไลน์: <span className="font-medium">{onlineUsersList.length}/{allUsers.length || '?'}</span></span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {filteredStatCards.map((stat, index) => (
          <div key={index} className={`${stat.fullWidth ? 'lg:col-span-2' : ''} ${stat.color || 'bg-white'} ${stat.border || ''} overflow-hidden shadow rounded-lg`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-12 w-12 rounded-full ${stat.color || 'bg-blue-500'} flex items-center justify-center text-white`}>
                    {stat.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.label}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              {stat.description && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">{stat.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Users Summary */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-800">รายงานผู้ใช้งาน</h2>
          <p className="text-gray-600">ข้อมูลผู้ใช้งานทั้งหมดในระบบ</p>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {allUsers.length}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">ผู้ใช้งานทั้งหมด</div>
              <div className="text-sm text-gray-500">จำนวนผู้ใช้งานทั้งหมดในระบบ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            ผู้ใช้งานทั้งหมด ({allUsers.length} คน)
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            รายชื่อผู้ใช้งานทั้งหมดในระบบ
          </p>
        </div>
        <div className="bg-white shadow overflow-hidden sm:rounded-b-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อผู้ใช้
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สิทธิ์
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'ไม่มีชื่อ'}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_online ? 'ออนไลน์' : 'ออฟไลน์'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {user.role || 'user'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Online Users Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            ผู้ใช้งานออนไลน์ ({onlineUsersList.length}/{allUsers.length})
          </h3>
        </div>
        <div className="px-4 py-5">
          {onlineUsersList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {onlineUsersList.map(user => (
                <div key={user.id} className="flex items-center p-3 border rounded-lg">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name || 'ผู้ใช้ไม่ระบุชื่อ'}</p>
                    <p className="text-xs text-gray-500">{user.email || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">ไม่มีผู้ใช้งานออนไลน์</p>
          )}
        </div>
      </div>

      {/* All Users List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">รายชื่อผู้ใช้งานทั้งหมด ({allUsers.length} คน)</h3>
          <div className="flex items-center text-sm text-gray-500">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-1"></span>
            <span>ออนไลน์ {onlineUsersList.length} คน</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อผู้ใช้
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สิทธิ์
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'ไม่มีชื่อ'}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.is_online ? 'ออนไลน์' : 'ออฟไลน์'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {user.role || 'user'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Sales Overview</h2>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This year</option>
            </select>
          </div>
          <div className="h-80">
            {loading.sales ? (
              <LoadingSpinner size="h-12 w-12" />
            ) : salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Sales']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-800">
              View all
            </Link>
          </div>
          {loading.orders ? (
            <LoadingSpinner size="h-12 w-12" />
          ) : recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                        <Link to={`/orders/${order._id}`}>
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'shipped' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No recent orders found</div>
          )}
        </div>
      </div>

      {/* Alerts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Alerts</h2>
            <Link to="/alerts" className="text-sm text-primary-600 hover:text-primary-800">
              View all
            </Link>
          </div>
          {loading.alerts ? (
            <LoadingSpinner size="h-12 w-12" />
          ) : recentAlerts.length > 0 ? (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert._id} className="flex items-start pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-600' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.priority === 'high' ? '!' : 'i'}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                    <div className="mt-2 flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.status}
                      </span>
                      <button className="ml-2 text-xs text-primary-600 hover:text-primary-800">
                        {alert.status === 'resolved' ? 'Reopen' : 'Mark as resolved'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">No recent alerts</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <Link to="/activity" className="text-sm text-primary-600 hover:text-primary-800">
              View all
            </Link>
          </div>
          <div className="flow-root">
            <ul className="-mb-8">
              {[1, 2, 3, 4].map((item) => (
                <li key={item}>
                  <div className="relative pb-8">
                    {item !== 4 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">John Doe</span> created a new order
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2023-04-15T10:30:00">10:30 AM</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard



