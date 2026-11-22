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
  canary: '#facc15',
  coral: '#fb7185',
  sky: '#38bdf8',
  mint: '#4ade80',
  apricot: '#fb923c',
  lavender: '#c084fc',
};

const PIN_COLORS = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed'];

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  leftPct,
  topPct,
  widthPct,
  heightPct,
  cols,
  theme,
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
  const pinColor = PIN_COLORS[(note.r * 5 + note.c * 3) % PIN_COLORS.length];
  const arrowSize =
    cols >= 6 ? 'w-6 h-6 sm:w-8 sm:h-8' : cols === 5 ? 'w-7 h-7 sm:w-9 sm:h-9' : cols === 4 ? 'w-8 h-8 sm:w-11 sm:h-11' : 'w-10 h-10 sm:w-13 sm:h-13';

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
      {/* Under-layer peeking edge when this note is a 2-sheet stack */}
      {note.under && !isPeeling && (
        <div
          aria-hidden="true"
          style={{
            backgroundColor: UNDER_BG[note.under.color],
            transform: `translate(4px, 5px) rotate(${note.tilt - 2.6}deg)`,
          }}
          className="pointer-events-none absolute inset-0 rounded-[5px] rounded-br-[18px] opacity-95 shadow-md ring-1 ring-black/10"
        />
      )}

      <button
        key={`${note.id}-b${bumpKey}-k${knockKey}`}
        type="button"
        disabled={isPeeling}
        onClick={(e) => onTap(note, e.currentTarget)}
        aria-label={`Sticky note at row ${note.r + 1}, column ${note.c + 1}, arrow pointing ${DIR_LABEL[note.dir]}${note.under ? ', stacked 2 sheets' : ''}`}
        style={
          {
            '--tilt': `${note.tilt}deg`,
            transform: `rotate(${note.tilt}deg)`,
            animationDelay: animateSpawn && !isPeeling && bumpKey === 0 && knockKey === 0
              ? `${Math.min(spawnIndex * 18, 280)}ms`
              : undefined,
          } as React.CSSProperties
        }
        className={`sticky-note-card paper-${note.color} inset-0 flex h-full w-full cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-500 ${
          isFocused ? 'ring-3 ring-sky-500 ring-offset-2' : ''
        } ${animClass}`}
      >
        {/* Diegetic Fastener Per Theme */}
        {theme.fastenerType === 'pushpin' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1.5 left-1/2 z-10 -translate-x-1/2"
          >
            <span
              className="block h-3.5 w-3.5 rounded-full shadow-md ring-1 ring-black/20"
              style={{
                background: `radial-gradient(circle at 32% 30%, #ffffff 0%, ${pinColor} 42%, #111827 120%)`,
              }}
            />
          </span>
        )}

        {theme.fastenerType === 'magnet' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 left-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/80 bg-gradient-to-br from-white via-slate-200 to-slate-400 shadow-sm"
          />
        )}

        {theme.fastenerType === 'tape' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1.5 left-1/2 z-10 h-3 w-8 -translate-x-1/2 -rotate-2 rounded-[2px] border border-white/30 bg-amber-50/65 shadow-xs backdrop-blur-[1px]"
          />
        )}

        {theme.fastenerType === 'clip' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1 left-1/2 z-10 h-2 w-6 -translate-x-1/2 rounded-b-sm bg-gradient-to-b from-amber-300 to-amber-600 shadow-sm"
          />
        )}

        {/* Stacked 2-sheet corner counter indicator */}
        {note.under && (
          <span
            aria-hidden="true"
            className="font-mono-num pointer-events-none absolute top-1 right-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-sm bg-black/15 px-1 text-[10px] leading-none font-bold"
          >
            ×2
          </span>
        )}

        {/* Hand-inked crisp directional marker arrow */}
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          fill="none"
          style={{ transform: `rotate(${ARROW_ROT[note.dir]}deg)` }}
          className={`${arrowSize} pointer-events-none drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-150`}
        >
          <path
            d="M5.5 16H24.5"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path
            d="M17.5 8.5L25.5 16L17.5 23.5"
            stroke="currentColor"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
