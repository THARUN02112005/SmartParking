import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import OccupancyChart from '../../components/dashboard/OccupancyChart'
import RevenueChart from '../../components/dashboard/RevenueChart'
import VehicleTypePie from '../../components/dashboard/VehicleTypePie'
import ZoneOccupancy from '../../components/dashboard/ZoneOccupancy'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { BarChart3, Brain, TrendingUp, Clock } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts'

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [occupancyData, setOccupancyData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [vehicleTypeData, setVehicleTypeData] = useState<any[]>([])
  const [zoneData, setZoneData] = useState<any[]>([])
  const [peakHours, setPeakHours] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [occ, rev, vt, zn, pk, pr] = await Promise.allSettled([
          api.getOccupancyAnalytics(7),
          api.getRevenueAnalytics(7),
          api.getVehicleTypeAnalytics(),
          api.getZoneOccupancyAnalytics(),
          api.getPeakHoursAnalytics(),
          api.getPredictions(),
        ])

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

        if (pk.status === 'fulfilled' && pk.value) {
          setPeakHours(pk.value.map((h: any) => ({
            hour: `${h.hour}:00`,
            cars: h.cars || 0,
            bikes: h.bikes || 0,
            ev: h.ev || h.evs || 0,
          })))
        }

        if (pr.status === 'fulfilled' && pr.value) {
          const pred = pr.value
          setPredictions([
            { metric: 'Tomorrow Peak', value: `${pred.peakOccupancy || 85}%`, time: 'Peak hour forecast', confidence: pred.confidence || 80 },
            { metric: 'Revenue Forecast', value: `₹${pred.predictedRevenue || 2400}`, time: 'Next 7 days', confidence: 75 },
            { metric: 'Slot Demand', value: pred.demandLevel || 'Medium', time: 'Weekly trend', confidence: 72 },
            { metric: 'Avg Duration', value: `${pred.avgDuration || 2.5}h`, time: 'Current average', confidence: 85 },
          ])
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
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <p className="text-dark-400 text-sm mt-1">Comprehensive parking analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyChart data={occupancyData.length > 0 ? occupancyData : undefined} />
        <RevenueChart data={revenueData.length > 0 ? revenueData : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleTypePie data={vehicleTypeData.length > 0 ? vehicleTypeData : undefined} />
        <ZoneOccupancy data={zoneData.length > 0 ? zoneData : undefined} />
      </div>

      {peakHours.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Peak Hours Analysis
            </h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                />
                <Legend formatter={(v: string) => <span className="text-dark-300 text-xs">{v}</span>} />
                <Bar dataKey="cars" fill="#60a5fa" name="Cars" radius={[2, 2, 0, 0]} />
                <Bar dataKey="bikes" fill="#34d399" name="Bikes" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ev" fill="#a78bfa" name="EV" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {occupancyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Occupancy Trend
              </h3>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2} name="Occupancy %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Predictions
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {predictions.length === 0 ? (
                <p className="text-dark-500 text-sm text-center py-4">No predictions available</p>
              ) : (
                predictions.map((p) => (
                  <div key={p.metric} className="p-3 bg-dark-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-dark-200">{p.metric}</span>
                      <Badge variant="purple" size="sm">{p.confidence}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-400">{p.value}</span>
                      <span className="text-xs text-dark-500">{p.time}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: `${p.confidence}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
