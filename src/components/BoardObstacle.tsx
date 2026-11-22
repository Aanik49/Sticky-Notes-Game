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
 * Diegetic immovable blocker on the board (ceramic magnet, wooden cork peg,
 * brass drafting weight, or steel studio knob) that blocks sticky notes in its lane.
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
      {theme.id === 'fridge' && (
        /* Glossy Ceramic Refrigerator Magnet */
        <div className="relative flex h-[74%] w-[74%] items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 shadow-[0_8px_16px_-3px_rgba(15,23,42,0.45),inset_0_2px_4px_rgba(255,255,255,0.4)]">
          <div className="h-[54%] w-[54%] rounded-full border border-white/40 bg-gradient-to-br from-rose-400 to-rose-600 shadow-inner" />
          <div className="absolute top-[16%] left-[22%] h-[18%] w-[26%] -rotate-30 rounded-full bg-white/45" />
        </div>
      )}

      {theme.id === 'cork' && (
        /* Carved Oak Peg / Heavy Brass Map Tack */
        <div className="relative flex h-[72%] w-[72%] items-center justify-center rounded-full border-2 border-[#4a2b14] bg-gradient-to-br from-[#8c5830] via-[#6d4120] to-[#46260f] shadow-[0_10px_18px_-4px_rgba(36,18,6,0.6),inset_0_2px_4px_rgba(255,220,180,0.35)]">
          <div className="h-[44%] w-[44%] rounded-full border border-amber-200/50 bg-gradient-to-br from-amber-300 to-amber-600 shadow" />
        </div>
      )}

      {theme.id === 'drafting' && (
        /* Anodized Brass Architect's Paperweight */
        <div className="relative flex h-[72%] w-[72%] items-center justify-center rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-[0_10px_18px_-4px_rgba(8,25,22,0.65),inset_0_1px_2px_rgba(255,255,255,0.6)]">
          <svg viewBox="0 0 24 24" className="h-[52%] w-[52%] text-amber-950/75" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 4v16M4 12h16" strokeLinecap="round" />
            <circle cx="12" cy="12" r="5" />
          </svg>
        </div>
      )}

      {theme.id === 'midnight' && (
        /* Knurled Industrial Steel Peg Knob */
        <div className="relative flex h-[72%] w-[72%] items-center justify-center rounded-full border-2 border-slate-400/40 bg-gradient-to-br from-slate-600 via-slate-800 to-slate-950 shadow-[0_10px_20px_rgba(0,0,0,0.75),inset_0_1px_2px_rgba(255,255,255,0.28)]">
          <div className="h-[46%] w-[46%] rounded-full border border-amber-400/50 bg-slate-900 shadow-inner" />
          <div className="absolute h-1.5 w-1.5 rounded-full bg-amber-400" />
        </div>
      )}
    </div>
  );
};
