// ═══════════════════════════════════════
// 9Soccer — Video Layer Skill System V1.0
// CSS-only effects applied on top of opponent's video during PvP viewing window
// ═══════════════════════════════════════

import type { DnaFamily } from './player-quiz'

export interface VideoSkill {
  family: DnaFamily
  name: string
  nameHe: string
  descriptionHe: string
  icon: string
  effectType: 'css-filter' | 'css-transform' | 'js-speed' | 'js-delay' | 'overlay-block' | 'overlay-squares' | 'overlay-blackout'
  cssValue?: string    // for css-filter / css-transform effects
  warningMs: number
  intensity: number
}

export const VIDEO_SKILLS: Record<DnaFamily, VideoSkill> = {
  vision: {
    family: 'vision',
    name: 'Fog',
    nameHe: 'ערפל',
    descriptionHe: 'הוידאו מטושטש',
    icon: '🌫️',
    effectType: 'css-filter',
    cssValue: 'blur(4px)',
    warningMs: 500,
    intensity: 0.7,
  },
  speed: {
    family: 'speed',
    name: 'Fast Forward',
    nameHe: 'הרצה קדימה',
    descriptionHe: 'הוידאו רץ ×1.5 + 3 שניות שחור',
    icon: '⚡',
    effectType: 'js-speed',
    warningMs: 500,
    intensity: 0.8,
  },
  technique: {
    family: 'technique',
    name: 'Mirror',
    nameHe: 'מראה',
    descriptionHe: 'הוידאו הפוך',
    icon: '🪞',
    effectType: 'css-transform',
    cssValue: 'scaleX(-1)',
    warningMs: 500,
    intensity: 0.5,
  },
  leadership: {
    family: 'leadership',
    name: 'Tactical Block',
    nameHe: 'חסימה טקטית',
    descriptionHe: 'רבע מהוידאו מוסתר',
    icon: '🛡️',
    effectType: 'overlay-block',
    warningMs: 500,
    intensity: 0.6,
  },
  instinct: {
    family: 'instinct',
    name: 'Late Whistle',
    nameHe: 'שריקה מאוחרת',
    descriptionHe: 'הוידאו מתחיל 1.5 שניות באיחור',
    icon: '⏰',
    effectType: 'js-delay',
    warningMs: 500,
    intensity: 0.7,
  },
  resilience: {
    family: 'resilience',
    name: 'No Colors',
    nameHe: 'בלי צבעים',
    descriptionHe: 'הוידאו בשחור-לבן',
    icon: '⬛',
    effectType: 'css-filter',
    cssValue: 'grayscale(1)',
    warningMs: 500,
    intensity: 0.5,
  },
  flair: {
    family: 'flair',
    name: 'Smoke Bombs',
    nameHe: 'פצצות עשן',
    descriptionHe: 'ריבועים שחורים מופיעים על הוידאו',
    icon: '💨',
    effectType: 'overlay-squares',
    warningMs: 500,
    intensity: 0.6,
  },
  mind_games: {
    family: 'mind_games',
    name: 'Lights Out',
    nameHe: 'כיבוי אורות',
    descriptionHe: 'שני כיבויים של 0.4 שניות',
    icon: '🌑',
    effectType: 'overlay-blackout',
    warningMs: 500,
    intensity: 0.6,
  },
  clutch: {
    family: 'clutch',
    name: 'Tunnel Vision',
    nameHe: 'ראייה מנהרתית',
    descriptionHe: 'הוידאו מוגדל — הקצוות חתוכים',
    icon: '🔍',
    effectType: 'css-transform',
    cssValue: 'scale(1.3)',
    warningMs: 500,
    intensity: 0.5,
  },
}

/**
 * Returns the VideoSkill for the current player's DNA family.
 * Reads from localStorage — set by the DNA quiz.
 */
export function getPlayerSkill(): VideoSkill | null {
  if (typeof window === 'undefined') return null
  const family = localStorage.getItem('9s_daily_family') ?? localStorage.getItem('dna_family')
  if (!family || !(family in VIDEO_SKILLS)) return null
  return VIDEO_SKILLS[family as DnaFamily]
}
