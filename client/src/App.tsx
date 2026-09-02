import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import UserDashboard from './pages/user/UserDashboard'
import FindParking from './pages/user/FindParking'
import MyVehicles from './pages/user/MyVehicles'
import ActiveParking from './pages/user/ActiveParking'
import ReservationPage from './pages/user/ReservationPage'
import ParkingHistory from './pages/user/ParkingHistory'
import Notifications from './pages/user/Notifications'
import Profile from './pages/user/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import LiveSimulation from './pages/admin/LiveSimulation'
import ParkingManagement from './pages/admin/ParkingManagement'
import ZoneManagement from './pages/admin/ZoneManagement'
import UserManagement from './pages/admin/UserManagement'
import ReservationManagement from './pages/admin/ReservationManagement'
import PricingManagement from './pages/admin/PricingManagement'
import ViolationManagement from './pages/admin/ViolationManagement'
import Analytics from './pages/admin/Analytics'
import AILogs from './pages/admin/AILogs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<Layout><UserDashboard /></Layout>} />
      <Route path="/parking" element={<Layout><FindParking /></Layout>} />
      <Route path="/vehicles" element={<Layout><MyVehicles /></Layout>} />
      <Route path="/active" element={<Layout><ActiveParking /></Layout>} />
      <Route path="/reservations" element={<Layout><ReservationPage /></Layout>} />
      <Route path="/history" element={<Layout><ParkingHistory /></Layout>} />
      <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />

      <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
      <Route path="/admin/simulation" element={<Layout><LiveSimulation /></Layout>} />
      <Route path="/admin/parking" element={<Layout><ParkingManagement /></Layout>} />
      <Route path="/admin/zones" element={<Layout><ZoneManagement /></Layout>} />
      <Route path="/admin/users" element={<Layout><UserManagement /></Layout>} />
      <Route path="/admin/reservations" element={<Layout><ReservationManagement /></Layout>} />
      <Route path="/admin/pricing" element={<Layout><PricingManagement /></Layout>} />
      <Route path="/admin/violations" element={<Layout><ViolationManagement /></Layout>} />
      <Route path="/admin/analytics" element={<Layout><Analytics /></Layout>} />
      <Route path="/admin/ai-logs" element={<Layout><AILogs /></Layout>} />
    </Routes>
  )
}
