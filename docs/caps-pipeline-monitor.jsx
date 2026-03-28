import { useState, useEffect, useCallback } from "react";

const STATUS_COLORS = {
  bug_sent: "#F59E0B",
  crash_pending: "#F59E0B",
  bug_approved: "#3B82F6",
  crash_approved: "#3B82F6",
  bug_no_changes: "#6B7280",
  bug_dismissed: "#6B7280",
  crash_skipped: "#6B7280",
  timeout_expired: "#EF4444",
  sprint_added: "#8B5CF6",
  backlog: "#6B7280",
};

const STATUS_LABELS = {
  bug_sent: "⏳ Waiting for reply",
  crash_pending: "⏳ Waiting for reply",
  bug_approved: "🔧 Auto-fix approved",
  crash_approved: "🔧 Auto-fix approved",
  bug_no_changes: "🤷 No changes made",
  bug_dismissed: "🗑️ Dismissed",
  crash_skipped: "⏭️ Skipped",
  timeout_expired: "⏰ Expired",
  cancelled: "❌ Cancelled",
  approved: "✅ Approved",
};

function TimeAgo({ minutes }) {
  if (minutes < 60) return <span>{Math.round(minutes)}m ago</span>;
  if (minutes < 1440) return <span>{Math.round(minutes / 60)}h ago</span>;
  return <span>{Math.round(minutes / 1440)}d ago</span>;
}

function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || "#6B7280";
  const label = STATUS_LABELS[status] || status;
  return (
    <span style={{
      background: color + "22",
      color: color,
      padding: "2px 8px",
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 500,
      whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function HealthCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: 12,
      padding: "12px 16px",
      textAlign: "center",
      minWidth: 0
    }}>
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function PipelineMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: "You are a data fetcher. Call the execute_sql tool to run this exact query on project gxrpunvhjcrzqnitbqah: SELECT get_pipeline_monitor(); Return ONLY the raw JSON result, no explanation.",
          messages: [{ role: "user", content: "Run get_pipeline_monitor() on the CAPS Supabase project" }],
          mcp_servers: [{ type: "url", url: "https://mcp.supabase.com/mcp", name: "supabase" }]
        })
      });

      const result = await response.json();
      
      const toolResults = result.content?.filter(b => b.type === "mcp_tool_result") || [];
      let parsed = null;
      
      for (const tr of toolResults) {
        const text = tr.content?.[0]?.text || "";
        try {
          const sqlResult = JSON.parse(text);
          if (sqlResult?.result) {
            const rows = JSON.parse(sqlResult.result);
            if (rows?.[0]?.get_pipeline_monitor) {
              parsed = rows[0].get_pipeline_monitor;
            }
          } else if (sqlResult?.[0]?.get_pipeline_monitor) {
            parsed = sqlResult[0].get_pipeline_monitor;
          }
        } catch {
          try {
            const match = text.match(/\{[\s\S]*"timestamp"[\s\S]*\}/);
            if (match) parsed = JSON.parse(match[0]);
          } catch {}
        }
      }

      if (!parsed) {
        const textBlocks = result.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
        try {
          const jsonMatch = textBlocks.match(/\{[\s\S]*"pipeline_health"[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch {}
      }

      if (parsed) {
        setData(parsed);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError("Could not parse pipeline data");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (!data && loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-secondary)" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Loading pipeline data...</div>
        <div style={{ fontSize: 12 }}>Connecting to Supabase via MCP</div>
      </div>
    );
  }

  const ph = data?.pipeline_health || {};
  const bugs = data?.bugs || {};
  const crashes = data?.crashes || {};
  const flow = data?.recent_flow || [];

  return (
    <div style={{ padding: "8px 0", fontFamily: "var(--font-sans)" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {lastRefresh && `Updated ${lastRefresh.toLocaleTimeString()}`}
          {autoRefresh && " · auto-refresh 30s"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={fetchData} disabled={loading} style={{
            background: "transparent", border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 8, padding: "4px 12px", fontSize: 11, cursor: "pointer",
            color: "var(--color-text-primary)", fontFamily: "inherit",
            opacity: loading ? 0.5 : 1
          }}>{loading ? "..." : "Refresh"}</button>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{
            background: autoRefresh ? "var(--color-background-success)" : "transparent",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: 8, padding: "4px 12px", fontSize: 11, cursor: "pointer",
            color: autoRefresh ? "var(--color-text-success)" : "var(--color-text-secondary)",
            fontFamily: "inherit"
          }}>{autoRefresh ? "Live" : "Paused"}</button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "var(--color-background-danger)", borderRadius: 8,
          padding: "8px 12px", marginBottom: 12, fontSize: 11, color: "var(--color-text-danger)"
        }}>{error}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        <HealthCard label="Stuck" value={ph.stuck_sessions || 0} 
          color={ph.stuck_sessions > 0 ? "#EF4444" : "var(--color-text-success)"} 
          sub="> 30min no reply" />
        <HealthCard label="Waiting" value={ph.active_sessions || 0}
          color={ph.active_sessions > 0 ? "#F59E0B" : "var(--color-text-tertiary)"}
          sub="Bug/crash pending" />
        <HealthCard label="Processing" value={ph.processing || 0}
          color={ph.processing > 0 ? "#3B82F6" : "var(--color-text-tertiary)"}
          sub="Auto-fix running" />
        <HealthCard label="Done 24h" value={ph.completed_24h || 0}
          color="var(--color-text-success)"
          sub="Resolved/dismissed" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{
          background: "var(--color-background-secondary)", borderRadius: 12, padding: 12
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Bugs</div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span>Open: <b style={{ color: bugs.open > 0 ? "#EF4444" : "var(--color-text-success)" }}>{bugs.open}</b></span>
            <span>Fix pending: <b>{bugs.auto_fix_pending}</b></span>
            <span>Resolved 24h: <b style={{ color: "var(--color-text-success)" }}>{bugs.resolved_24h}</b></span>
          </div>
        </div>
        <div style={{
          background: "var(--color-background-secondary)", borderRadius: 12, padding: 12
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Crashes</div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--color-text-secondary)" }}>
            <span>Real: <b style={{ color: crashes.real > 0 ? "#EF4444" : "var(--color-text-success)" }}>{crashes.real}</b></span>
            <span>False+: <b>{crashes.false_positive}</b></span>
            <span>Total: <b>{crashes.total}</b></span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Recent pipeline flow (48h)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {flow.map((s, i) => (
          <div key={s.id || i} style={{
            background: "var(--color-background-secondary)",
            borderRadius: 8,
            padding: "8px 12px",
            borderLeft: `3px solid ${STATUS_COLORS[s.status] || "#6B7280"}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11
          }}>
            <span style={{ fontSize: 14 }}>{s.media_type === "crash" ? "💥" : "🐛"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: "var(--color-text-primary)", maxWidth: "100%"
              }}>
                {(s.preview || "").replace(/\*BUG REPORT\*\n/, "").replace(/💥 \*CRASH.*\n/, "").substring(0, 60)}
              </div>
              <div style={{ color: "var(--color-text-tertiary)", fontSize: 10, marginTop: 1 }}>
                <TimeAgo minutes={s.minutes_ago} />
                {s.github_run_id && <span> · GH #{s.github_run_id}</span>}
                {s.has_plan && <span> · has fix plan</span>}
              </div>
            </div>
            <StatusPill status={s.status} />
          </div>
        ))}
        {flow.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-tertiary)", fontSize: 12 }}>
            No sessions in the last 48 hours
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center" }}>
        CAPS Pipeline Monitor · {ph.total_sessions || 0} total sessions · Supabase gxrpunvhjcrzqnitbqah
      </div>
    </div>
  );
}
