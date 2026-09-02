import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardHeader, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner, EmptyState } from '../../components/ui/Spinner'
import { Brain, Clock, Target, BarChart3 } from 'lucide-react'

export default function AILogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [panel, setPanel] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [l, p] = await Promise.allSettled([api.getAILogs(), api.getAIPanel()])
        if (l.status === 'fulfilled') setLogs(Array.isArray(l.value) ? l.value : [])
        if (p.status === 'fulfilled') setPanel(p.value)
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
        <h2 className="text-2xl font-bold text-white">AI Decision Logs</h2>
        <p className="text-dark-400 text-sm mt-1">Track AI recommendation history and decision explanations</p>
      </div>

      {panel && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Status</p>
                <Badge variant={panel.status === 'ONLINE' ? 'success' : 'danger'} dot>{panel.status}</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Last Decision</p>
                <p className="text-sm font-medium text-dark-200">{panel.lastDecisionTime ? new Date(panel.lastDecisionTime).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Avg Confidence</p>
                <p className="text-sm font-medium text-dark-200">{panel.confidence || 0}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-dark-500">Total Decisions</p>
                <p className="text-sm font-medium text-dark-200">{logs.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {logs.length === 0 ? (
        <Card>
          <EmptyState icon={<Brain className="w-12 h-12" />} title="No AI logs yet" description="AI decision logs will appear as the system processes vehicles" />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-dark-200">Decision History ({logs.length})</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log: any, i: number) => (
                <div key={log.id || i} className="p-4 bg-dark-700/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-dark-200">
                        Slot: <span className="text-purple-400">{log.recommendedSlot || log.slot || 'N/A'}</span>
                      </span>
                    </div>
                    <Badge variant="purple" size="sm">{log.recommendationScore || log.score || 0}%</Badge>
                  </div>
                  <p className="text-xs text-dark-400 mb-2">{log.reason || 'AI recommendation'}</p>
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </span>
                    {log.vehicleId && <span>Vehicle: {log.vehicleId.slice(0, 8)}...</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
