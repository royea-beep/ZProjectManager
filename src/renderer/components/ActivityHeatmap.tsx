import React, { useMemo } from 'react';

interface ActivityDay {
  date: string;
  count: number;
}

interface Props {
  sessions: { session_date: string }[];
}

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];
const WEEKS = 20;

function getColor(count: number): string {
  if (count === 0) return '#1a1f2e';
  if (count === 1) return '#1e3a5f';
  if (count === 2) return '#2563a0';
  if (count <= 4) return '#3b82f6';
  return '#60a5fa';
}

export default function ActivityHeatmap({ sessions }: Props) {
  const { grid, totalDays, totalSessions } = useMemo(() => {
    // Count sessions per date
    const counts = new Map<string, number>();
    for (const s of sessions) {
      const d = s.session_date;
      counts.set(d, (counts.get(d) || 0) + 1);
    }

    // Build grid: WEEKS columns x 7 rows
    const today = new Date();
    const cells: { date: string; count: number; dayOfWeek: number }[] = [];
    const totalDaysWorked = new Set<string>();

    for (let w = WEEKS - 1; w >= 0; w--) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        // Adjust to start week on Monday
        const offset = (today.getDay() + 6) % 7; // Monday=0
        date.setDate(today.getDate() - (w * 7 + offset - d));

        if (date > today) {
          cells.push({ date: '', count: -1, dayOfWeek: d });
          continue;
        }

        const dateStr = date.toISOString().split('T')[0];
        const count = counts.get(dateStr) || 0;
        if (count > 0) totalDaysWorked.add(dateStr);
        cells.push({ date: dateStr, count, dayOfWeek: d });
      }
    }

    return {
      grid: cells,
      totalDays: totalDaysWorked.size,
      totalSessions: sessions.length,
    };
  }, [sessions]);

  // Reshape into columns (weeks)
  const columns: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    columns.push(grid.slice(i, i + 7));
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Activity</h3>
        <div className="flex gap-3 text-xs text-dark-muted">
          <span>{totalSessions} sessions</span>
          <span>{totalDays} active days</span>
        </div>
      </div>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS.map((label, i) => (
            <div key={i} className="h-[13px] text-[10px] text-dark-muted leading-[13px] w-6 text-right pr-1">
              {label}
            </div>
          ))}
        </div>
        {/* Grid */}
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell, di) => (
              <div
                key={di}
                className="w-[13px] h-[13px] rounded-sm group relative"
                style={{ backgroundColor: cell.count < 0 ? 'transparent' : getColor(cell.count) }}
              >
                {cell.count >= 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-dark-bg border border-dark-border rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {cell.date}: {cell.count} session{cell.count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-dark-muted mr-1">Less</span>
        {[0, 1, 2, 3, 5].map(n => (
          <div key={n} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: getColor(n) }} />
        ))}
        <span className="text-[10px] text-dark-muted ml-1">More</span>
      </div>
    </div>
  );
}
