import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import StatsCard from '../../components/dashboard/StatsCard'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { Car, Navigation, CalendarClock, Bell, Clock, MapPin } from 'lucide-react'

export default function UserDashboard() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [v, s, r, n] = await Promise.allSettled([
          api.getVehicles(),
          api.getActiveSessions(),
          api.getReservations(),
          api.getNotifications(),
        ])
        if (v.status === 'fulfilled') setVehicles(v.value)
        if (s.status === 'fulfilled') setActiveSessions(s.value)
        if (r.status === 'fulfilled') setReservations(r.value)
        if (n.status === 'fulfilled') setNotifications(n.value)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  const mySessions = activeSessions.filter((s: any) => s.userId === user?.id)
  const myReservations = reservations.filter((r: any) => r.userId === user?.id && r.status === 'ACTIVE')
  const unreadNotifs = notifications.filter((n: any) => !n.isRead)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-dark-400 text-sm mt-1">Here's your parking overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Car className="w-5 h-5 text-blue-400" />} label="My Vehicles" value={vehicles.length} color="primary" />
        <StatsCard icon={<Navigation className="w-5 h-5 text-green-400" />} label="Active Parking" value={mySessions.length} color="green" />
        <StatsCard icon={<CalendarClock className="w-5 h-5 text-amber-400" />} label="Reservations" value={myReservations.length} color="amber" />
        <StatsCard icon={<Bell className="w-5 h-5 text-red-400" />} label="Notifications" value={unreadNotifs.length} color="red" />
      </div>

      {mySessions.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-green-400" />
              Current Parking Session
            </h3>
          </CardHeader>
          <CardContent>
            {mySessions.map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-dark-700/30 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-dark-200">Slot {s.slotNumber || 'N/A'}</p>
                  <p className="text-xs text-dark-400">Vehicle: {s.vehicleNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {s.entryTime ? new Date(s.entryTime).toLocaleTimeString() : 'N/A'}
                  </p>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">Recent Notifications</h3>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((n: any) => (
                  <div key={n.id} className={`p-3 rounded-lg text-sm ${n.isRead ? 'bg-dark-800/30' : 'bg-primary-500/5 border border-primary-500/10'}`}>
                    <p className="font-medium text-dark-200">{n.title}</p>
                    <p className="text-dark-400 text-xs mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">My Vehicles</h3>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-dark-500 text-sm text-center py-4">No vehicles registered</p>
            ) : (
              <div className="space-y-2">
                {vehicles.slice(0, 4).map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 bg-dark-800/30 rounded-lg">
                    <Car className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-sm font-medium text-dark-200">{v.vehicleNumber}</p>
                      <p className="text-xs text-dark-400">{v.vehicleType.replace('_', ' ')} - {v.model}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
