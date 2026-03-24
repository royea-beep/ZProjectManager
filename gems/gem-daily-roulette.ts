// src/lib/daily-roulette.ts
// Daily Roulette — 2 fixed + 3 rotating modes, changes at midnight IST

export const FIXED_MODES = ['battle-royale', 'daily-challenge'] as const;

export const ROTATING_POOL = [
  'duel',
  'tournament',
  'showdown',
  'wager',
  'photo-round',
  'versus',
  'elimination',
  'penalty-shootout',
  'hourly-battle',
  'dna-detective',
  'goat-debate',
  'blitz',
  'gulf-stars',
  'wc-predictor',
] as const;

/** Seeded shuffle — deterministic for a given seed */
function seededShuffle(arr: string[], seed: number): string[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Returns 5 mode IDs: 2 fixed + 3 rotating (same for all users on same day) */
export function getDailyModes(): string[] {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = parseInt(today.split('-').join(''), 10); // e.g. 20260323
  const shuffled = seededShuffle([...ROTATING_POOL], seed);
  return [...FIXED_MODES, ...shuffled.slice(0, 3)];
}

/** Next rotation: midnight IST (21:00 UTC) */
export function getNextRotationTime(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(21, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Format time until a date as "Xh Ym" or "Xm" */
export function formatTimeUntil(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
