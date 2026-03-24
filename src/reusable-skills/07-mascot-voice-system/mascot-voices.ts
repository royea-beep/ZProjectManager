// ═══════════════════════════════════════
// 9Soccer — Mascot Voice Lines
// TTS placeholder via Web Speech API
// When ElevenLabs audio arrives: add audioUrl to each line
// ═══════════════════════════════════════

export type MascotId = 'lemon' | 'mia' | 'daniel'
export type VoiceEvent =
  | 'correct' | 'wrong' | 'streak_3' | 'streak_7' | 'streak_10'
  | 'win' | 'lose' | 'perfect_round' | 'time_running_out'
  | 'welcome_back' | 'daily_challenge' | 'tournament_start'

export interface VoiceLine {
  event: VoiceEvent
  textHe: string
  textEn: string
  audioUrl?: string      // Supabase Storage URL when ElevenLabs audio is ready
  duration: number       // ms
  priority: number       // higher = plays over lower
}

export const MASCOT_VOICES: Record<MascotId, VoiceLine[]> = {
  lemon: [
    { event: 'correct', textHe: 'יאללה!', textEn: 'Yes!', duration: 800, priority: 1 },
    { event: 'correct', textHe: 'נכון!', textEn: 'Right!', duration: 700, priority: 1 },
    { event: 'correct', textHe: 'מלך!', textEn: 'King!', duration: 600, priority: 1 },
    { event: 'wrong', textHe: 'אוי לא...', textEn: 'Oh no...', duration: 900, priority: 1 },
    { event: 'wrong', textHe: 'קרוב!', textEn: 'Close!', duration: 700, priority: 1 },
    { event: 'streak_3', textHe: 'שלושה ברצף!', textEn: 'Three in a row!', duration: 1200, priority: 2 },
    { event: 'streak_7', textHe: 'שבעה! אלוף!', textEn: 'Seven! Champion!', duration: 1300, priority: 3 },
    { event: 'streak_10', textHe: 'עשר! אגדה חיה!', textEn: 'Ten! Living legend!', duration: 1500, priority: 4 },
    { event: 'win', textHe: 'ניצחון!', textEn: 'Victory!', duration: 1000, priority: 5 },
    { event: 'lose', textHe: 'בפעם הבאה!', textEn: 'Next time!', duration: 1200, priority: 5 },
    { event: 'perfect_round', textHe: 'מושלם! אפס טעויות!', textEn: 'Perfect! Zero mistakes!', duration: 1800, priority: 6 },
    { event: 'welcome_back', textHe: 'חזרת! בוא נשחק!', textEn: "You're back! Let's play!", duration: 1500, priority: 3 },
    { event: 'daily_challenge', textHe: 'אתגר חדש מחכה!', textEn: 'New challenge awaits!', duration: 1400, priority: 3 },
    { event: 'tournament_start', textHe: 'הטורניר מתחיל!', textEn: 'Tournament starts!', duration: 1300, priority: 4 },
    { event: 'time_running_out', textHe: 'מהר! הזמן אוזל!', textEn: 'Hurry! Time running out!', duration: 1400, priority: 4 },
  ],
  mia: [
    { event: 'correct', textHe: 'כל הכבוד!', textEn: 'Well done!', duration: 900, priority: 1 },
    { event: 'correct', textHe: 'מדהים!', textEn: 'Amazing!', duration: 800, priority: 1 },
    { event: 'wrong', textHe: 'לא נורא, נסה שוב!', textEn: "It's ok, try again!", duration: 1200, priority: 1 },
    { event: 'streak_3', textHe: 'וואו שלושה!', textEn: 'Wow three!', duration: 1100, priority: 2 },
    { event: 'streak_7', textHe: 'את/ה על גל!', textEn: "You're on fire!", duration: 1200, priority: 3 },
    { event: 'streak_10', textHe: 'עשר! לא ייאמן!', textEn: 'Ten! Unbelievable!', duration: 1400, priority: 4 },
    { event: 'win', textHe: 'ידעתי שתצליח!', textEn: 'I knew you could!', duration: 1300, priority: 5 },
    { event: 'lose', textHe: 'אל תוותר!', textEn: "Don't give up!", duration: 1100, priority: 5 },
    { event: 'perfect_round', textHe: 'מושלם! גאה בך!', textEn: 'Perfect! Proud of you!', duration: 1600, priority: 6 },
    { event: 'welcome_back', textHe: 'שמחה לראות אותך!', textEn: 'Happy to see you!', duration: 1400, priority: 3 },
    { event: 'daily_challenge', textHe: 'מוכן לאתגר?', textEn: 'Ready for a challenge?', duration: 1200, priority: 3 },
    { event: 'tournament_start', textHe: 'בהצלחה בטורניר!', textEn: 'Good luck in tournament!', duration: 1500, priority: 4 },
    { event: 'time_running_out', textHe: 'תמהר! נגמר הזמן!', textEn: "Quick! Time's up!", duration: 1300, priority: 4 },
  ],
  daniel: [
    { event: 'correct', textHe: 'גול!', textEn: 'Goal!', duration: 600, priority: 1 },
    { event: 'correct', textHe: 'בום!', textEn: 'Boom!', duration: 500, priority: 1 },
    { event: 'wrong', textHe: 'כמעט...', textEn: 'Almost...', duration: 800, priority: 1 },
    { event: 'streak_3', textHe: 'האט-טריק!', textEn: 'Hat-trick!', duration: 1000, priority: 2 },
    { event: 'streak_7', textHe: 'שבע! כמו רונאלדו!', textEn: 'Seven! Like Ronaldo!', duration: 1400, priority: 3 },
    { event: 'streak_10', textHe: 'עשר! אלוף אלופים!', textEn: 'Ten! Champion of champions!', duration: 1500, priority: 4 },
    { event: 'win', textHe: 'ניצחנו!', textEn: 'We won!', duration: 900, priority: 5 },
    { event: 'lose', textHe: 'עוד משחק?', textEn: 'Another game?', duration: 1000, priority: 5 },
    { event: 'perfect_round', textHe: 'מטורף! אפס טעויות!', textEn: 'Crazy! Zero mistakes!', duration: 1500, priority: 6 },
    { event: 'welcome_back', textHe: 'היי! בוא נשחק!', textEn: "Hey! Let's play!", duration: 1200, priority: 3 },
    { event: 'daily_challenge', textHe: 'יש אתגר חדש!', textEn: 'New challenge!', duration: 1100, priority: 3 },
    { event: 'tournament_start', textHe: 'טורניר! יאללה!', textEn: 'Tournament! Go!', duration: 1200, priority: 4 },
    { event: 'time_running_out', textHe: 'רוץ! הזמן!', textEn: 'Run! Time!', duration: 1000, priority: 4 },
  ],
}

export function getActiveMascot(): MascotId {
  if (typeof window === 'undefined') return 'lemon'
  return (localStorage.getItem('9soccer_mascot') as MascotId) || 'lemon'
}

export function getVoiceLine(event: VoiceEvent, mascotId?: MascotId): VoiceLine | null {
  const id = mascotId ?? getActiveMascot()
  const lines = MASCOT_VOICES[id]?.filter(l => l.event === event) ?? []
  if (lines.length === 0) return null
  return lines[Math.floor(Math.random() * lines.length)]
}
