import { useState, useEffect } from 'react'
import { useSimulation } from '../../hooks/useSimulation'
import ParkingSimulation from '../../components/simulation/ParkingSimulation'
import SimulationControls from '../../components/simulation/SimulationControls'
import AIPanel from '../../components/simulation/AIPanel'
import { Card, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { Activity, Zap, Clock } from 'lucide-react'

export default function LiveSimulation() {
  const { vehicles, slots, recommendations, isPaused, loading, refresh } = useSimulation()

  if (loading) return <PageSpinner />

  const stats = {
    activeVehicles: vehicles.length,
    availableSlots: slots.filter((s) => s.status === 'AVAILABLE').length,
    occupiedSlots: slots.filter((s) => s.status === 'OCCUPIED').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Simulation</h2>
          <p className="text-dark-400 text-sm mt-1">Real-time parking lot monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isPaused ? 'warning' : 'success'} dot size="md">
            {isPaused ? 'PAUSED' : 'LIVE'}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Activity className="w-4 h-4" />
            {stats.activeVehicles} vehicles
          </div>
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Zap className="w-4 h-4 text-green-400" />
            {stats.availableSlots} free
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-4">
              <ParkingSimulation vehicles={vehicles} slots={slots} />
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-medium text-dark-200">Recent AI Decisions</h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recommendations.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex-shrink-0 p-2 bg-dark-700/50 rounded-lg text-xs min-w-[140px]">
                      <p className="text-purple-400 font-medium">Slot {r.recommendedSlot}</p>
                      <p className="text-dark-400 truncate">{r.reason}</p>
                      <p className="text-dark-500 mt-1">{r.recommendationScore}% confidence</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <SimulationControls isPaused={isPaused} stats={stats} onRefresh={refresh} />
          <AIPanel />
        </div>
      </div>
    </div>
  )
}
