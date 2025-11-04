import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Alerts = () => {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [clients, setClients] = useState([])
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    metric: '',
    alert_condition: '',
    threshold: ''
  })

  useEffect(() => {
    fetchAlerts()
    fetchClients()
  }, [])

  useEffect(() => {
    const filtered = alerts.filter(alert =>
      alert.metric?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.alert_condition?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAlerts(filtered)
  }, [searchTerm, alerts])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    }
  }

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/alerts')
      setAlerts(response.data)
      setFilteredAlerts(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({
      client_id: user?.client_id || '',
      metric: '',
      alert_condition: '',
      threshold: ''
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      client_id: '',
      metric: '',
      alert_condition: '',
      threshold: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/alerts', {
        ...formData,
        threshold: parseFloat(formData.threshold) || 0
      })
      handleCloseModal()
      fetchAlerts()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create alert')
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : clientId
  }

  const getTriggeredBadge = (isTriggered) => {
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isTriggered ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
        {isTriggered ? 'Triggered' : 'Active'}
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
    { key: 'metric', label: 'Metric' },
    { key: 'alert_condition', label: 'Condition' },
    {
      key: 'threshold',
      label: 'Threshold',
      render: (value) => value ?? '-'
    },
    {
      key: 'is_triggered',
      label: 'Status',
      render: (value) => getTriggeredBadge(value)
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
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="mt-2 text-sm text-gray-600">View system alerts</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
          >
            + Add Alert
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
          placeholder="Search alerts by metric or condition..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredAlerts}
          columns={columns}
          showActions={false}
        />
        {filteredAlerts.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No alerts found matching "{searchTerm}"</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Add New Alert"
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
              Metric *
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.metric}
              onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
              placeholder="e.g. conversions, clicks"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              className="input"
              value={formData.alert_condition}
              onChange={(e) => setFormData({ ...formData, alert_condition: e.target.value })}
              required
            >
              <option value="">Select condition</option>
              <option value=">">Greater than</option>
              <option value="<">Less than</option>
              <option value=">=">Greater than or equal</option>
              <option value="<=">Less than or equal</option>
              <option value="==">Equal to</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Threshold *
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="input"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
            />
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

export default Alerts
