import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { CalendarClock, X } from 'lucide-react'

export default function ReservationManagement() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const load = async () => {
    try {
      const data = await api.getAdminReservations()
      setReservations(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id: string) => {
    try {
      await api.cancelReservation(id)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <PageSpinner />

  const filtered = filter === 'ALL' ? reservations : reservations.filter((r) => r.status === filter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Reservation Management</h2>
        <p className="text-dark-400 text-sm mt-1">{reservations.length} total reservation(s)</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
            }`}
          >
            {f} ({f === 'ALL' ? reservations.length : reservations.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<CalendarClock className="w-12 h-12" />} title="No reservations found" />
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-500 border-b border-dark-700/50">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Slot</th>
                    <th className="pb-3 font-medium">Vehicle</th>
                    <th className="pb-3 font-medium">Start</th>
                    <th className="pb-3 font-medium">Expiry</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {filtered.map((r: any) => (
                    <tr key={r.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-3 text-dark-200">{r.userName || r.userEmail || 'N/A'}</td>
                      <td className="py-3 text-dark-200 font-medium">{r.slotNumber || 'N/A'}</td>
                      <td className="py-3 text-dark-400">{r.vehicleNumber || 'N/A'}</td>
                      <td className="py-3 text-dark-400 text-xs">{new Date(r.startTime).toLocaleString()}</td>
                      <td className="py-3 text-dark-400 text-xs">{new Date(r.expiryTime).toLocaleString()}</td>
                      <td className="py-3"><StatusBadge status={r.status} /></td>
                      <td className="py-3">
                        {r.status === 'ACTIVE' && (
                          <Button size="sm" variant="danger" onClick={() => handleCancel(r.id)} icon={<X className="w-3 h-3" />}>
                            Cancel
                          </Button>
                        )}
                      </td>
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
