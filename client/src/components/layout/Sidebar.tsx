import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Search, Car, Navigation, CalendarClock,
  History, Bell, User, Shield, MonitorPlay, ParkingCircle,
  Map, Users, DollarSign, AlertTriangle, BarChart3, Brain,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const userNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/parking', icon: Search, label: 'Find Parking' },
  { to: '/vehicles', icon: Car, label: 'My Vehicles' },
  { to: '/active', icon: Navigation, label: 'Active Parking' },
  { to: '/reservations', icon: CalendarClock, label: 'Reservations' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/simulation', icon: MonitorPlay, label: 'Live Simulation' },
  { to: '/admin/parking', icon: ParkingCircle, label: 'Parking Management' },
  { to: '/admin/zones', icon: Map, label: 'Zone Management' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/reservations', icon: CalendarClock, label: 'Reservations' },
  { to: '/admin/pricing', icon: DollarSign, label: 'Pricing' },
  { to: '/admin/violations', icon: AlertTriangle, label: 'Violations' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/ai-logs', icon: Brain, label: 'AI Logs' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const isAdmin = user?.role === 'ADMIN'
  const navItems = isAdmin ? adminNav : userNav

  return (
    <aside
      className={clsx(
        'h-screen bg-dark-900 border-r border-dark-700/50 flex flex-col transition-all duration-300 sticky top-0',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700/50">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0">
          <ParkingCircle className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-white leading-tight">SmartParking</h1>
            <p className="text-[10px] text-cyan-400 font-medium tracking-wider">AI SYSTEM</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to ||
            (item.to !== '/admin' && item.to !== '/dashboard' && location.pathname.startsWith(item.to))
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                  : 'text-dark-400 hover:bg-dark-800 hover:text-dark-200 border border-transparent'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-primary-400')} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-2 border-t border-dark-700/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-dark-500 hover:bg-dark-800 hover:text-dark-300 transition-colors text-sm"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
