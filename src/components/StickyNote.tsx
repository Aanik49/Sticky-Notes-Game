import React from 'react';
import { ActiveNote, Direction, PaperColor, ThemeMeta } from '../game/types';

interface StickyNoteProps {
  note: ActiveNote;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  cols: number;
  theme: ThemeMeta;
  spawnIndex: number;
  animateSpawn: boolean;
  isPeeling?: boolean;
  peelDir?: Direction;
  bumpKey?: number;
  bumpDir?: Direction;
  knockKey?: number;
  isHinted?: boolean;
  isFocused?: boolean;
  onTap: (note: ActiveNote, el: HTMLButtonElement | null) => void;
}

const ARROW_ROT: Record<Direction, number> = {
  R: 0,
  D: 90,
  L: 180,
  U: -90,
};

const DIR_LABEL: Record<Direction, string> = {
  U: 'Up',
  D: 'Down',
  L: 'Left',
  R: 'Right',
};

const UNDER_BG: Record<PaperColor, string> = {
  canary: '#e4b43c',
  coral: '#d6302a',
  sky: '#2b56a3',
  mint: '#f3eee0',
  apricot: '#dc6b2f',
  lavender: '#1e6b64',
};

const ARROW_FILL: Record<PaperColor, string> = {
  canary: '#d6302a',   // Vermilion arrow on Ochre note
  coral: '#e4b43c',    // Ochre arrow on Vermilion note
  sky: '#f5f0e2',      // Archival cream arrow on Cobalt note
  mint: '#2b56a3',     // Cobalt arrow on Archival Cream note
  apricot: '#f5f0e2',  // Archival cream arrow on Cadmium Orange note
  lavender: '#e4b43c', // Ochre arrow on Bauhaus Teal note
};

const CORNER_FOLD_FILL: Record<PaperColor, string> = {
  canary: '#c99724',
  coral: '#ad211c',
  sky: '#1d3f7a',
  mint: '#dad3c1',
  apricot: '#b8511b',
  lavender: '#144e49',
};

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  leftPct,
  topPct,
  widthPct,
  heightPct,
  cols,
  spawnIndex,
  animateSpawn,
  isPeeling = false,
  peelDir,
  bumpKey = 0,
  bumpDir,
  knockKey = 0,
  isHinted = false,
  isFocused = false,
  onTap,
}) => {
  const arrowSize =
    cols >= 6
      ? 'w-6 h-6 sm:w-8 sm:h-8'
      : cols === 5
        ? 'w-7 h-7 sm:w-9 sm:h-9'
        : cols === 4
          ? 'w-8 h-8 sm:w-11 sm:h-11'
          : 'w-10 h-10 sm:w-13 sm:h-13';

  const animClass = isPeeling
    ? `is-peeling peel-${peelDir ?? note.dir}`
    : bumpKey > 0 && bumpDir
      ? `is-blocked bump-${bumpDir}`
      : knockKey > 0
        ? 'blocker-knock'
        : isHinted
          ? 'hint-active'
          : animateSpawn
            ? 'note-spawn'
            : '';

  const foldColor = CORNER_FOLD_FILL[note.color];
  const arrowFill = ARROW_FILL[note.color];

  return (
    <div
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
      }}
      className="absolute"
    >
      {/* Sharp Bauhaus under-layer offset when this note is a 2-sheet stack */}
      {note.under && !isPeeling && (
        <div
          aria-hidden="true"
          style={{
            backgroundColor: UNDER_BG[note.under.color],
            transform: 'translate(5px, 5px)',
          }}
          className="pointer-events-none absolute inset-0 border-2 border-[#111111]"
        />
      )}

      <button
        key={`${note.id}-b${bumpKey}-k${knockKey}`}
        type="button"
        disabled={isPeeling}
        onClick={(e) => onTap(note, e.currentTarget)}
        aria-label={`Sticky note at row ${note.r + 1}, column ${note.c + 1}, arrow pointing ${DIR_LABEL[note.dir]}${note.under ? ', stacked 2 sheets' : ''}`}
        style={{
          animationDelay:
            animateSpawn && !isPeeling && bumpKey === 0 && knockKey === 0
              ? `${Math.min(spawnIndex * 18, 260)}ms`
              : undefined,
        }}
        className={`sticky-note-card paper-${note.color} inset-0 flex h-full w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2b56a3] ${
          isFocused ? 'ring-3 ring-[#2b56a3] ring-offset-2' : ''
        } ${animClass}`}
      >
        {/* Top-Right Geometric Dog-Ear Corner Fold */}
        <svg
          aria-hidden="true"
          viewBox="0 0 18 18"
          className="pointer-events-none absolute -top-[1px] -right-[1px] h-[22%] w-[22%] max-h-[16px] max-w-[16px] min-h-[10px] min-w-[10px]"
        >
          <polygon points="0,0 18,0 18,18" fill="#f5f0e2" />
          <polygon points="0,0 0,18 18,18" fill={foldColor} stroke="#111111" strokeWidth="2.2" strokeLinejoin="miter" />
        </svg>

        {/* Bottom-Right Geometric Dog-Ear Corner Fold */}
        <svg
          aria-hidden="true"
          viewBox="0 0 18 18"
          className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-[22%] w-[22%] max-h-[16px] max-w-[16px] min-h-[10px] min-w-[10px]"
        >
          <polygon points="18,0 18,18 0,18" fill="#f5f0e2" />
          <polygon points="0,0 18,0 0,18" fill={foldColor} stroke="#111111" strokeWidth="2.2" strokeLinejoin="miter" />
        </svg>

        {/* Stacked 2-sheet square ink counter badge (top-left so corner folds stay clean) */}
        {note.under && (
          <span
            aria-hidden="true"
            className="font-mono-num pointer-events-none absolute top-0.5 left-0.5 z-10 flex h-4 min-w-4 items-center justify-center border border-[#111111] bg-[#111111] px-1 text-[9px] leading-none font-bold text-[#f5f0e2]"
          >
            ×2
          </span>
        )}

        {/* Bold Bauhaus Black-Outlined Filled Block Arrow */}
        <svg
          aria-hidden="true"
          viewBox="0 0 36 36"
          fill="none"
          style={{ transform: `rotate(${ARROW_ROT[note.dir]}deg)` }}
          className={`${arrowSize} pointer-events-none transition-transform duration-150`}
        >
          <path
            d="M6 14.2H19.5V8.5L30.5 18L19.5 27.5V21.8H6V14.2Z"
            fill={arrowFill}
            stroke="#111111"
            strokeWidth="2.4"
            strokeLinejoin="miter"
          />
        </svg>
      </button>
    </div>
  );
};
