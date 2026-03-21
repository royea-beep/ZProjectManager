import React from 'react';

interface HealthRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function HealthRing({ score, size = 44, strokeWidth = 4 }: HealthRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, score / 100)) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const trackColor = score >= 70 ? '#22c55e22' : score >= 40 ? '#f59e0b22' : '#ef444422';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Health: ${score}%`}>
      {/* Track */}
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      {/* Score text */}
      <text
        x={center} y={center + 4}
        textAnchor="middle"
        fontSize={size >= 44 ? 11 : 9}
        fill={color}
        fontWeight="700"
        fontFamily="inherit"
      >
        {score}
      </text>
    </svg>
  );
}
