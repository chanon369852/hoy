import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Orders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    customer_name: '',
    total_amount: '',
    status: 'pending'
  })

  useEffect(() => {
    fetchOrders()
    fetchClients()
  }, [])

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredOrders(filtered)
  }, [searchTerm, orders])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders')
      setOrders(response.data)
      setFilteredOrders(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({
      client_id: user?.client_id || '',
      customer_name: '',
      total_amount: '',
      status: 'pending'
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      client_id: '',
      customer_name: '',
      total_amount: '',
      status: 'pending'
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/orders', {
        ...formData,
        total_amount: parseFloat(formData.total_amount) || 0,
        items: [] // TODO: Add items support
      })
      handleCloseModal()
      fetchOrders()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order')
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : clientId
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancel: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'client_id',
      label: 'Client',
      render: (value) => getClientName(value)
    },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'total_amount',
      label: 'Total',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  return (
    <div>
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-600">View and manage orders</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
          >
            + Add Order
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search orders by customer name or status..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredOrders}
          columns={columns}
          showActions={false}
        />
        {filteredOrders.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No orders found matching "{searchTerm}"</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Order"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                className="input"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                required
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              className="input"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount *
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancel">Cancel</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Orders
