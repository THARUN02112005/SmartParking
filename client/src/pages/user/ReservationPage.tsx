import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { CalendarClock, MapPin, Clock, X, Plus } from 'lucide-react'
import type { ParkingSlot } from '../../types'

export default function ReservationPage() {
  const { user } = useAuth()
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [duration, setDuration] = useState('60')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const [s, r, v] = await Promise.all([api.getParkingSlots(), api.getReservations(), api.getVehicles()])
      setSlots(s)
      setReservations(r)
      setVehicles(v)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openReserve = (slot: ParkingSlot) => {
    setSelectedSlot(slot)
    setSelectedVehicle(vehicles[0]?.id || '')
    setShowModal(true)
  }

  const handleReserve = async () => {
    if (!selectedSlot || !selectedVehicle) return
    setSubmitting(true)
    try {
      const startTime = new Date().toISOString()
      const expiryTime = new Date(Date.now() + parseInt(duration) * 60000).toISOString()
      await api.createReservation({ slotId: selectedSlot.id, vehicleId: selectedVehicle, startTime, expiryTime })
      setShowModal(false)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await api.cancelReservation(id)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <PageSpinner />

  const myReservations = reservations.filter((r: any) => r.userId === user?.id)
  const activeRes = myReservations.filter((r: any) => r.status === 'ACTIVE')
  const available = slots.filter((s) => s.status === 'AVAILABLE')

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Reservations</h2>
        <p className="text-dark-400 text-sm mt-1">Reserve your parking spot in advance</p>
      </div>

      {activeRes.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">Active Reservations</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRes.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <CalendarClock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">Slot {r.slotNumber || 'N/A'}</p>
                      <p className="text-xs text-dark-400">Vehicle: {r.vehicleNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-dark-400">
                      <p>Expires: {new Date(r.expiryTime).toLocaleTimeString()}</p>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => handleCancel(r.id)} icon={<X className="w-3 h-3" />}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-200">Available Slots ({available.length})</h3>
          </div>
        </CardHeader>
        <CardContent>
          {available.length === 0 ? (
            <EmptyState icon={<MapPin className="w-8 h-8" />} title="No available slots" description="Check back later or try a different zone" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {available.map((slot) => (
                <div key={slot.id} className="p-3 bg-dark-700/30 rounded-lg hover:bg-dark-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-dark-200">{slot.slotNumber}</span>
                    <Badge variant="success" size="sm">Available</Badge>
                  </div>
                  <p className="text-xs text-dark-500 mb-3">{slot.slotType} • {slot.zoneName || 'Zone ' + slot.slotNumber[0]}</p>
                  <Button size="sm" className="w-full" onClick={() => openReserve(slot)} icon={<Plus className="w-3.5 h-3.5" />}>
                    Reserve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Reserve Slot ${selectedSlot?.slotNumber || ''}`}>
        <div className="space-y-4">
          {vehicles.length > 0 ? (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark-300">Select Vehicle</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                {vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} - {v.vehicleType}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-dark-500 text-sm">Please add a vehicle first in My Vehicles.</p>
          )}

          <Input
            label="Duration (minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            min={15}
          />

          <div className="p-3 bg-dark-700/30 rounded-lg text-sm">
            <div className="flex justify-between text-dark-400">
              <span>Slot:</span>
              <span className="text-dark-200">{selectedSlot?.slotNumber}</span>
            </div>
            <div className="flex justify-between text-dark-400 mt-1">
              <span>Duration:</span>
              <span className="text-dark-200">{duration} min</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleReserve} loading={submitting} disabled={vehicles.length === 0} className="flex-1">
              Confirm Reservation
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
