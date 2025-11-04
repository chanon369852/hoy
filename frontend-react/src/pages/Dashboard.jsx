import { useEffect, useState } from 'react'
import api from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0,
    users: 0,
    products: 0,
    orders: 0,
    alerts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clients, users, products, orders, alerts] = await Promise.all([
          api.get('/clients').catch(() => ({ data: [] })),
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/alerts').catch(() => ({ data: [] }))
        ])

        setStats({
          clients: clients.data?.length || 0,
          users: users.data?.length || 0,
          products: products.data?.length || 0,
          orders: orders.data?.length || 0,
          alerts: alerts.data?.length || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: 'Clients', value: stats.clients, icon: '👥', color: 'bg-blue-500' },
    { label: 'Users', value: stats.users, icon: '👤', color: 'bg-green-500' },
    { label: 'Products', value: stats.products, icon: '📦', color: 'bg-yellow-500' },
    { label: 'Orders', value: stats.orders, icon: '🛒', color: 'bg-purple-500' },
    { label: 'Alerts', value: stats.alerts, icon: '🔔', color: 'bg-red-500' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Overview of your RGA Dashboard</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.color} rounded-lg p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard



