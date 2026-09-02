import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { User, Mail, Phone, Lock, Save } from 'lucide-react'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await api.updateProfile(form)
      await refreshUser()
      setEditing(false)
      setMessage('Profile updated successfully')
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile</h2>
        <p className="text-dark-400 text-sm mt-1">Manage your account settings</p>
      </div>

      {message && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-200">Personal Information</h3>
            {!editing && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-dark-100">{user?.name}</p>
              <p className="text-sm text-dark-400">{user?.role}</p>
            </div>
          </div>

          {editing ? (
            <>
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                icon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                icon={<Phone className="w-4 h-4" />}
              />
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} loading={saving} icon={<Save className="w-4 h-4" />}>
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-lg">
                <User className="w-4 h-4 text-dark-500" />
                <div>
                  <p className="text-xs text-dark-500">Name</p>
                  <p className="text-sm text-dark-200">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-lg">
                <Mail className="w-4 h-4 text-dark-500" />
                <div>
                  <p className="text-xs text-dark-500">Email</p>
                  <p className="text-sm text-dark-200">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-lg">
                <Phone className="w-4 h-4 text-dark-500" />
                <div>
                  <p className="text-xs text-dark-500">Phone</p>
                  <p className="text-sm text-dark-200">{user?.phone}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-dark-200">Change Password</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={password.current}
            onChange={(e) => setPassword({ ...password, current: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={password.new}
            onChange={(e) => setPassword({ ...password, new: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm new password"
            value={password.confirm}
            onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
          />
          <Button onClick={async () => {
            if (password.new !== password.confirm) return
            setSaving(true)
            try {
              await api.updateProfile({ password: password.new })
              setPassword({ current: '', new: '', confirm: '' })
              setMessage('Password updated successfully')
            } catch (err: any) {
              setMessage(err.message || 'Failed to update password')
            } finally {
              setSaving(false)
            }
          }} loading={saving} icon={<Lock className="w-4 h-4" />}>
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
