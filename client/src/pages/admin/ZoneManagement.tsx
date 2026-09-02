import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Map, Plus, Edit, Trash2 } from 'lucide-react'
import type { ParkingZone } from '../../types'

export default function ZoneManagement() {
  const [zones, setZones] = useState<ParkingZone[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editZone, setEditZone] = useState<ParkingZone | null>(null)
  const [form, setForm] = useState({ name: '', description: '', zoneType: 'STANDARD', color: '#3b82f6' })
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const data = await api.getParkingZones()
      setZones(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditZone(null)
    setForm({ name: '', description: '', zoneType: 'STANDARD', color: '#3b82f6' })
    setShowModal(true)
  }

  const openEdit = (z: ParkingZone) => {
    setEditZone(z)
    setForm({ name: z.name, description: z.description, zoneType: z.zoneType, color: z.color })
    setShowModal(true)
  }

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Zone Management</h2>
          <p className="text-dark-400 text-sm mt-1">{zones.length} zone(s) configured</p>
        </div>
        <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add Zone</Button>
      </div>

      {zones.length === 0 ? (
        <Card>
          <EmptyState icon={<Map className="w-12 h-12" />} title="No zones configured" description="Create your first parking zone" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card key={zone.id} hover>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: zone.color + '20' }}>
                      <Map className="w-5 h-5" style={{ color: zone.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-dark-100">{zone.name}</h4>
                      <p className="text-xs text-dark-500">{zone.zoneType}</p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">{zone.zoneType}</Badge>
                </div>
                <p className="text-sm text-dark-400 mb-4">{zone.description || 'No description'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(zone)} icon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editZone ? 'Edit Zone' : 'Add Zone'}>
        <div className="space-y-4">
          <Input
            label="Zone Name"
            placeholder="e.g. Zone A"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="Describe this zone"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-dark-300">Zone Type</label>
            <select
              value={form.zoneType}
              onChange={(e) => setForm({ ...form, zoneType: e.target.value })}
              className="w-full px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              <option value="STANDARD">Standard</option>
              <option value="COMPACT">Compact</option>
              <option value="EV">EV Charging</option>
              <option value="PREMIUM">Premium</option>
              <option value="HANDICAPPED">Handicapped</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-dark-300">Color</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full h-10 bg-dark-800 border border-dark-600 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => { setShowModal(false) }} loading={submitting} className="flex-1">
              {editZone ? 'Update Zone' : 'Create Zone'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
