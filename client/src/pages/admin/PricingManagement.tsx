import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { DollarSign, Save, Edit } from 'lucide-react'

interface PricingItem {
  id: string
  vehicleType: string
  pricePerHour: number
  minimumFee: number
}

export default function PricingManagement() {
  const [pricing, setPricing] = useState<PricingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ pricePerHour: 0, minimumFee: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPricing()
        setPricing(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const startEdit = (item: PricingItem) => {
    setEditing(item.id)
    setForm({ pricePerHour: item.pricePerHour, minimumFee: item.minimumFee })
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    try {
      await api.updatePricing(id, form)
      setEditing(null)
      const data = await api.getPricing()
      setPricing(data)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  const vehicleLabels: Record<string, string> = {
    CAR: 'Car',
    BIKE: 'Bike',
    EV_CAR: 'Electric Car',
    EV_BIKE: 'Electric Bike',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Pricing Management</h2>
        <p className="text-dark-400 text-sm mt-1">Configure pricing for each vehicle type</p>
      </div>

      {pricing.length === 0 ? (
        <Card>
          <EmptyState icon={<DollarSign className="w-12 h-12" />} title="No pricing configured" description="Set up pricing for your parking zones" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pricing.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-dark-200">{vehicleLabels[item.vehicleType] || item.vehicleType}</h3>
                  {editing !== item.id && (
                    <Button size="sm" variant="ghost" onClick={() => startEdit(item)} icon={<Edit className="w-3.5 h-3.5" />}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing === item.id ? (
                  <div className="space-y-3">
                    <Input
                      label="Price Per Hour (₹)"
                      type="number"
                      value={form.pricePerHour}
                      onChange={(e) => setForm({ ...form, pricePerHour: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      label="Minimum Fee (₹)"
                      type="number"
                      value={form.minimumFee}
                      onChange={(e) => setForm({ ...form, minimumFee: parseFloat(e.target.value) || 0 })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(item.id)} loading={saving} icon={<Save className="w-3.5 h-3.5" />}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Price Per Hour:</span>
                      <span className="text-dark-200 font-medium">₹{item.pricePerHour}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-400">Minimum Fee:</span>
                      <span className="text-dark-200 font-medium">₹{item.minimumFee}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
