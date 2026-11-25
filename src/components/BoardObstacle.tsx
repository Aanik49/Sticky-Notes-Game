import React from 'react';
import { ObstacleSpec, ThemeMeta } from '../game/types';

interface BoardObstacleProps {
  obstacle: ObstacleSpec;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  theme: ThemeMeta;
  knockKey: number;
}

/**
 * Bauhaus Grid Art immovable architectural block: sharp ink-framed primary
 * geometry (solid vermilion, ochre disc, cobalt square, or obsidian cross-block).
 */
export const BoardObstacle: React.FC<BoardObstacleProps> = ({
  obstacle,
  leftPct,
  topPct,
  widthPct,
  heightPct,
  theme,
  knockKey,
}) => {
  return (
    <div
      key={`obs-${obstacle.r}-${obstacle.c}-k${knockKey}`}
      aria-label={`Fixed obstacle at row ${obstacle.r + 1}, column ${obstacle.c + 1}`}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
      }}
      className={`pointer-events-none absolute flex items-center justify-center ${
        knockKey > 0 ? 'blocker-knock' : ''
      }`}
    >
      {theme.visualBase === 'fridge' && (
        /* Solid Bauhaus Vermilion Square Block (mirrors the reference bottom-left red square) */
        <div className="relative flex h-full w-full items-center justify-center border-2 border-[#111111] bg-[#d6302a] shadow-[2px_2px_0_#111111]">
          <div className="h-[34%] w-[34%] border-2 border-[#111111] bg-[#111111]" />
        </div>
      )}

      {theme.visualBase === 'cork' && (
        /* Bauhaus Ink Frame with Centered Ochre Circle */
        <div className="relative flex h-full w-full items-center justify-center border-2 border-[#111111] bg-[#111111] shadow-[2px_2px_0_#111111]">
          <div className="h-[58%] w-[58%] rounded-full border-2 border-[#111111] bg-[#e4b43c]" />
        </div>
      )}

      {theme.visualBase === 'drafting' && (
        /* Bauhaus Drafting Crosshair Plate */
        <div className="relative flex h-full w-full items-center justify-center border-2 border-[#0b1615] bg-[#f5f0e2] shadow-[2px_2px_0_#0b1615]">
          <svg viewBox="0 0 32 32" className="h-[72%] w-[72%]" fill="none">
            <line x1="4" y1="4" x2="28" y2="28" stroke="#111111" strokeWidth="2.8" />
            <line x1="28" y1="4" x2="4" y2="28" stroke="#111111" strokeWidth="2.8" />
            <rect x="11" y="11" width="10" height="10" fill="#d6302a" stroke="#111111" strokeWidth="2" />
          </svg>
        </div>
      )}

      {theme.visualBase === 'midnight' && (
        /* Bauhaus Obsidian & Ochre Geometric Monolith */
        <div className="relative flex h-full w-full items-center justify-center border-2 border-[#e4b43c] bg-[#0b0d12] shadow-[2px_2px_0_#07080b]">
          <div className="h-[46%] w-[46%] rotate-45 border-2 border-[#0b0d12] bg-[#e4b43c]" />
        </div>
      )}

      {theme.visualBase === 'atelier' && (
        /* Bauhaus Atelier Split Diagonal Print Block */
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-2 border-[#111111] bg-[#111111] shadow-[2px_2px_0_#111111]">
          <svg viewBox="0 0 36 36" className="h-full w-full" preserveAspectRatio="none">
            <polygon points="0,0 36,0 0,36" fill="#2b56a3" />
            <polygon points="36,0 36,36 0,36" fill="#111111" />
            <circle cx="18" cy="18" r="6.5" fill="#e4b43c" stroke="#111111" strokeWidth="2" />
          </svg>
        </div>
      )}

      {theme.visualBase === 'gallery' && (
        /* Bauhaus Gallery Constructivist Cobalt & Red Split Block */
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden border-2 border-[#111111] bg-[#2b56a3] shadow-[2px_2px_0_#111111]">
          <svg viewBox="0 0 36 36" className="h-full w-full" preserveAspectRatio="none">
            <rect x="0" y="0" width="18" height="36" fill="#111111" />
            <rect x="18" y="0" width="18" height="18" fill="#d6302a" />
            <rect x="18" y="18" width="18" height="18" fill="#e4b43c" />
            <line x1="18" y1="0" x2="18" y2="36" stroke="#111111" strokeWidth="2.5" />
            <line x1="18" y1="18" x2="36" y2="18" stroke="#111111" strokeWidth="2.5" />
          </svg>
        </div>
      )}
    </div>
  );
};
