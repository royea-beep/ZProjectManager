import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ProjectMetric } from '../../shared/types';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ef4444', '#f97316'];

export default function MetricsChart({ metrics }: { metrics: ProjectMetric[] }) {
  const { chartData, metricNames } = useMemo(() => {
    if (metrics.length === 0) return { chartData: [], metricNames: [] };

    const names = [...new Set(metrics.map(m => m.metric_name))];
    const byDate = new Map<string, Record<string, string | number>>();

    for (const m of metrics) {
      const entry = byDate.get(m.date) || { date: m.date };
      entry[m.metric_name] = m.metric_value;
      byDate.set(m.date, entry);
    }

    const sorted = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return { chartData: sorted, metricNames: names };
  }, [metrics]);

  if (chartData.length < 2) return null;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium mb-3">Metrics Over Time</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3040" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8892a8' }} />
          <YAxis tick={{ fontSize: 10, fill: '#8892a8' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          {metricNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
