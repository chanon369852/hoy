import { useState, useEffect } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'

const AdMetrics = () => {
  const { user } = useAuth()
  const [clientId, setClientId] = useState('')
  const [metrics, setMetrics] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    campaign: '',
    channel: '',
    clicks: '',
    impressions: '',
    conversions: '',
    cost: ''
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
      const response = await api.get(`/ad-metrics/${clientId}`)
      setMetrics(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch ad metrics')
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ad Metrics</h1>
        <p className="mt-2 text-sm text-gray-600">View advertising metrics by client</p>
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
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {Object.keys(metrics[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, idx) => (
                  <tr key={idx}>
                    {Object.values(metric).map((value, i) => (
                      <td key={i}>{value ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && metrics.length === 0 && clientId && (
        <div className="card">
          <p className="text-gray-500 text-center py-8">No metrics found for this client</p>
        </div>
      )}

      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            + Add Ad Metrics
          </button>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Ad Metrics"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign
              </label>
              <input
                type="text"
                className="input"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <input
                type="text"
                className="input"
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clicks
              </label>
              <input
                type="number"
                className="input"
                value={formData.clicks}
                onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impressions
              </label>
              <input
                type="number"
                className="input"
                value={formData.impressions}
                onChange={(e) => setFormData({ ...formData, impressions: e.target.value })}
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
                Cost
              </label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/ad-metrics', {
        client_id: formData.client_id,
        campaign: formData.campaign || null,
        channel: formData.channel || null,
        clicks: parseInt(formData.clicks) || 0,
        impressions: parseInt(formData.impressions) || 0,
        conversions: parseInt(formData.conversions) || 0,
        cost: parseFloat(formData.cost) || 0
      })
      setIsModalOpen(false)
      setFormData({
        client_id: '',
        campaign: '',
        channel: '',
        clicks: '',
        impressions: '',
        conversions: '',
        cost: ''
      })
      if (clientId) fetchMetrics()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ad metrics')
    }
  }
}

export default AdMetrics

