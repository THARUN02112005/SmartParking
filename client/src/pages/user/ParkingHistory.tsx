import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { History, Clock, DollarSign, MapPin } from 'lucide-react'

export default function ParkingHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSessionHistory()
        setSessions(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  const mySessions = sessions
    .filter((s: any) => s.userId === user?.id)
    .filter((s: any) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (s.slotNumber || '').toLowerCase().includes(q) ||
        (s.vehicleNumber || '').toLowerCase().includes(q)
    })

  const totalRevenue = mySessions.reduce((sum: number, s: any) => sum + (s.fee || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Parking History</h2>
          <p className="text-dark-400 text-sm mt-1">{mySessions.length} session(s) • Total spent: ${totalRevenue.toFixed(2)}</p>
        </div>
        <input
          type="text"
          placeholder="Search by slot or vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-64"
        />
      </div>

      {mySessions.length === 0 ? (
        <Card>
          <EmptyState icon={<History className="w-12 h-12" />} title="No parking history" description="Your completed parking sessions will appear here" />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">Session History</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-500 border-b border-dark-700/50">
                    <th className="pb-3 font-medium">Slot</th>
                    <th className="pb-3 font-medium">Vehicle</th>
                    <th className="pb-3 font-medium">Entry</th>
                    <th className="pb-3 font-medium">Exit</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Fee</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {mySessions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-3">
                        <span className="flex items-center gap-2 text-dark-200">
                          <MapPin className="w-3.5 h-3.5 text-dark-500" />
                          {s.slotNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-dark-300">{s.vehicleNumber || 'N/A'}</td>
                      <td className="py-3 text-dark-400 text-xs">
                        {s.entryTime ? new Date(s.entryTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 text-dark-400 text-xs">
                        {s.exitTime ? new Date(s.exitTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 text-dark-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {s.duration ? `${s.duration} min` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-dark-200 font-medium">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {s.fee ? s.fee.toFixed(2) : '0.00'}
                        </span>
                      </td>
                      <td className="py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
