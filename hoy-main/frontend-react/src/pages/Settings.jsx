import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Settings = () => {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    refreshInterval: 5, // minutes
    kpiThresholds: {
      ctr: 1.0,
      cpa: 100,
      roi: 10,
      conversionRate: 2.0
    },
    notifications: {
      email: true,
      alertHigh: true,
      alertLow: true
    },
    theme: 'light',
    language: 'th'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('dashboardSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      // Save to localStorage (can be enhanced to save to API)
      localStorage.setItem('dashboardSettings', JSON.stringify(settings))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบและแดชบอร์ด</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
          'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Refresh Interval */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">การรีเฟรชข้อมูล</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รีเฟรชข้อมูลอัตโนมัติทุก (นาที)
            </label>
            <select
              value={settings.refreshInterval}
              onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">1 นาที</option>
              <option value="5">5 นาที</option>
              <option value="10">10 นาที</option>
              <option value="15">15 นาที</option>
              <option value="30">30 นาที</option>
              <option value="60">1 ชั่วโมง</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              ข้อมูลจะถูกอัปเดตอัตโนมัติตามช่วงเวลาที่กำหนด
            </p>
          </div>
        </div>
      </div>

      {/* KPI Thresholds */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">KPI Thresholds</h2>
        <p className="text-sm text-gray-600 mb-4">กำหนดค่า threshold สำหรับการแจ้งเตือน</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTR ต่ำสุด (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.kpiThresholds.ctr}
              onChange={(e) => setSettings({
                ...settings,
                kpiThresholds: { ...settings.kpiThresholds, ctr: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">จะแจ้งเตือนเมื่อ CTR ต่ำกว่าค่านี้</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPA สูงสุด (บาท)
            </label>
            <input
              type="number"
              step="1"
              value={settings.kpiThresholds.cpa}
              onChange={(e) => setSettings({
                ...settings,
                kpiThresholds: { ...settings.kpiThresholds, cpa: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">จะแจ้งเตือนเมื่อ CPA สูงกว่าค่านี้</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ROI ต่ำสุด (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.kpiThresholds.roi}
              onChange={(e) => setSettings({
                ...settings,
                kpiThresholds: { ...settings.kpiThresholds, roi: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">จะแจ้งเตือนเมื่อ ROI ต่ำกว่าค่านี้</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion Rate ต่ำสุด (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.kpiThresholds.conversionRate}
              onChange={(e) => setSettings({
                ...settings,
                kpiThresholds: { ...settings.kpiThresholds, conversionRate: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">จะแจ้งเตือนเมื่อ Conversion Rate ต่ำกว่าค่านี้</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">การแจ้งเตือน</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">ส่งอีเมลแจ้งเตือน</label>
              <p className="text-xs text-gray-500">รับการแจ้งเตือนทางอีเมล</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, email: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">แจ้งเตือนเมื่อค่าเกิน threshold</label>
              <p className="text-xs text-gray-500">แจ้งเตือนเมื่อค่าใดๆ สูงกว่าที่กำหนด</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.alertHigh}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, alertHigh: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">แจ้งเตือนเมื่อค่าต่ำกว่า threshold</label>
              <p className="text-xs text-gray-500">แจ้งเตือนเมื่อค่าใดๆ ต่ำกว่าที่กำหนด</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications.alertLow}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, alertLow: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">การแสดงผล</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ธีม</label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">สว่าง</option>
              <option value="dark">มืด</option>
              <option value="auto">อัตโนมัติ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ภาษา</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              กำลังบันทึก...
            </>
          ) : (
            'บันทึกการตั้งค่า'
          )}
        </button>
      </div>
    </div>
  )
}

export default Settings



