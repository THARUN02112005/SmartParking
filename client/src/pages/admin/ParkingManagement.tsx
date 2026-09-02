import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import { ParkingCircle, MapPin, Filter } from 'lucide-react'
import type { ParkingSlot } from '../../types'

export default function ParkingManagement() {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getParkingSlots()
        setSlots(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  const filtered = filter === 'ALL' ? slots : slots.filter((s) => s.status === filter)
  const counts = {
    ALL: slots.length,
    AVAILABLE: slots.filter((s) => s.status === 'AVAILABLE').length,
    OCCUPIED: slots.filter((s) => s.status === 'OCCUPIED').length,
    RESERVED: slots.filter((s) => s.status === 'RESERVED').length,
    BLOCKED: slots.filter((s) => s.status === 'BLOCKED').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Parking Management</h2>
        <p className="text-dark-400 text-sm mt-1">Manage parking slots and their statuses</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`p-3 rounded-xl border text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
                : 'bg-dark-800/40 border-dark-700/50 text-dark-400 hover:border-dark-600'
            }`}
          >
            <p className="text-lg font-bold text-dark-100">{count}</p>
            <p className="text-xs">{key}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-200">Slots ({filtered.length})</h3>
            <Filter className="w-4 h-4 text-dark-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-dark-500 border-b border-dark-700/50">
                  <th className="pb-3 font-medium">Slot</th>
                  <th className="pb-3 font-medium">Zone</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {filtered.map((slot) => (
                  <tr key={slot.id} className="hover:bg-dark-800/30 transition-colors">
                    <td className="py-3">
                      <span className="flex items-center gap-2 text-dark-200 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-dark-500" />
                        {slot.slotNumber}
                      </span>
                    </td>
                    <td className="py-3 text-dark-400">{slot.zoneName || slot.slotNumber[0]}</td>
                    <td className="py-3 text-dark-400">{slot.slotType}</td>
                    <td className="py-3"><StatusBadge status={slot.status} /></td>
                    <td className="py-3 text-dark-400">{slot.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
