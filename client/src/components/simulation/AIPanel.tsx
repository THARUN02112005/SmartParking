import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Card, CardContent, CardHeader } from '../ui/Card'
import Badge from '../ui/Badge'
import { Brain, Wifi, WifiOff, Clock, Target, Route, Activity } from 'lucide-react'

interface AIPanelData {
  status: string
  lastDecisionTime: string
  vehicleDetected: string
  vehicleType: string
  compatibleSlots: number
  recommendedSlot: string
  confidence: number
  routeDistance: number
  recentRecommendations: { id: string; slot: string; score: number; reason: string; time: string }[]
}

export default function AIPanel() {
  const [data, setData] = useState<AIPanelData | null>(null)

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const result = await api.getAIPanel()
        setData(result)
      } catch {
        setData({
          status: 'ONLINE',
          lastDecisionTime: new Date().toISOString(),
          vehicleDetected: 'N/A',
          vehicleType: 'N/A',
          compatibleSlots: 0,
          recommendedSlot: 'N/A',
          confidence: 0,
          routeDistance: 0,
          recentRecommendations: [],
        })
      }
    }
    fetchAI()
    const interval = setInterval(fetchAI, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            AI Decision Engine
          </h3>
          <Badge variant={data?.status === 'ONLINE' ? 'success' : 'danger'} dot>
            {data?.status || 'OFFLINE'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3.5 h-3.5 text-dark-500" />
            <span className="text-dark-400">Last Decision:</span>
            <span className="text-dark-200 text-xs ml-auto">
              {data?.lastDecisionTime ? new Date(data.lastDecisionTime).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="w-3.5 h-3.5 text-dark-500" />
            <span className="text-dark-400">Vehicle:</span>
            <span className="text-dark-200 text-xs ml-auto">{data?.vehicleDetected || 'None'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-3.5 h-3.5 text-dark-500" />
            <span className="text-dark-400">Type:</span>
            <span className="text-dark-200 text-xs ml-auto">{data?.vehicleType || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dark-400 ml-5.5">Compatible Slots:</span>
            <Badge variant="info">{data?.compatibleSlots ?? 0}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-dark-400">Recommended:</span>
            <span className="text-purple-400 font-semibold text-xs ml-auto">{data?.recommendedSlot || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dark-400 ml-5.5">Confidence:</span>
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${data?.confidence ?? 0}%` }}
              />
            </div>
            <span className="text-dark-200 text-xs w-10 text-right">{data?.confidence ?? 0}%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Route className="w-3.5 h-3.5 text-dark-500" />
            <span className="text-dark-400">Route Distance:</span>
            <span className="text-dark-200 text-xs ml-auto">{data?.routeDistance ?? 0}m</span>
          </div>
        </div>

        {data?.recentRecommendations && data.recentRecommendations.length > 0 && (
          <div className="pt-3 border-t border-dark-700/50">
            <p className="text-xs font-medium text-dark-400 mb-2">Recent Decisions</p>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {data.recentRecommendations.map((rec) => (
                <div key={rec.id} className="flex items-center gap-2 text-xs">
                  <Badge variant="purple" size="sm">{rec.slot}</Badge>
                  <span className="text-dark-400 flex-1 truncate">{rec.reason}</span>
                  <span className="text-dark-500">{rec.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
