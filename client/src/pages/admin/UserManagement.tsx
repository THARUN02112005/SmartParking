import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Users, Mail, Phone, Shield, User } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAdminUsers()
        setUsers(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <p className="text-dark-400 text-sm mt-1">{users.length} registered user(s)</p>
      </div>

      {users.length === 0 ? (
        <Card>
          <EmptyState icon={<Users className="w-12 h-12" />} title="No users found" />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">All Users</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-500 border-b border-dark-700/50">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="text-dark-200 font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-dark-400">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </span>
                      </td>
                      <td className="py-3 text-dark-400">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          {u.phone}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'purple' : 'info'} size="sm">
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-dark-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
