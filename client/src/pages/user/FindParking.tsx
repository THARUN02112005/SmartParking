import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import ParkingSimulation from '../../components/simulation/ParkingSimulation'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import { Search, MapPin, Brain, Zap } from 'lucide-react'
import type { ParkingSlot } from '../../types'

export default function FindParking() {
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, v] = await Promise.all([api.getParkingSlots(), api.getVehicles()])
        setSlots(s)
        setVehicles(v)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  const filtered = filter === 'ALL' ? slots : slots.filter((s) => s.status === filter)
  const available = slots.filter((s) => s.status === 'AVAILABLE')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Find Parking</h2>
          <p className="text-dark-400 text-sm mt-1">{available.length} slots available</p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-dark-500" />
          <input
            type="text"
            placeholder="Search slots..."
            className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-48"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <ParkingSimulation vehicles={[]} slots={slots} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Recommendation
              </h3>
            </CardHeader>
            <CardContent>
              {available.length > 0 ? (
                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                  <p className="text-sm text-dark-200">
                    Best slot: <span className="text-purple-400 font-semibold">{available[0].slotNumber}</span>
                  </p>
                  <p className="text-xs text-dark-400 mt-1">Based on proximity and vehicle type</p>
                  <Button size="sm" variant="ghost" className="mt-2" icon={<Zap className="w-3.5 h-3.5" />}>
                    Quick Reserve
                  </Button>
                </div>
              ) : (
                <p className="text-dark-500 text-sm">No available slots</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-dark-200">Available Slots</h3>
                <div className="flex gap-1">
                  {['ALL', 'AVAILABLE', 'RESERVED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${
                        filter === f ? 'bg-primary-600 text-white' : 'text-dark-400 hover:bg-dark-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filtered.length === 0 ? (
                  <p className="text-dark-500 text-sm text-center py-4">No slots found</p>
                ) : (
                  filtered.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg hover:bg-dark-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-dark-500" />
                        <div>
                          <p className="text-sm font-medium text-dark-200">{slot.slotNumber}</p>
                          <p className="text-xs text-dark-500">{slot.slotType}</p>
                        </div>
                      </div>
                      <StatusBadge status={slot.status} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
