import { useEffect, useState } from 'react'
import api from '../services/api'
import Table from '../components/Table'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../contexts/AuthContext'

const Uploads = () => {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [filteredUploads, setFilteredUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUploads()
  }, [])

  useEffect(() => {
    const filtered = uploads.filter(upload =>
      upload.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.filepath?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUploads(filtered)
  }, [searchTerm, uploads])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const response = await api.get('/uploads')
      setUploads(response.data)
      setFilteredUploads(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch uploads')
    } finally {
      setLoading(false)
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Uploads</h1>
        <p className="mt-2 text-sm text-gray-600">View uploaded files</p>
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
          placeholder="Search uploads by filename or filepath..."
        />
      </div>

      <div className="card">
        <Table
          data={filteredUploads}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'client_id', label: 'Client ID' },
            { key: 'filename', label: 'Filename' },
            { key: 'filepath', label: 'File Path' },
            { key: 'mimetype', label: 'Type' },
            {
              key: 'size',
              label: 'Size',
              render: (value) => value ? `${(value / 1024).toFixed(2)} KB` : '-'
            },
            {
              key: 'uploaded_at',
              label: 'Uploaded',
              render: (value) => value ? new Date(value).toLocaleDateString() : '-'
            }
          ]}
          showActions={false}
        />
        {filteredUploads.length === 0 && searchTerm && (
          <p className="text-gray-500 text-center py-4">No uploads found matching "{searchTerm}"</p>
        )}
      </div>
    </div>
  )
}

export default Uploads

