import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  icon: ReactNode
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  color?: string
}

export default function StatsCard({ icon, label, value, change, trend, color = 'primary' }: Props) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary-500/20 to-primary-600/10 border-primary-500/30 text-primary-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  }

  return (
    <div className={clsx(
      'bg-gradient-to-br border rounded-xl p-5 transition-all duration-200 hover:shadow-lg',
      colorMap[color] || colorMap.primary
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-dark-100 mt-1">{value}</p>
          {change !== undefined && (
            <div className={clsx('flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-green-400' : 'text-red-400'
            )}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-dark-800/50">{icon}</div>
      </div>
    </div>
  )
}
