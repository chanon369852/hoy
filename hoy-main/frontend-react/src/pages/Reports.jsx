import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const Reports = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    channel: '',
    campaign: ''
  })
  const [channels, setChannels] = useState([])
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    fetchChannels()
    fetchReportData()
  }, [filters])

  const fetchChannels = async () => {
    try {
      const response = await api.get('/api/dashboard/channels')
      if (response.data.success) {
        const uniqueChannels = [...new Set(response.data.data.map(c => c.channel))]
        setChannels(uniqueChannels)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.campaign && { campaign: filters.campaign })
      })

      const response = await api.get(`/api/reports/detailed?${params}`)
      if (response.data.success) {
        setReportData(response.data.data)
        setSummary(response.data.summary)
        
        // Extract unique campaigns
        const uniqueCampaigns = [...new Set(response.data.data.map(r => r.campaign).filter(Boolean))]
        setCampaigns(uniqueCampaigns)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.campaign && { campaign: filters.campaign })
      })

      const response = await api.get(`/api/reports/export/csv?${params}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report_${filters.startDate}_${filters.endDate}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num)
  }

  // Group data by date for chart
  const chartData = reportData.reduce((acc, item) => {
    const existing = acc.find(a => a.date === item.date)
    if (existing) {
      existing.clicks += item.clicks || 0
      existing.impressions += item.impressions || 0
      existing.conversions += item.conversions || 0
      existing.cost += parseFloat(item.cost || 0)
    } else {
      acc.push({
        date: item.date,
        clicks: item.clicks || 0,
        impressions: item.impressions || 0,
        conversions: item.conversions || 0,
        cost: parseFloat(item.cost || 0)
      })
    }
    return acc
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงานแบบละเอียด</h1>
          <p className="text-gray-600 mt-1">วิเคราะห์ข้อมูลการโฆษณาและประสิทธิภาพ</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรองข้อมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ช่องทาง</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {channels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">แคมเปญ</label>
            <select
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">ทั้งหมด</option>
              {campaigns.map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">คลิกทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(summary.total_clicks || 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Impressions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(summary.total_impressions || 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Conversion</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(summary.total_conversions || 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">ค่าใช้จ่าย</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.total_cost || 0)}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">กราฟแสดงผล</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="clicks" fill="#3b82f6" name="Clicks" />
              <Bar yAxisId="left" dataKey="impressions" fill="#10b981" name="Impressions" />
              <Bar yAxisId="right" dataKey="cost" fill="#ef4444" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">ตารางข้อมูล</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ช่องทาง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แคมเปญ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คลิก</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าใช้จ่าย</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">ไม่พบข้อมูล</td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.channel || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.campaign || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.clicks || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.impressions || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.conversions || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.cost || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{parseFloat(row.ctr || 0).toFixed(2)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.cpa || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports



