/**
 * TokenWise Integration — Read cost data from TokenWise's database
 * TokenWise tracks Claude API usage per session with costs.
 * DB location: ~/.tokenwise/tokenwise.db (SQLite)
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import initSqlJs from 'sql.js';

export interface TokenWiseStats {
  total_cost: number;
  total_interactions: number;
  total_sessions: number;
  last_7_days_cost: number;
  last_30_days_cost: number;
  per_project: { project_path: string; project_name: string; cost: number; interactions: number; last_used: string }[];
}

export interface ProjectCostData {
  total_cost: number;
  total_interactions: number;
  sessions: number;
  last_used: string | null;
  daily_costs: { date: string; cost: number }[];
}

function getTokenWiseDbPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  return path.join(home, '.tokenwise', 'tokenwise.db');
}

/**
 * Check if TokenWise is installed and has data
 */
export function isTokenWiseAvailable(): boolean {
  return fs.existsSync(getTokenWiseDbPath());
}

/**
 * Read overall TokenWise stats
 */
export async function getTokenWiseOverview(): Promise<TokenWiseStats | null> {
  const dbPath = getTokenWiseDbPath();
  if (!fs.existsSync(dbPath)) return null;

  try {
    const wasmPath = app.isPackaged
      ? path.join(process.resourcesPath, 'sql-wasm.wasm')
      : path.join(__dirname, '../../../node_modules/sql.js/dist/sql-wasm.wasm');

    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);

    // Try to read the interactions table — TokenWise schema may vary
    // Common columns: id, session_id, timestamp, model, input_tokens, output_tokens, estimated_cost, working_directory
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    const tableNames = tables[0]?.values.map(v => v[0] as string) || [];

    if (!tableNames.includes('interactions')) {
      db.close();
      return null;
    }

    // Get column info
    const colInfo = db.exec("PRAGMA table_info(interactions)");
    const columns = colInfo[0]?.values.map(v => v[1] as string) || [];

    const hasCost = columns.includes('estimated_cost');
    const hasDir = columns.includes('working_directory');
    const costCol = hasCost ? 'estimated_cost' : '0';
    const dirCol = hasDir ? 'working_directory' : "''";

    // Total stats
    const totals = db.exec(`
      SELECT
        COALESCE(SUM(${costCol}), 0) as total_cost,
        COUNT(*) as total_interactions,
        COUNT(DISTINCT session_id) as total_sessions
      FROM interactions
    `);

    const total_cost = (totals[0]?.values[0]?.[0] as number) || 0;
    const total_interactions = (totals[0]?.values[0]?.[1] as number) || 0;
    const total_sessions = (totals[0]?.values[0]?.[2] as number) || 0;

    // Last 7 days
    const week = db.exec(`
      SELECT COALESCE(SUM(${costCol}), 0) FROM interactions
      WHERE timestamp >= datetime('now', '-7 days')
    `);
    const last_7_days_cost = (week[0]?.values[0]?.[0] as number) || 0;

    // Last 30 days
    const month = db.exec(`
      SELECT COALESCE(SUM(${costCol}), 0) FROM interactions
      WHERE timestamp >= datetime('now', '-30 days')
    `);
    const last_30_days_cost = (month[0]?.values[0]?.[0] as number) || 0;

    // Per project (by working directory)
    let per_project: TokenWiseStats['per_project'] = [];
    if (hasDir) {
      const proj = db.exec(`
        SELECT
          ${dirCol} as dir,
          COALESCE(SUM(${costCol}), 0) as cost,
          COUNT(*) as interactions,
          MAX(timestamp) as last_used
        FROM interactions
        WHERE ${dirCol} IS NOT NULL AND ${dirCol} != ''
        GROUP BY ${dirCol}
        ORDER BY cost DESC
      `);

      if (proj[0]) {
        per_project = proj[0].values.map(row => {
          const dirPath = row[0] as string;
          return {
            project_path: dirPath,
            project_name: path.basename(dirPath),
            cost: row[1] as number,
            interactions: row[2] as number,
            last_used: row[3] as string,
          };
        });
      }
    }

    db.close();
    return { total_cost, total_interactions, total_sessions, last_7_days_cost, last_30_days_cost, per_project };
  } catch (e) {
    console.error('[tokenwise-reader] Error reading TokenWise DB:', e);
    return null;
  }
}

/**
 * Get cost data for a specific project by repo path
 */
export async function getProjectCost(repoPath: string): Promise<ProjectCostData | null> {
  const dbPath = getTokenWiseDbPath();
  if (!fs.existsSync(dbPath)) return null;

  try {
    const wasmPath = app.isPackaged
      ? path.join(process.resourcesPath, 'sql-wasm.wasm')
      : path.join(__dirname, '../../../node_modules/sql.js/dist/sql-wasm.wasm');

    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);

    const colInfo = db.exec("PRAGMA table_info(interactions)");
    const columns = colInfo[0]?.values.map(v => v[1] as string) || [];
    const hasCost = columns.includes('estimated_cost');
    const hasDir = columns.includes('working_directory');

    if (!hasDir) { db.close(); return null; }

    const costCol = hasCost ? 'estimated_cost' : '0';

    // Normalize path for matching (handle both / and \)
    const projectName = path.basename(repoPath).toLowerCase();
    // Escape SQL LIKE special chars
    const safeName = projectName.replace(/[%_]/g, c => `\\${c}`);
    const likePattern = `%${safeName}%`;

    // Get totals for this project using parameterized query
    const stmt1 = db.prepare(`
      SELECT
        COALESCE(SUM(${costCol}), 0),
        COUNT(*),
        COUNT(DISTINCT session_id),
        MAX(timestamp)
      FROM interactions
      WHERE REPLACE(LOWER(working_directory), '\\', '/') LIKE ? ESCAPE '\\'
    `);
    stmt1.bind([likePattern]);
    let total_cost = 0, total_interactions = 0, sessions = 0, last_used: string | null = null;
    if (stmt1.step()) {
      const row = stmt1.getAsObject();
      total_cost = (row['COALESCE(SUM(' + costCol + '), 0)'] as number) || 0;
      // Fall back to positional via column names from the query
      const vals = Object.values(row);
      total_cost = (vals[0] as number) || 0;
      total_interactions = (vals[1] as number) || 0;
      sessions = (vals[2] as number) || 0;
      last_used = (vals[3] as string) || null;
    }
    stmt1.free();

    // Daily costs for chart using parameterized query
    const stmt2 = db.prepare(`
      SELECT date(timestamp) as d, COALESCE(SUM(${costCol}), 0)
      FROM interactions
      WHERE REPLACE(LOWER(working_directory), '\\', '/') LIKE ? ESCAPE '\\'
      GROUP BY d
      ORDER BY d DESC
      LIMIT 30
    `);
    stmt2.bind([likePattern]);
    const dailyRows: { date: string; cost: number }[] = [];
    while (stmt2.step()) {
      const vals = Object.values(stmt2.getAsObject());
      dailyRows.push({ date: vals[0] as string, cost: (vals[1] as number) || 0 });
    }
    stmt2.free();

    const daily_costs = dailyRows.reverse();

    db.close();
    return { total_cost, total_interactions, sessions, last_used, daily_costs };
  } catch (e) {
    console.error('[tokenwise-reader] Error reading project cost:', e);
    return null;
  }
}
