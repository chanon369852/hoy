import { useState, useEffect } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import { useAuth } from '../contexts/AuthContext'

const SeoMetrics = () => {
  const { user } = useAuth()
  const [clientId, setClientId] = useState('')
  const [metrics, setMetrics] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    keyword: '',
    position: '',
    traffic: '',
    conversions: '',
    date: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    }
  }

  const fetchMetrics = async () => {
    if (!clientId) {
      setError('Please enter a Client ID')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await api.get(`/seo-metrics/${clientId}`)
      setMetrics(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch SEO metrics')
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/seo-metrics', {
        client_id: formData.client_id,
        keyword: formData.keyword || null,
        position: formData.position ? parseInt(formData.position) : null,
        traffic: formData.traffic ? parseInt(formData.traffic) : null,
        conversions: formData.conversions ? parseInt(formData.conversions) : null,
        date: formData.date || null
      })
      setIsModalOpen(false)
      setFormData({
        client_id: '',
        keyword: '',
        position: '',
        traffic: '',
        conversions: '',
        date: ''
      })
      if (clientId) fetchMetrics()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create SEO metrics')
    }
  }

  const columns = [
    { key: 'keyword', label: 'Keyword' },
    { key: 'position', label: 'Position' },
    { key: 'traffic', label: 'Traffic' },
    { key: 'conversions', label: 'Conversions' },
    {
      key: 'date',
      label: 'Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SEO Metrics</h1>
        <p className="mt-2 text-sm text-gray-600">View SEO metrics by client</p>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              id="clientId"
              type="number"
              className="input"
              placeholder="e.g. 1"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button onClick={fetchMetrics} disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Loading...' : 'Load Metrics'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {metrics.length > 0 && (
        <div className="card mb-6">
          <Table
            data={metrics}
            columns={columns}
            showActions={false}
          />
        </div>
      )}

      {!loading && !error && metrics.length === 0 && clientId && (
        <div className="card mb-6">
          <p className="text-gray-500 text-center py-8">No metrics found for this client</p>
        </div>
      )}

      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Add SEO Metrics
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add SEO Metrics"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyword *
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="number"
                className="input"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Traffic
              </label>
              <input
                type="number"
                className="input"
                value={formData.traffic}
                onChange={(e) => setFormData({ ...formData, traffic: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversions
              </label>
              <input
                type="number"
                className="input"
                value={formData.conversions}
                onChange={(e) => setFormData({ ...formData, conversions: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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

export default SeoMetrics
