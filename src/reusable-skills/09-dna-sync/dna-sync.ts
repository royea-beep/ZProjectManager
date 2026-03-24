import { supabase } from './supabase'
import type { DnaFamily } from './player-quiz'

/**
 * Save the player's DNA family assignment after quiz completion.
 * Saves to both localStorage (guest fallback) and Supabase profiles (if logged in).
 */
export async function saveDnaFamily(family: DnaFamily): Promise<void> {
  // Always save to localStorage
  localStorage.setItem('dna_family', family)
  localStorage.setItem('9s_daily_family', family) // video-skills reads this key

  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ dna_family: family, dna_assigned_at: new Date().toISOString() })
    .eq('id', user.id)
}

/**
 * Load the player's DNA family — from Supabase if logged in, else localStorage.
 */
export async function loadDnaFamily(): Promise<DnaFamily | null> {
  if (!supabase) return localStorage.getItem('dna_family') as DnaFamily | null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return localStorage.getItem('dna_family') as DnaFamily | null

  const { data } = await supabase
    .from('profiles')
    .select('dna_family')
    .eq('id', user.id)
    .single()

  if (data?.dna_family) {
    // Sync back to localStorage for offline use
    localStorage.setItem('dna_family', data.dna_family)
    return data.dna_family as DnaFamily
  }

  // Fallback: if localStorage has it but DB doesn't, push to DB
  const local = localStorage.getItem('dna_family') as DnaFamily | null
  if (local) {
    await saveDnaFamily(local) // sync to DB
    return local
  }

  return null
}

/**
 * Get the DNA family emoji for display
 */
export function getDnaEmoji(family: DnaFamily | null): string {
  const map: Record<DnaFamily, string> = {
    vision: '👁️', flair: '✨', speed: '⚡', technique: '🎯',
    leadership: '👑', instinct: '🦅', resilience: '🛡️', mind_games: '🧠', clutch: '🔥',
  }
  return family ? (map[family] ?? '⚽') : '⚽'
}

/**
 * Get the Hebrew display name for a DNA family
 */
export function getDnaNameHe(family: DnaFamily | null): string {
  const map: Record<DnaFamily, string> = {
    vision: 'חזון', flair: 'סגנון', speed: 'מהירות', technique: 'טכניקה',
    leadership: 'מנהיגות', instinct: 'אינסטינקט', resilience: 'עמידות',
    mind_games: 'משחקי מוח', clutch: 'קלאטש',
  }
  return family ? (map[family] ?? '') : ''
}
