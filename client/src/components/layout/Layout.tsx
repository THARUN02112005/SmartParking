import { ReactNode, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'
import { PageSpinner } from '../ui/Spinner'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/parking': 'Find Parking',
  '/vehicles': 'My Vehicles',
  '/active': 'Active Parking',
  '/reservations': 'Reservations',
  '/history': 'Parking History',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/admin': 'Admin Dashboard',
  '/admin/simulation': 'Live Simulation',
  '/admin/parking': 'Parking Management',
  '/admin/zones': 'Zone Management',
  '/admin/users': 'User Management',
  '/admin/reservations': 'Reservation Management',
  '/admin/pricing': 'Pricing Management',
  '/admin/violations': 'Violation Management',
  '/admin/analytics': 'Analytics',
  '/admin/ai-logs': 'AI Decision Logs',
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <PageSpinner />
      </div>
    )
  }

  if (!user) return null

  const title = pageTitles[location.pathname] || 'SmartParking'

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
