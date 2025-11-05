import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts'

const DashboardEnhanced = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState(null)
  const [realtimeData, setRealtimeData] = useState([])
  const [channelData, setChannelData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [insights, setInsights] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [provider, setProvider] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [alerts, setAlerts] = useState([])
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState(null)

  // Color palette
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  useEffect(() => {
    fetchCampaigns()
  }, [provider])

  useEffect(() => {
    fetchDashboardData()
    fetchAlerts()
    const interval = setInterval(fetchDashboardData, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [dateRange, provider, campaignId])

  const fetchCampaigns = async () => {
    try {
      const res = await api.get(`/dashboard/campaigns${provider ? `?provider=${provider}` : ''}`)
      if (res.data.status === 'success') setCampaigns(res.data.data || [])
    } catch (err) {
      console.error('Fetch campaigns error:', err)
    }
  }

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/alerts')
      if (res.data.status === 'success') setAlerts(res.data.data || [])
    } catch (err) {
      console.error('Fetch alerts error:', err)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]

      // ใช้ endpoints ใหม่ที่ backend เพิ่มให้
      let queryParams = `from=${startDate}&to=${endDate}`
      if (provider) queryParams += `&provider=${provider}`
      if (campaignId) queryParams += `&campaign_id=${campaignId}`

      const [summaryRes, trendRes] = await Promise.all([
        api.get(`/dashboard/summary?${queryParams}`),
        api.get(`/dashboard/trend?${queryParams}&interval=daily`)
      ])

      // Map summary -> kpis สำหรับ UI เดิม
      if (summaryRes?.data?.data) {
        const t = summaryRes.data.data.totals || { impressions:0, clicks:0, cost:0, conversions:0, revenue:0, ctr:0, cpm:0, cpc:0, cpa:0, roas:0 }
        setKpis({
          revenue: {
            totalRevenue: Number(t.revenue || 0),
            totalOrders: Number(t.conversions || 0)
          },
          adMetrics: {
            cost: Number(t.cost || 0),
            clicks: Number(t.clicks || 0),
            impressions: Number(t.impressions || 0),
            conversions: Number(t.conversions || 0),
            ctr: (Number(t.ctr || 0) * 100).toFixed(2),
            cpm: Number(t.cpm || 0),
            cpc: Number(t.cpc || 0),
            conversionRate: (Number(t.conversions || 0) > 0 && Number(t.clicks || 0) > 0)
              ? ((t.conversions / Math.max(1, t.clicks)) * 100).toFixed(2)
              : '0.00'
          },
          performance: {
            roas: Number(t.roas || 0).toFixed(2),
            roi: (Number(t.revenue || 0) > 0 || Number(t.cost || 0) > 0)
              ? (((t.revenue - t.cost) / Math.max(1, t.cost)) * 100).toFixed(2)
              : '0.00',
            cac: (Number(t.conversions || 0) > 0)
              ? (t.cost / Math.max(1, t.conversions))
              : 0,
            ltv: 0
          }
        })
      }

      // Map trend rows -> trendData ของกราฟ
      const trend = Array.isArray(trendRes?.data?.data) ? trendRes.data.data : []
      setTrendData(trend.map(r => ({
        period: r.bucket || r.date,
        impressions: Number(r.impressions || 0),
        clicks: Number(r.clicks || 0),
        cost: Number(r.cost || 0),
        conversions: Number(r.conversions || 0)
      })))

      // ตั้งค่าเริ่มต้นสำหรับส่วนที่ยังไม่เชื่อม API ใหม่
      setRealtimeData([])
      setChannelData([])
      setInsights([])
      setAnomalies([])
      setRecommendations([])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return

    try {
      const response = await api.post('/api/ai/query', { query: aiQuery })
      setAiResponse(response.data)
      setAiQuery('')
    } catch (error) {
      console.error('Error querying AI:', error)
      setAiResponse({ success: false, answer: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' })
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

  const handleExport = async (type = 'csv') => {
    try {
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = new Date().toISOString().split('T')[0]
      let queryParams = `from=${startDate}&to=${endDate}&type=${type}`
      if (provider) queryParams += `&provider=${provider}`
      if (campaignId) queryParams += `&campaign_id=${campaignId}`

      const response = await fetch(`/api/dashboard/export?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `metrics_${Date.now()}.${type}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      console.error('Export error:', err)
      alert('เกิดข้อผิดพลาดในการ Export')
    }
  }

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดระบบ</h1>
            <p className="text-gray-600 mt-1">
              ยินดีต้อนรับ, <span className="font-medium">{user?.name || 'ผู้ใช้'}</span> ({user?.role})
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรช
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 flex items-center gap-2"
            >
              📈 Export XLSX
            </button>
          </div>
        </div>
        {/* Filters */}
        <div className="flex gap-3 flex-wrap bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">7 วันล่าสุด</option>
            <option value="30">30 วันล่าสุด</option>
            <option value="90">90 วันล่าสุด</option>
            <option value="365">1 ปีล่าสุด</option>
          </select>
          <select
            value={provider}
            onChange={(e) => {setProvider(e.target.value); setCampaignId('')}}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทุก Provider</option>
            <option value="google_ads">Google Ads</option>
            <option value="meta">Meta Ads</option>
            <option value="tiktok">TikTok Ads</option>
            <option value="ga4">Google Analytics 4</option>
          </select>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={campaigns.length === 0}
          >
            <option value="">ทุก Campaign</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.provider})</option>
            ))}
          </select>
          {(provider || campaignId) && (
            <button
              onClick={() => {setProvider(''); setCampaignId('')}}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รายได้รวม</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.revenue.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{kpis.revenue.totalOrders} คำสั่งซื้อ</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ค่าใช้จ่ายโฆษณา</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.adMetrics.cost)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(kpis.adMetrics.clicks)} คลิก
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ROI</p>
                <p className={`text-2xl font-bold mt-1 ${parseFloat(kpis.performance.roi) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpis.performance.roi}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ROAS: {kpis.performance.roas}x
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          {/* CTR */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CTR</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis.adMetrics.ctr}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CPM: {formatCurrency(kpis.adMetrics.cpm)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          {/* Conversions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(kpis.adMetrics.conversions)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  อัตรา: {kpis.adMetrics.conversionRate}%
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          {/* Impressions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Impressions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(kpis.adMetrics.impressions)}
                </p>
                <p className="text-xs text-gray-500 mt-1">การแสดงผล</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
          </div>

          {/* CAC */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CAC</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.performance.cac)}
                </p>
                <p className="text-xs text-gray-500 mt-1">ต้นทุนต่อลูกค้า</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>

          {/* LTV */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">LTV</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(kpis.performance.ltv)}
                </p>
                <p className="text-xs text-gray-500 mt-1">มูลค่าตลอดชีพ</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Agent Chat */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 AI Assistant</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAIQuery()}
            placeholder="ถามอะไรก็ได้ เช่น 'ยอดขายเดือนนี้เท่าไร' หรือ 'CTR เป็นเท่าไร'"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAIQuery}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ถาม
          </button>
        </div>
        {aiResponse && (
          <div className={`p-4 rounded-lg ${aiResponse.success ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
            <p className="text-sm text-gray-700">{aiResponse.answer}</p>
            {aiResponse.suggestions && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">คำถามที่แนะนำ:</p>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuery(suggestion)
                        handleAIQuery()
                      }}
                      className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insights & Recommendations */}
      {(insights.length > 0 || recommendations.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Insights</h2>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'positive' ? 'bg-green-50 border-green-400' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 คำแนะนำ</h2>
              <div className="space-y-3">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority === 'high' ? 'สูง' : rec.priority === 'medium' ? 'กลาง' : 'ต่ำ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Metrics (24h) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Real-time Metrics (24 ชม.)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return `${date.getHours()}:00`
                }}
              />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="clicks" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="conversions" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Channel Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#ef4444" />
              <Bar dataKey="conversions" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Analysis */}
      {trendData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📉 Trend Analysis</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Clicks" />
              <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#10b981" strokeWidth={2} name="Impressions" />
              <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} name="Cost" />
              <Line yAxisId="left" type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Anomaly Detection</h2>
          <div className="space-y-3">
            {anomalies.map((anomaly, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  anomaly.type === 'high' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{anomaly.message}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      วันที่: {anomaly.date} | {anomaly.metric}: {anomaly.value} (เฉลี่ย: {anomaly.average?.toFixed(2)})
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔔 Alerts</h2>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.status === 'active' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-gray-50 border-gray-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{alert.rule_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {alert.dimension} | สถานะ: {alert.status === 'active' ? 'กำลังใช้งาน' : 'ปิดแล้ว'}
                    </p>
                  </div>
                  {alert.status === 'active' && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/alerts/${alert.id}`, { status: 'resolved' })
                          fetchAlerts()
                        } catch (err) {
                          console.error('Resolve alert error:', err)
                        }
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      แก้ไขแล้ว
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a href="/alerts" className="text-sm text-blue-600 hover:text-blue-800">ดู Alerts ทั้งหมด →</a>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardEnhanced


