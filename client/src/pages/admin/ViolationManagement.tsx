import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { AlertTriangle, Shield, Plus } from 'lucide-react'

export default function ViolationManagement() {
  const [violations, setViolations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const load = async () => {
    try {
      const data = await api.getViolations()
      setViolations(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const simulateViolation = async () => {
    setSimulating(true)
    try {
      await api.simulateViolation()
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSimulating(false)
    }
  }

  if (loading) return <PageSpinner />

  const unresolved = violations.filter((v: any) => !v.resolved)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Violation Management</h2>
          <p className="text-dark-400 text-sm mt-1">{unresolved.length} unresolved violation(s)</p>
        </div>
        <Button onClick={simulateViolation} loading={simulating} variant="warning" icon={<Plus className="w-4 h-4" />}>
          Simulate Violation
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => {
          const count = violations.filter((v: any) => v.severity === sev && !v.resolved).length
          return (
            <Card key={sev}>
              <CardContent className="flex items-center gap-3 py-4">
                <StatusBadge status={sev} />
                <div>
                  <p className="text-lg font-bold text-dark-100">{count}</p>
                  <p className="text-xs text-dark-500">Unresolved</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {violations.length === 0 ? (
        <Card>
          <EmptyState icon={<AlertTriangle className="w-12 h-12" />} title="No violations recorded" description="All clear! No parking violations detected." />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">All Violations</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-500 border-b border-dark-700/50">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Severity</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/30">
                  {violations.map((v: any) => (
                    <tr key={v.id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="py-3 text-dark-200 font-medium">{v.violationType}</td>
                      <td className="py-3 text-dark-400 text-xs max-w-xs truncate">{v.description}</td>
                      <td className="py-3"><StatusBadge status={v.severity} /></td>
                      <td className="py-3 text-dark-400 text-xs">{v.createdAt ? new Date(v.createdAt).toLocaleString() : 'N/A'}</td>
                      <td className="py-3">
                        <Badge variant={v.resolved ? 'success' : 'danger'} size="sm" dot>
                          {v.resolved ? 'Resolved' : 'Pending'}
                        </Badge>
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
