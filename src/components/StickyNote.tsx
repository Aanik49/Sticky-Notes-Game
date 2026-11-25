import React from 'react';
import { PAPER_STYLES } from '../game/mastery';
import { ActiveNote, Direction, PaperStyleId, ThemeMeta } from '../game/types';

interface StickyNoteProps {
  note: ActiveNote;
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  cols: number;
  theme: ThemeMeta;
  paperStyle?: PaperStyleId;
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

export const BauhausNoteArrow: React.FC<{
  dir: Direction;
  variant: 'block' | 'technical' | 'double' | 'foil';
  fill: string;
  stroke: string;
  className: string;
}> = ({ dir, variant, fill, stroke, className }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 36 36"
    fill="none"
    style={{ transform: `rotate(${ARROW_ROT[dir]}deg)` }}
    className={`${className} pointer-events-none transition-transform duration-150`}
  >
    {variant === 'technical' ? (
      <>
        {/* Blueprint architectural vector arrow with drafting tail crosshair */}
        <line x1="6" y1="12" x2="6" y2="24" stroke={fill} strokeWidth="2.4" />
        <line x1="6" y1="18" x2="27" y2="18" stroke={fill} strokeWidth="3.2" />
        <polygon
          points="19,9.5 31,18 19,26.5 22,18"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.6"
          strokeLinejoin="miter"
        />
      </>
    ) : variant === 'double' ? (
      <>
        {/* Mono Ink stark double-chevron constructivist arrow */}
        <path
          d="M5 14.5H18.5V9L29.5 18L18.5 27V21.5H5V14.5Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="miter"
        />
        <line x1="9.5" y1="18" x2="17" y2="18" stroke={stroke === fill ? '#f7f4ec' : stroke} strokeWidth="2" />
      </>
    ) : variant === 'foil' ? (
      <>
        {/* Gold Foil faceted museum emblem arrow with inner specular line */}
        <path
          d="M5.5 14H19V8L31 18L19 28V22H5.5V14Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.3"
          strokeLinejoin="miter"
        />
        <path
          d="M8 16.5H20.5V12.5L26.8 18"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="1.4"
          strokeLinejoin="miter"
        />
      </>
    ) : (
      /* Classic Bauhaus bold black-outlined block arrow */
      <path
        d="M6 14.2H19.5V8.5L30.5 18L19.5 27.5V21.8H6V14.2Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinejoin="miter"
      />
    )}
  </svg>
);

export const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  leftPct,
  topPct,
  widthPct,
  heightPct,
  cols,
  paperStyle = 'primary',
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
  const styleMeta = PAPER_STYLES[paperStyle];
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

  const foldColor = styleMeta.foldFill[note.color];
  const arrowFill = styleMeta.arrowFill[note.color];
  const arrowStroke = styleMeta.arrowStroke[note.color];

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
            backgroundColor: styleMeta.paperHex[note.under.color],
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
          <polygon points="0,0 18,0 18,18" fill={styleMeta.cornerReveal} />
          <polygon
            points="0,0 0,18 18,18"
            fill={foldColor}
            stroke={arrowStroke}
            strokeWidth="2.2"
            strokeLinejoin="miter"
          />
        </svg>

        {/* Bottom-Right Geometric Dog-Ear Corner Fold */}
        <svg
          aria-hidden="true"
          viewBox="0 0 18 18"
          className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-[22%] w-[22%] max-h-[16px] max-w-[16px] min-h-[10px] min-w-[10px]"
        >
          <polygon points="18,0 18,18 0,18" fill={styleMeta.cornerReveal} />
          <polygon
            points="0,0 18,0 0,18"
            fill={foldColor}
            stroke={arrowStroke}
            strokeWidth="2.2"
            strokeLinejoin="miter"
          />
        </svg>

        {/* Stacked 2-sheet square ink counter badge */}
        {note.under && (
          <span
            aria-hidden="true"
            className="font-mono-num pointer-events-none absolute top-0.5 left-0.5 z-10 flex h-4 min-w-4 items-center justify-center border border-[#111111] bg-[#111111] px-1 text-[9px] leading-none font-bold text-[#f5f0e2]"
          >
            ×2
          </span>
        )}

        {/* Style-Matched Bauhaus Directional Arrow */}
        <BauhausNoteArrow
          dir={note.dir}
          variant={styleMeta.arrowVariant}
          fill={arrowFill}
          stroke={arrowStroke}
          className={arrowSize}
        />
      </button>
    </div>
  );
};
