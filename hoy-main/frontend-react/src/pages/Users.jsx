import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Users = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    client_id: ''
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
      fetchClients()
    }
  }, [user])

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data)
      setFilteredUsers(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'viewer',
        client_id: user.client_id || ''
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
        client_id: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
      client_id: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingUser) {
        // Update not implemented yet
        setError('Update functionality not implemented yet')
        return
      } else {
        await api.post('/users', formData)
      }
      handleCloseModal()
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user')
    }
  }

  const getClientName = (clientId) => {
    if (!clientId) return '-'
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : clientId
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'client_id',
      label: 'Client',
      render: (value) => getClientName(value)
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    }
  ]

  if (user?.role !== 'admin') {
    return (
      <div className="card">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-600">Manage system users</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary"
        >
          + Add User
        </button>
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
          placeholder="Search users by name, email, or role..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredUsers}
          columns={columns}
          showActions={false}
        />
        {filteredUsers.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No users found matching "{searchTerm}"</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
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
              Email *
            </label>
            <input
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {!editingUser && '*'}
            </label>
            <input
              type="password"
              required={!editingUser}
              className="input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              className="input"
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">None</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
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
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Users
