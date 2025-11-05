import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ProductImport = ({ onImportComplete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    apiUrl: 'https://fakestoreapi.com/products', // Example API endpoint
    apiKey: '',
    clientId: user?.client_id || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/api/products/import', formData);
      setResult(response.data);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Error importing products:', err);
      setError(err.response?.data?.message || 'Failed to import products');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">นำเข้าสินค้าจาก API ภายนอก</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">
            API URL
          </label>
          <input
            type="url"
            id="apiUrl"
            name="apiUrl"
            value={formData.apiUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            ตัวอย่าง: https://api.example.com/products
          </p>
        </div>

        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key (ถ้ามี)
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white ${isLoading ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
          >
            {isLoading ? 'กำลังนำเข้า...' : 'นำเข้าสินค้า'}
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500">
          <h3 className="text-lg font-medium text-green-800">นำเข้าสินค้าสำเร็จ!</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>นำเข้าแล้ว: {result.imported} รายการ</p>
            {result.errors > 0 && (
              <p>เกิดข้อผิดพลาด: {result.errors} รายการ</p>
            )}
          </div>
          {result.details && result.details.errors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded">
              <h4 className="font-medium text-red-800">ข้อผิดพลาด:</h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {result.details.errors.map((error, index) => (
                  <li key={index}>
                    Product ID {error.productId}: {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImport;
