import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ParkingSimulation from '../../components/simulation/ParkingSimulation'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Navigation, Clock, DollarSign, MapPin, Car } from 'lucide-react'

export default function ActiveParking() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sl] = await Promise.all([api.getActiveSessions(), api.getParkingSlots()])
        setSessions(s)
        setSlots(sl)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <PageSpinner />

  const mySessions = sessions.filter((s: any) => s.userId === user?.id)
  const currentSession = mySessions.find((s: any) => s.status === 'ACTIVE')

  const handleExit = async (sessionId: string) => {
    try {
      await api.exitParking(sessionId)
      setLoading(true)
      const [s, sl] = await Promise.all([api.getActiveSessions(), api.getParkingSlots()])
      setSessions(s)
      setSlots(sl)
      setLoading(false)
    } catch (err) {
      console.error(err)
    }
  }

  const elapsed = currentSession?.entryTime
    ? Math.floor((Date.now() - new Date(currentSession.entryTime).getTime()) / 60000)
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Active Parking</h2>
        <p className="text-dark-400 text-sm mt-1">Monitor your current parking session</p>
      </div>

      {currentSession ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Slot</p>
                  <p className="text-lg font-bold text-dark-100">{currentSession.slotNumber || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Duration</p>
                  <p className="text-lg font-bold text-dark-100">{elapsed} min</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Est. Charges</p>
                  <p className="text-lg font-bold text-dark-100">${(elapsed * 0.05).toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
                <Car className="w-4 h-4 text-primary-400" />
                Parking Details
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-dark-500">Vehicle</p>
                  <p className="text-dark-200 font-medium">{currentSession.vehicleNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-dark-500">Entry Time</p>
                  <p className="text-dark-200 font-medium">{currentSession.entryTime ? new Date(currentSession.entryTime).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-dark-500">Status</p>
                  <Badge variant="success" dot>Active</Badge>
                </div>
                <div className="flex items-end">
                  <Button variant="danger" onClick={() => handleExit(currentSession.id)}>
                    Exit & Pay
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <ParkingSimulation vehicles={[]} slots={slots} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={<Navigation className="w-12 h-12" />}
            title="No Active Parking Session"
            description="You don't have any active parking sessions. Find a spot to park!"
          />
        </Card>
      )}
    </div>
  )
}
