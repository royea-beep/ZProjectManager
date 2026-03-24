// ═══════════════════════════════════════
// 9Soccer — Mascot Voice Player
// Priority queue, TTS placeholder, ElevenLabs-ready
// ═══════════════════════════════════════

import { getVoiceLine, type VoiceEvent } from './mascot-voices'

let currentPriority = 0
let voiceEnabled = true

export function setVoiceEnabled(enabled: boolean): void {
  voiceEnabled = enabled
  if (!enabled && typeof window !== 'undefined') window.speechSynthesis?.cancel()
  if (typeof window !== 'undefined') localStorage.setItem('9soccer_voice_enabled', enabled ? '1' : '0')
}

export function isVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('9soccer_voice_enabled') !== '0'
}

export function playMascotVoice(event: VoiceEvent): void {
  if (!voiceEnabled || !isVoiceEnabled()) return

  const line = getVoiceLine(event)
  if (!line) return

  // Don't interrupt higher-priority voice
  if (line.priority < currentPriority) return
  currentPriority = line.priority

  // Reset priority after duration
  setTimeout(() => { if (currentPriority === line.priority) currentPriority = 0 }, line.duration + 500)

  if (line.audioUrl) {
    const audio = new Audio(line.audioUrl)
    audio.volume = 0.7
    audio.play().catch(() => {})
    return
  }

  // Fallback: Web Speech API TTS
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(line.textHe)
  utt.lang = 'he-IL'
  utt.rate = 1.15
  utt.pitch = 1.0
  utt.volume = 0.65
  utt.onend = () => { if (currentPriority === line.priority) currentPriority = 0 }
  window.speechSynthesis.speak(utt)
}
