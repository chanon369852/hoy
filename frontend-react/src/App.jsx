import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Users from './pages/Users'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Alerts from './pages/Alerts'
import AdMetrics from './pages/AdMetrics'
import SeoMetrics from './pages/SeoMetrics'
import Uploads from './pages/Uploads'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="users" element={<Users />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="ad-metrics" element={<AdMetrics />} />
            <Route path="seo-metrics" element={<SeoMetrics />} />
            <Route path="uploads" element={<Uploads />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App



