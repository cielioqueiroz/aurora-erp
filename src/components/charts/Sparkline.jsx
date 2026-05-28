import { Line, LineChart, ResponsiveContainer } from 'recharts';

export function Sparkline({ data, dataKey = 'value', positive = true }) {
  const color = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
