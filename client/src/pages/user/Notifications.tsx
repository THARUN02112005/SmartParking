import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  default: Bell,
}

const typeColors: Record<string, string> = {
  info: 'text-blue-400 bg-blue-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
  success: 'text-green-400 bg-green-500/10',
  default: 'text-dark-400 bg-dark-700',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const data = await api.getNotifications()
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <PageSpinner />

  const unread = notifications.filter((n) => !n.isRead)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notifications</h2>
          <p className="text-dark-400 text-sm mt-1">{unread.length} unread notification(s)</p>
        </div>
        {unread.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} icon={<CheckCheck className="w-4 h-4" />}>
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="w-12 h-12" />} title="No notifications" description="You're all caught up!" />
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell
            const color = typeColors[n.type] || typeColors.default
            return (
              <Card key={n.id} hover onClick={() => !n.isRead && markRead(n.id)}>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${n.isRead ? 'text-dark-300' : 'text-dark-100'}`}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                    </div>
                    <p className="text-xs text-dark-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-dark-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
