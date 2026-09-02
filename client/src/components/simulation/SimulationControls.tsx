import { useState } from 'react'
import { api } from '../../services/api'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import {
  Car, Bike, Zap, ArrowRight, Play, Pause, RotateCcw,
  AlertTriangle, Shuffle, ParkingCircle, CircleDot
} from 'lucide-react'

interface Props {
  isPaused: boolean
  stats?: { activeVehicles: number; availableSlots: number; occupiedSlots: number }
  onRefresh: () => void
}

export default function SimulationControls({ isPaused, stats, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, apiCall: () => Promise<any>) => {
    setLoading(action)
    try {
      await apiCall()
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider">Simulation Controls</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Car className="w-4 h-4" />}
            loading={loading === 'car'}
            onClick={() => handleAction('car', () => api.simulateEntry('CAR'))}
          >
            Add Car
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={<Bike className="w-4 h-4" />}
            loading={loading === 'bike'}
            onClick={() => handleAction('bike', () => api.simulateEntry('BIKE'))}
          >
            Add Bike
          </Button>
          <Button
            variant="warning"
            size="sm"
            icon={<Zap className="w-4 h-4" />}
            loading={loading === 'ev'}
            onClick={() => handleAction('ev', () => api.simulateEntry('EV_CAR'))}
          >
            Add EV
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<ArrowRight className="w-4 h-4" />}
            loading={loading === 'exit'}
            onClick={() => handleAction('exit', () => api.autoPark())}
          >
            Auto Park
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            loading={loading === 'pause'}
            onClick={() =>
              handleAction('pause', () => (isPaused ? api.resumeSimulation() : api.pauseSimulation()))
            }
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            loading={loading === 'reset'}
            onClick={() => handleAction('reset', () => api.resetSimulation())}
          >
            Reset
          </Button>
          <Button
            variant="warning"
            size="sm"
            icon={<AlertTriangle className="w-4 h-4" />}
            loading={loading === 'violation'}
            onClick={() => handleAction('violation', () => api.simulateViolation())}
          >
            Violation
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Shuffle className="w-4 h-4" />}
            loading={loading === 'traffic'}
            onClick={() => handleAction('traffic', () => api.generateRandomTraffic())}
          >
            Random Traffic
          </Button>
        </div>

        <div className="pt-3 border-t border-dark-700/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400 flex items-center gap-2">
              <CircleDot className="w-3.5 h-3.5" /> Active Vehicles
            </span>
            <span className="text-dark-200 font-medium">{stats?.activeVehicles ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400 flex items-center gap-2">
              <ParkingCircle className="w-3.5 h-3.5 text-green-400" /> Available
            </span>
            <Badge variant="success">{stats?.availableSlots ?? 0}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400 flex items-center gap-2">
              <ParkingCircle className="w-3.5 h-3.5 text-red-400" /> Occupied
            </span>
            <Badge variant="danger">{stats?.occupiedSlots ?? 0}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
