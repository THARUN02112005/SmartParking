import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardContent } from '../ui/Card'

const mockData = [
  { time: '6 AM', occupancy: 20 },
  { time: '8 AM', occupancy: 55 },
  { time: '10 AM', occupancy: 78 },
  { time: '12 PM', occupancy: 92 },
  { time: '2 PM', occupancy: 85 },
  { time: '4 PM', occupancy: 70 },
  { time: '6 PM', occupancy: 60 },
  { time: '8 PM', occupancy: 40 },
  { time: '10 PM', occupancy: 25 },
]

interface Props {
  data?: { time: string; occupancy: number }[]
}

export default function OccupancyChart({ data = mockData }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-dark-200">Occupancy Trends</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
            />
            <Area type="monotone" dataKey="occupancy" stroke="#3b82f6" strokeWidth={2} fill="url(#occGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
