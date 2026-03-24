'use client'
import { useState, useEffect, useRef } from 'react'
import type { VideoSkill } from '@/lib/video-skills'

interface Props {
  skill: VideoSkill | null   // null = no effect applied
  isActive: boolean          // true = currently in 9-second viewing window
  children: React.ReactNode
}

export function VideoSkillOverlay({ skill, isActive, children }: Props) {
  const [showWarning, setShowWarning] = useState(false)
  const [effectActive, setEffectActive] = useState(false)
  const [blackoutVisible, setBlackoutVisible] = useState(false)
  const squaresRef = useRef<{ x: number; y: number; w: number; h: number }[]>([])
  const [squaresTick, setSquaresTick] = useState(0)

  // Trigger effects when viewing window opens
  useEffect(() => {
    if (!skill || !isActive) {
      setShowWarning(false)
      setEffectActive(false)
      setBlackoutVisible(false)
      squaresRef.current = []
      return
    }

    // 500ms warning → then activate
    setShowWarning(true)
    const warningTimer = setTimeout(() => {
      setShowWarning(false)
      setEffectActive(true)

      // overlay-squares: generate random squares
      if (skill.effectType === 'overlay-squares') {
        squaresRef.current = Array.from({ length: 5 }, () => ({
          x: Math.random() * 60,
          y: Math.random() * 60,
          w: 10 + Math.random() * 15,
          h: 10 + Math.random() * 15,
        }))
        setSquaresTick(n => n + 1)
      }

      // overlay-blackout: two 0.4s blackouts (gentle fades — no strobing)
      if (skill.effectType === 'overlay-blackout') {
        const t1 = setTimeout(() => {
          setBlackoutVisible(true)
          setTimeout(() => setBlackoutVisible(false), 400)
        }, 2000)
        const t2 = setTimeout(() => {
          setBlackoutVisible(true)
          setTimeout(() => setBlackoutVisible(false), 400)
        }, 5500)
        return () => { clearTimeout(t1); clearTimeout(t2) }
      }
    }, skill.warningMs)

    return () => clearTimeout(warningTimer)
  }, [skill, isActive])

  // Build CSS style for the video wrapper
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  }
  const videoStyle: React.CSSProperties = {}

  if (effectActive && skill) {
    if (skill.effectType === 'css-filter') {
      videoStyle.filter = skill.cssValue
    } else if (skill.effectType === 'css-transform') {
      videoStyle.transform = skill.cssValue
      videoStyle.transition = 'transform 0.2s ease'
      if (skill.family === 'clutch') {
        wrapperStyle.overflow = 'hidden'
      }
    }
  }

  return (
    <div style={wrapperStyle}>
      {/* Warning flash — 500ms before activation */}
      {showWarning && skill && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          animation: 'vsOverlayFadeIn 0.2s ease',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 12,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 24 }}>{skill.icon}</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{skill.nameHe}</span>
          </div>
        </div>
      )}

      {/* Corner block overlay (leadership — Tactical Block) */}
      {effectActive && skill?.effectType === 'overlay-block' && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '40%', height: '40%',
          background: 'rgba(0,0,0,0.85)',
          zIndex: 10,
          pointerEvents: 'none',
        }} />
      )}

      {/* Smoke squares (flair — Smoke Bombs) */}
      {effectActive && skill?.effectType === 'overlay-squares' && squaresTick > 0 && squaresRef.current.map((sq, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${sq.x}%`, top: `${sq.y}%`,
          width: `${sq.w}%`, height: `${sq.h}%`,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 10,
          pointerEvents: 'none',
          animation: 'vsOverlayFadeInOut 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.3}s`,
        }} />
      ))}

      {/* Blackout (mind_games — Lights Out) — gentle fade transition, child-safe */}
      {blackoutVisible && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#000',
          zIndex: 15,
          pointerEvents: 'none',
          transition: 'opacity 0.15s ease',
        }} />
      )}

      {/* The actual video / content with CSS effects applied */}
      <div style={{ ...videoStyle, width: '100%', height: '100%' }}>
        {children}
      </div>

      <style>{`
        @keyframes vsOverlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vsOverlayFadeInOut {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}
