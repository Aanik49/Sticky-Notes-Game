import React, { useId } from 'react';

interface GameIconProps {
  className?: string;
}

/**
 * Signature tactile Sticky Notes Puzzle app icon: layered coral, sky,
 * and curled canary sticky notes with a bold peel arrow inside a dark slate squircle.
 */
export const GameIcon: React.FC<GameIconProps> = ({ className = 'h-10 w-10' }) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `gi-bg-${uid}`;
  const canaryId = `gi-can-${uid}`;
  const dropId = `gi-drop-${uid}`;

  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      role="img"
      aria-label="Sticky Notes Puzzle icon"
      className={className}
    >
      <defs>
        <linearGradient id={bgId} x1="12" y1="8" x2="116" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={canaryId} x1="28" y1="22" x2="100" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="72%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
        <filter id={dropId} x="-15%" y="-15%" width="140%" height="145%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#020617" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect x="4" y="4" width="120" height="120" rx="28" fill={`url(#${bgId})`} />
      <rect x="6" y="6" width="116" height="116" rx="26" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="2" />

      <g transform="translate(18 28) rotate(-11)" filter={`url(#${dropId})`}>
        <rect width="58" height="58" rx="8" fill="#fb7185" />
        <rect width="58" height="13" rx="6" fill="#ffffff" fillOpacity="0.28" />
      </g>

      <g transform="translate(54 18) rotate(10)" filter={`url(#${dropId})`}>
        <rect width="58" height="58" rx="8" fill="#38bdf8" />
        <rect width="58" height="13" rx="6" fill="#ffffff" fillOpacity="0.28" />
      </g>

      <g transform="translate(27 29) rotate(-2)" filter={`url(#${dropId})`}>
        <path
          d="M9 0 H65 A9 9 0 0 1 74 9 V54 L54 74 H9 A9 9 0 0 1 0 65 V9 A9 9 0 0 1 9 0 Z"
          fill={`url(#${canaryId})`}
        />
        <rect x="0" y="0" width="74" height="16" rx="7" fill="#ffffff" fillOpacity="0.34" />
        <path d="M54 74 V58 A4 4 0 0 1 58 54 H74 Z" fill="#eab308" />
        <path d="M18 41 H51" stroke="#3f2104" strokeWidth="7.5" strokeLinecap="round" />
        <path
          d="M38 28 L53 41 L38 54"
          stroke="#3f2104"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
