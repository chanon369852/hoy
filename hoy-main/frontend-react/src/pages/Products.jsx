import { useEffect, useState } from 'react'
import api from '../services/api'
import Modal from '../components/Modal'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Products = () => {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [clients, setClients] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    price: '',
    stock_quantity: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchClients()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients')
      setClients(response.data)
    } catch (err) {
      console.error('Failed to fetch clients:', err)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products')
      setProducts(response.data)
      setFilteredProducts(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        client_id: product.client_id || '',
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock_quantity: product.stock_quantity || ''
      })
    } else {
      setEditingProduct(null)
      setFormData({
        client_id: user?.client_id || '',
        name: '',
        description: '',
        price: '',
        stock_quantity: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      client_id: '',
      name: '',
      description: '',
      price: '',
      stock_quantity: ''
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0
      }
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      handleCloseModal()
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product')
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.name}?`)) return
    try {
      await api.delete(`/products/${product.id}`)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product')
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : clientId
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'client_id',
      label: 'Client',
      render: (value) => getClientName(value)
    },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'price',
      label: 'Price',
      render: (value) => `$${parseFloat(value || 0).toFixed(2)}`
    },
    { key: 'stock_quantity', label: 'Stock' },
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
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your products</p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary"
          >
            + Add Product
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
          placeholder="Search products by name or description..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredProducts}
          columns={columns}
          showActions={canEdit}
          onEdit={canEdit ? handleOpenModal : null}
          onDelete={canEdit ? handleDelete : null}
        />
        {filteredProducts.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No products found matching "{searchTerm}"</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client
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
              Description
            </label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="input"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                className="input"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              />
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
              {editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Products
