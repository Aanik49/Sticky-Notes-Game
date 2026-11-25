import React from 'react';
import { PAPER_STYLES } from '../game/mastery';
import { TAPE_COLOR_META } from '../game/solver';
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
  isTapedLocked?: boolean;
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
    className={`${className} pointer-events-none transition-transform duration-200 ease-out`}
  >
    {variant === 'technical' ? (
      <>
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
        <path
          d="M5 14.5H18.5V9L29.5 18L18.5 27V21.5H5V14.5Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="miter"
        />
        <line
          x1="9.5"
          y1="18"
          x2="17"
          y2="18"
          stroke={stroke === fill ? '#f7f4ec' : stroke}
          strokeWidth="2"
        />
      </>
    ) : variant === 'foil' ? (
      <>
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
  isTapedLocked = false,
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
  const tapeMeta = note.tapeColor ? TAPE_COLOR_META[note.tapeColor] : null;
  const keyMeta = note.keyColor ? TAPE_COLOR_META[note.keyColor] : null;

  const ariaExtra = [
    note.under ? 'stacked 2 sheets' : '',
    isTapedLocked && tapeMeta ? `locked with ${tapeMeta.label} tape` : '',
    keyMeta ? `${keyMeta.label} key note` : '',
    note.pivot ? 'rotating pivot note' : '',
    note.linkId ? `chain-linked pair ${note.linkId}` : '',
  ]
    .filter(Boolean)
    .join(', ');

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
        aria-label={`Sticky note at row ${note.r + 1}, column ${note.c + 1}, arrow pointing ${DIR_LABEL[note.dir]}${ariaExtra ? `, ${ariaExtra}` : ''}`}
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

        {/* STUDIO LAB 1A: TAPED / LOCKED BAUHAUS COLOR STRIP (locks until matching Key Note peels) */}
        {isTapedLocked && tapeMeta && !isPeeling && (
          <>
            {/* Diagonal Bauhaus Tape Strip across top-left corner */}
            <svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              className="pointer-events-none absolute -top-[3px] -left-[3px] z-20 h-[56%] w-[56%] overflow-visible"
            >
              <polygon
                points="0,18 18,0 32,0 0,32"
                fill={tapeMeta.hex}
                stroke="#111111"
                strokeWidth="2.4"
                strokeLinejoin="miter"
              />
              {/* Tiny centered Bauhaus padlock silhouette on the tape */}
              <rect
                x="5"
                y="11"
                width="9"
                height="7"
                fill={tapeMeta.text}
                stroke="#111111"
                strokeWidth="1.5"
              />
              <path
                d="M7 11V8.5a2.5 2.5 0 0 1 5 0V11"
                fill="none"
                stroke={tapeMeta.text}
                strokeWidth="1.8"
              />
            </svg>
            {/* Bottom-left matching tape anchor bar */}
            <span
              aria-hidden="true"
              style={{ backgroundColor: tapeMeta.hex }}
              className="pointer-events-none absolute bottom-0 left-0 z-10 h-1.5 w-[55%] border-t-2 border-r-2 border-[#111111]"
            />
          </>
        )}

        {/* STUDIO LAB 1B: KEY NOTE BADGE (peeling unlocks matching-color tape) */}
        {keyMeta && !isPeeling && (
          <div
            aria-hidden="true"
            style={{ backgroundColor: keyMeta.hex, color: keyMeta.text }}
            className="pointer-events-none absolute -top-1 -left-1 z-20 flex h-5 w-5 items-center justify-center border-2 border-[#111111] shadow-[1.5px_1.5px_0_#111111] sm:h-5.5 sm:w-5.5"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
              <circle cx="7" cy="10" r="3.4" stroke="currentColor" strokeWidth="2.2" />
              <path
                d="M10.4 10H17M14.5 10V13M16.5 10V12.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="square"
              />
            </svg>
          </div>
        )}

        {/* STUDIO LAB 2: ROTATING / PIVOT NOTE (corner pin + clockwise rotation ring) */}
        {note.pivot && !isPeeling && (
          <>
            {/* Corner brass/ochre pivot pin */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1 left-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#111111] bg-[#e4b43c] shadow-[1px_1px_0_#111111] sm:h-4 sm:w-4"
            >
              <span className="h-1 w-1 rounded-full bg-[#111111]" />
            </span>
            {/* Subtle clockwise rotation arc around arrow */}
            <svg
              aria-hidden="true"
              viewBox="0 0 44 44"
              fill="none"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full p-1 opacity-55"
            >
              <path
                d="M22 5 A17 17 0 1 1 7.5 31"
                stroke={arrowStroke}
                strokeWidth="1.6"
                strokeDasharray="3 2.5"
              />
              <polygon points="22,2.2 26.5,5.5 22,8.5" fill={arrowStroke} />
            </svg>
          </>
        )}

        {/* STUDIO LAB 3: CHAIN-PEEL LINKED PAIR BADGE */}
        {note.linkId && !isPeeling && (
          <span
            aria-hidden="true"
            className="font-mono-num pointer-events-none absolute bottom-0.5 left-0.5 z-20 flex h-4.5 items-center gap-0.5 border border-[#111111] bg-[#111111] px-1 text-[9px] leading-none font-black text-[#e4b43c]"
          >
            <svg viewBox="0 0 14 10" fill="none" className="h-2.5 w-3">
              <rect x="1" y="2" width="5.5" height="6" stroke="currentColor" strokeWidth="1.6" />
              <rect x="7.5" y="2" width="5.5" height="6" stroke="currentColor" strokeWidth="1.6" />
              <line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>{note.linkId}</span>
          </span>
        )}

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
          className={`${arrowSize} ${isTapedLocked ? 'opacity-70' : ''}`}
        />
      </button>
    </div>
  );
};
