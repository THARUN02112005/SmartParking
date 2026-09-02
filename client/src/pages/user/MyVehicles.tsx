import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Car, Bike, Zap, Plus, Trash2, Edit, Fuel } from 'lucide-react'

const vehicleTypeIcons: Record<string, any> = {
  CAR: Car,
  BIKE: Bike,
  EV_CAR: Zap,
  EV_BIKE: Zap,
}

const vehicleTypeColors: Record<string, string> = {
  CAR: 'text-blue-400',
  BIKE: 'text-green-400',
  EV_CAR: 'text-purple-400',
  EV_BIKE: 'text-amber-400',
}

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editVehicle, setEditVehicle] = useState<any>(null)
  const [form, setForm] = useState({ vehicleNumber: '', vehicleType: 'CAR', model: '', color: '', isEV: false })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const data = await api.getVehicles()
      setVehicles(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditVehicle(null)
    setForm({ vehicleNumber: '', vehicleType: 'CAR', model: '', color: '', isEV: false })
    setShowModal(true)
  }

  const openEdit = (v: any) => {
    setEditVehicle(v)
    setForm({ vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType, model: v.model, color: v.color, isEV: v.isEV })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editVehicle) {
        await api.updateVehicle(editVehicle.id, form)
      } else {
        await api.addVehicle(form)
      }
      setShowModal(false)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    try {
      await api.deleteVehicle(id)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Vehicles</h2>
          <p className="text-dark-400 text-sm mt-1">{vehicles.length} vehicle(s) registered</p>
        </div>
        <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add Vehicle</Button>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <EmptyState icon={<Car className="w-12 h-12" />} title="No vehicles registered" description="Add your first vehicle to get started" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const Icon = vehicleTypeIcons[v.vehicleType] || Car
            const color = vehicleTypeColors[v.vehicleType] || 'text-blue-400'
            return (
              <Card key={v.id} hover>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center ${color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-dark-100">{v.vehicleNumber}</p>
                        <p className="text-xs text-dark-400">{v.model || 'No model'}</p>
                      </div>
                    </div>
                    {v.isEV && <Badge variant="purple" size="sm">EV</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color || '#60a5fa' }} />
                      <span className="text-xs text-dark-400">{v.color || 'Unknown'}</span>
                    </div>
                    <span className="text-xs text-dark-500">{v.vehicleType.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(v)} icon={<Edit className="w-3.5 h-3.5" />}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(v.id)} icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}>
                      <span className="text-red-400">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
        <div className="space-y-4">
          <Input
            label="Vehicle Number"
            placeholder="e.g. MH12AB1234"
            value={form.vehicleNumber}
            onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
          />
          <Select
            label="Vehicle Type"
            value={form.vehicleType}
            onChange={(e) => {
              const t = e.target.value
              setForm({ ...form, vehicleType: t, isEV: t.includes('EV') })
            }}
            options={[
              { value: 'CAR', label: 'Car' },
              { value: 'BIKE', label: 'Bike' },
              { value: 'EV_CAR', label: 'Electric Car' },
              { value: 'EV_BIKE', label: 'Electric Bike' },
            ]}
          />
          <Input
            label="Model"
            placeholder="e.g. Tesla Model 3"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
          />
          <Input
            label="Color"
            placeholder="e.g. Red"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={submitting} className="flex-1">
              {editVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
