import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Clients = () => {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm)
    )
    setFilteredClients(filtered)
  }, [searchTerm, clients])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await api.get('/clients')
      setClients(response.data)
      setFilteredClients(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client)
      setFormData({ name: client.name || '', email: client.email || '', phone: client.phone || '' })
    } else {
      setEditingClient(null)
      setFormData({ name: '', email: '', phone: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClient(null)
    setFormData({ name: '', email: '', phone: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData)
      } else {
        await api.post('/clients', formData)
      }
      handleCloseModal()
      fetchClients()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client')
    }
  }

  const handleDelete = async (client) => {
    if (!window.confirm(`Are you sure you want to delete ${client.name}?`)) return
    try {
      await api.delete(`/clients/${client.id}`)
      fetchClients()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client')
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
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

  return (
    <div>
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your clients</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            + Add Client
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
          placeholder="Search clients by name, email, or phone..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredClients}
          columns={columns}
          showActions={(user?.role === 'admin' || user?.role === 'manager')}
          onEdit={(user?.role === 'admin' || user?.role === 'manager') ? handleOpenModal : null}
          onDelete={(user?.role === 'admin' || user?.role === 'manager') ? handleDelete : null}
        />
        {filteredClients.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No clients found matching "{searchTerm}"</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              {editingClient ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Clients
