import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardContent } from '../ui/Card'

const mockData = [
  { day: 'Mon', revenue: 1200 },
  { day: 'Tue', revenue: 1500 },
  { day: 'Wed', revenue: 900 },
  { day: 'Thu', revenue: 1800 },
  { day: 'Fri', revenue: 2200 },
  { day: 'Sat', revenue: 2500 },
  { day: 'Sun', revenue: 1800 },
]

interface Props {
  data?: { day: string; revenue: number }[]
}

export default function RevenueChart({ data = mockData }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-dark-200">Revenue Analysis</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value: number) => [`₹${value}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
