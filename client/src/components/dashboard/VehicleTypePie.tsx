import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardContent } from '../ui/Card'

const COLORS = ['#60a5fa', '#34d399', '#a78bfa', '#fbbf24']

const mockData = [
  { name: 'Cars', value: 45 },
  { name: 'Bikes', value: 25 },
  { name: 'EV Cars', value: 20 },
  { name: 'EV Bikes', value: 10 },
]

interface Props {
  data?: { name: string; value: number }[]
}

export default function VehicleTypePie({ data = mockData }: Props) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-dark-200">Vehicle Distribution</h3>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
            />
            <Legend
              formatter={(value: string) => <span className="text-dark-300 text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
