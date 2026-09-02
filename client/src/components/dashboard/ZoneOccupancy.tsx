import { Card, CardHeader, CardContent } from '../ui/Card'

const mockData = [
  { zone: 'Zone A (Cars)', total: 12, occupied: 9, color: '#3b82f6' },
  { zone: 'Zone B (Bikes)', total: 12, occupied: 5, color: '#22c55e' },
  { zone: 'Zone C (EV)', total: 8, occupied: 6, color: '#a855f7' },
  { zone: 'Zone D (Premium)', total: 8, occupied: 3, color: '#f59e0b' },
]

interface Props {
  data?: { zone: string; total: number; occupied: number; color: string }[]
}

export default function ZoneOccupancy({ data = mockData }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-dark-200">Zone Utilization</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((z) => {
          const pct = Math.round((z.occupied / z.total) * 100)
          return (
            <div key={z.zone}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-dark-300">{z.zone}</span>
                <span className="text-dark-400 text-xs">{z.occupied}/{z.total} ({pct}%)</span>
              </div>
              <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: z.color }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
