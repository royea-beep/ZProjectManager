// src/lib/penalty-shootout.ts
// Penalty Shootout — async 5v5 WhatsApp mode

import { supabase } from '@/lib/supabase';

export type ShootoutStatus = 'open' | 'playing' | 'complete';

export interface PlayerShot {
  userId: string;
  displayName: string;
  team: 'A' | 'B';
  slot: number; // 1-5
  result: 'goal' | 'saved' | 'missed' | 'pending';
  answeredAt: string | null;
  timeTakenMs: number | null;
}

export interface PenaltyShootout {
  id: string;
  code: string;
  teamAName: string;
  teamBName: string;
  teamAGoals: number;
  teamBGoals: number;
  shots: PlayerShot[];
  status: ShootoutStatus;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

// Generate a 6-char join code
export function genShootoutCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Create a new shootout
export async function createShootout(params: {
  userId: string;
  displayName: string;
  teamAName?: string;
  teamBName?: string;
}): Promise<{ shootout: PenaltyShootout | null; error: string | null }> {
  const code = genShootoutCode();
  const firstShot: PlayerShot = {
    userId: params.userId,
    displayName: params.displayName,
    team: 'A',
    slot: 1,
    result: 'pending',
    answeredAt: null,
    timeTakenMs: null,
  };

  const { data, error } = await supabase!
    .from('penalty_shootouts')
    .insert({
      code,
      team_a_name: params.teamAName ?? 'Team A',
      team_b_name: params.teamBName ?? 'Team B',
      shots: [firstShot],
      team_a_goals: 0,
      team_b_goals: 0,
      status: 'open',
      created_by: params.userId,
    })
    .select()
    .single();

  if (error || !data) return { shootout: null, error: error?.message ?? 'Failed to create' };
  return { shootout: dbToShootout(data), error: null };
}

// Join an existing shootout by code
export async function joinShootout(params: {
  code: string;
  userId: string;
  displayName: string;
}): Promise<{ shootout: PenaltyShootout | null; error: string | null }> {
  const { data, error } = await supabase!
    .from('penalty_shootouts')
    .select()
    .eq('code', params.code.toUpperCase())
    .single();

  if (error || !data) return { shootout: null, error: 'Shootout not found' };

  const shootout = dbToShootout(data);
  if (shootout.status === 'complete') return { shootout: null, error: 'This shootout is already finished' };

  // Check if already in
  const alreadyIn = shootout.shots.find(s => s.userId === params.userId);
  if (alreadyIn) return { shootout, error: null };

  // Assign to next open slot
  const teamA = shootout.shots.filter(s => s.team === 'A');
  const teamB = shootout.shots.filter(s => s.team === 'B');

  let team: 'A' | 'B';
  let slot: number;

  if (teamA.length <= teamB.length && teamA.length < 5) {
    team = 'A';
    slot = teamA.length + 1;
  } else if (teamB.length < 5) {
    team = 'B';
    slot = teamB.length + 1;
  } else {
    return { shootout: null, error: 'Both teams are full (5/5)' };
  }

  const newShot: PlayerShot = {
    userId: params.userId,
    displayName: params.displayName,
    team,
    slot,
    result: 'pending',
    answeredAt: null,
    timeTakenMs: null,
  };

  const updatedShots = [...shootout.shots, newShot];
  const { data: updated, error: updateError } = await supabase!
    .from('penalty_shootouts')
    .update({ shots: updatedShots, status: 'playing' })
    .eq('id', shootout.id)
    .select()
    .single();

  if (updateError || !updated) return { shootout: null, error: updateError?.message ?? 'Failed to join' };
  return { shootout: dbToShootout(updated), error: null };
}

// Submit a player's shot result
export async function submitShot(params: {
  shootoutId: string;
  userId: string;
  result: 'goal' | 'saved' | 'missed';
  timeTakenMs: number;
}): Promise<{ shootout: PenaltyShootout | null; error: string | null }> {
  const { data, error } = await supabase!
    .from('penalty_shootouts')
    .select()
    .eq('id', params.shootoutId)
    .single();

  if (error || !data) return { shootout: null, error: 'Shootout not found' };

  const shootout = dbToShootout(data);
  const updatedShots = shootout.shots.map(s =>
    s.userId === params.userId
      ? { ...s, result: params.result, answeredAt: new Date().toISOString(), timeTakenMs: params.timeTakenMs }
      : s
  );

  // Recalculate goals
  const teamAGoals = updatedShots.filter(s => s.team === 'A' && s.result === 'goal').length;
  const teamBGoals = updatedShots.filter(s => s.team === 'B' && s.result === 'goal').length;

  // Check if complete: all shots resolved OR expired
  const pending = updatedShots.filter(s => s.result === 'pending').length;
  const allJoined = updatedShots.length === 10;
  const isComplete = allJoined && pending === 0;

  const { data: updated, error: updateError } = await supabase!
    .from('penalty_shootouts')
    .update({
      shots: updatedShots,
      team_a_goals: teamAGoals,
      team_b_goals: teamBGoals,
      status: isComplete ? 'complete' : 'playing',
    })
    .eq('id', params.shootoutId)
    .select()
    .single();

  if (updateError || !updated) return { shootout: null, error: updateError?.message ?? 'Failed to submit' };

  // Notify all participants when shootout is complete
  if (isComplete) {
    const shootoutResult = dbToShootout(updated);
    const winner = shootoutResult.teamAGoals > shootoutResult.teamBGoals
      ? shootoutResult.teamAName
      : shootoutResult.teamBGoals > shootoutResult.teamAGoals
        ? shootoutResult.teamBName
        : null;
    const resultText = winner
      ? `${winner} ניצחה! ${shootoutResult.teamAGoals}-${shootoutResult.teamBGoals}`
      : `תיקו! ${shootoutResult.teamAGoals}-${shootoutResult.teamBGoals}`;
    // Best-effort: notify via Supabase edge function (non-blocking)
    supabase!.functions.invoke('notify-shootout-complete', {
      body: {
        shootoutId: params.shootoutId,
        code: shootoutResult.code,
        resultText,
        userIds: updatedShots.map(s => s.userId),
      },
    }).catch(() => {/* non-blocking */});
  }

  return { shootout: dbToShootout(updated), error: null };
}

// Fetch a shootout by code
export async function getShootoutByCode(code: string): Promise<PenaltyShootout | null> {
  const { data } = await supabase!
    .from('penalty_shootouts')
    .select()
    .eq('code', code.toUpperCase())
    .single();
  return data ? dbToShootout(data) : null;
}

// Fetch a shootout by id
export async function getShootoutById(id: string): Promise<PenaltyShootout | null> {
  const { data } = await supabase!
    .from('penalty_shootouts')
    .select()
    .eq('id', id)
    .single();
  return data ? dbToShootout(data) : null;
}

// WhatsApp share link for a shootout
export function getShootoutShareLink(code: string): string {
  const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://9soccer.vercel.app'}/penalty-shootout?join=${code}`;
  const text = `🥅 תצטרפו לפנדלים שלי ב-9Soccer!\nקוד: ${code}\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// DB row → typed object
function dbToShootout(row: Record<string, unknown>): PenaltyShootout {
  return {
    id: row.id as string,
    code: row.code as string,
    teamAName: (row.team_a_name as string) ?? 'Team A',
    teamBName: (row.team_b_name as string) ?? 'Team B',
    teamAGoals: (row.team_a_goals as number) ?? 0,
    teamBGoals: (row.team_b_goals as number) ?? 0,
    shots: (row.shots as PlayerShot[]) ?? [],
    status: (row.status as ShootoutStatus) ?? 'open',
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  };
}
