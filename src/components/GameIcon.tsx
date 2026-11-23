import React from 'react';

interface GameIconProps {
  className?: string;
}

/**
 * Bauhaus Grid Art Sticky Notes Puzzle mark: Mondrian primary color partitions
 * framed in heavy ink black with a sharp folded ochre sticky note and vermilion block arrow.
 */
export const GameIcon: React.FC<GameIconProps> = ({ className = 'h-10 w-10' }) => {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      role="img"
      aria-label="Sticky Notes Puzzle icon"
      className={className}
    >
      {/* Archival Cream Canvas */}
      <rect x="4" y="4" width="120" height="120" fill="#F5F0E2" stroke="#111111" strokeWidth="6" />
      {/* Mondrian Corner Primary Color Blocks */}
      <rect x="7" y="7" width="38" height="38" fill="#D6302A" />
      <rect x="7" y="83" width="38" height="38" fill="#2B56A3" />
      <rect x="83" y="7" width="38" height="38" fill="#E4B43C" />
      {/* Bold Ink Grid Lines */}
      <path d="M45 4V124M83 4V124M4 45H124M4 83H124" stroke="#111111" strokeWidth="5" />

      {/* Center Hero Bauhaus Sticky Note */}
      <g transform="translate(26 26)">
        <rect x="5" y="5" width="76" height="76" fill="#111111" />
        <path
          d="M0 0 H62 L76 14 V62 L62 76 H0 Z"
          fill="#E4B43C"
          stroke="#111111"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        <path
          d="M62 0 V14 H76 Z"
          fill="#C99622"
          stroke="#111111"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M62 76 V62 H76 Z"
          fill="#C99622"
          stroke="#111111"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path
          d="M16 32 H40 V21 L58 38 L40 55 V44 H16 Z"
          fill="#D6302A"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
};
