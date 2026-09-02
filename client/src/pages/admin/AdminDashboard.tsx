import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import StatsCard from '../../components/dashboard/StatsCard'
import OccupancyChart from '../../components/dashboard/OccupancyChart'
import RevenueChart from '../../components/dashboard/RevenueChart'
import VehicleTypePie from '../../components/dashboard/VehicleTypePie'
import ZoneOccupancy from '../../components/dashboard/ZoneOccupancy'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import {
  ParkingCircle, Car, Users, DollarSign, BarChart3,
  Navigation, AlertTriangle, Clock
} from 'lucide-react'
import type { DashboardStats } from '../../types'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [vehicleTypeData, setVehicleTypeData] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, ses, v, occ, rev, vt, zn] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getActiveSessions(),
          api.getViolations(),
          api.getOccupancyAnalytics(7),
          api.getRevenueAnalytics(7),
          api.getVehicleTypeAnalytics(),
          api.getZoneOccupancyAnalytics(),
        ])
        if (s.status === 'fulfilled') setStats(s.value)
        if (ses.status === 'fulfilled') setSessions(ses.value)
        if (v.status === 'fulfilled') setViolations(v.value || [])
        if (occ.status === 'fulfilled' && occ.value) {
          const grouped: Record<string, number> = {}
          for (const point of occ.value) {
            const key = `${point.date} ${point.hour}:00`
            grouped[key] = point.occupancy
          }
          setOccupancyData(Object.entries(grouped).slice(-12).map(([time, occupancy]) => ({ time: time.split(' ')[1], occupancy })))
        }
        if (rev.status === 'fulfilled' && rev.value) {
          setRevenueData(rev.value.map((r: any) => ({ day: r.date || r.day, revenue: r.revenue || r.total || 0 })))
        }
        if (vt.status === 'fulfilled' && vt.value) {
          setVehicleTypeData(vt.value.map((v: any) => ({ name: v.vehicleType || v.name, value: v.count || v.value || 0 })))
        }
        if (zn.status === 'fulfilled' && zn.value) {
          setZoneData(zn.value.map((z: any) => ({
            zone: z.zoneName || z.zone,
            total: z.totalSlots || z.total || 0,
            occupied: z.occupiedSlots || z.occupied || 0,
            color: z.color || '#3b82f6',
          })))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-dark-400 text-sm mt-1">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<ParkingCircle className="w-5 h-5 text-blue-400" />} label="Total Slots" value={stats?.totalSlots ?? 0} color="primary" />
        <StatsCard icon={<Car className="w-5 h-5 text-green-400" />} label="Occupancy" value={`${stats?.occupancyPercentage ?? 0}%`} color="green" />
        <StatsCard icon={<Navigation className="w-5 h-5 text-cyan-400" />} label="Active Vehicles" value={stats?.activeVehicles ?? 0} color="cyan" />
        <StatsCard icon={<DollarSign className="w-5 h-5 text-amber-400" />} label="Today's Revenue" value={`₹${stats?.todayRevenue ?? 0}`} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={<Car className="w-5 h-5 text-green-400" />} label="Available" value={stats?.availableSlots ?? 0} color="green" />
        <StatsCard icon={<Car className="w-5 h-5 text-red-400" />} label="Occupied" value={stats?.occupiedSlots ?? 0} color="red" />
        <StatsCard icon={<BarChart3 className="w-5 h-5 text-purple-400" />} label="Today's Sessions" value={stats?.todaySessions ?? 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart data={occupancyData.length > 0 ? occupancyData : undefined} />
        <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleTypePie data={vehicleTypeData.length > 0 ? vehicleTypeData : undefined} />
        <ZoneOccupancy data={zoneData.length > 0 ? zoneData : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-green-400" />
              Active Sessions ({sessions.length})
            </h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {sessions.length === 0 ? (
                <p className="text-dark-500 text-sm text-center py-4">No active sessions</p>
              ) : (
                sessions.slice(0, 8).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-dark-700/30 rounded-lg text-sm">
                    <div>
                      <p className="text-dark-200">{s.slotNumber || 'N/A'}</p>
                      <p className="text-xs text-dark-500">{s.vehicleNumber || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-dark-400 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.entryTime ? new Date(s.entryTime).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Recent Violations
            </h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {violations.length === 0 ? (
                <p className="text-dark-500 text-sm text-center py-4">No violations</p>
              ) : (
                violations.slice(0, 8).map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 bg-dark-700/30 rounded-lg text-sm">
                    <div>
                      <p className="text-dark-200">{v.violationType}</p>
                      <p className="text-xs text-dark-500">{v.description}</p>
                    </div>
                    <StatusBadge status={v.severity} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
