import React from 'react';
import {
  ActiveNote,
  BlockerFeedback,
  Direction,
  HintState,
  ObstacleSpec,
  ThemeMeta,
} from '../game/types';
import { BoardObstacle } from './BoardObstacle';
import { StickyNote } from './StickyNote';

export interface PeelingGhost {
  key: string;
  note: ActiveNote;
  dir: Direction;
}

interface GameBoardProps {
  rows: number;
  cols: number;
  notes: ActiveNote[];
  peelingGhosts: PeelingGhost[];
  obstacles: ObstacleSpec[];
  theme: ThemeMeta;
  animateSpawn: boolean;
  levelKey: string;
  blockerFeedback: BlockerFeedback | null;
  hint: HintState | null;
  focusedCell: { r: number; c: number } | null;
  onTapNote: (note: ActiveNote, el: HTMLButtonElement | null) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  rows,
  cols,
  notes,
  peelingGhosts,
  obstacles,
  theme,
  animateSpawn,
  levelKey,
  blockerFeedback,
  hint,
  focusedCell,
  onTapNote,
}) => {
  const gapPct = cols >= 6 ? 2.0 : cols === 5 ? 2.3 : 2.8;
  const cellW = (100 - gapPct * (cols - 1)) / cols;
  const cellH = (100 - gapPct * (rows - 1)) / rows;

  const cellCenter = (r: number, c: number) => ({
    x: c * (cellW + gapPct) + cellW / 2,
    y: r * (cellH + gapPct) + cellH / 2,
  });

  const hintedNote = hint ? notes.find((n) => n.id === hint.noteId) ?? null : null;

  const getEdgeEndpoint = (r: number, c: number, dir: Direction) => {
    const start = cellCenter(r, c);
    if (dir === 'U') return { x: start.x, y: -3 };
    if (dir === 'D') return { x: start.x, y: 103 };
    if (dir === 'L') return { x: -3, y: start.y };
    return { x: 103, y: start.y };
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Diegetic Fridge Handle accent on right side for Fridge theme */}
      {theme.id === 'fridge' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1/2 hidden h-44 w-3 -translate-y-1/2 rounded-full border border-slate-300 bg-gradient-to-r from-white via-slate-200 to-slate-400 shadow-lg sm:block"
        />
      )}

      {/* Main Responsive Square Board */}
      <div
        className={`${theme.boardClass} relative aspect-square w-[min(calc(100vw-28px),calc(100dvh-236px),540px)] min-w-[264px] rounded-[24px] transition-shadow duration-300`}
      >
        {/* Corner Hardware Details for Cork Board */}
        {theme.id === 'cork' && (
          <>
            <span aria-hidden="true" className="pointer-events-none absolute -top-2 -left-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 shadow" />
            <span aria-hidden="true" className="pointer-events-none absolute -top-2 -right-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 shadow" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 -left-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 shadow" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 -right-2 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 shadow" />
          </>
        )}

        {/* Ruler Markings for Drafting Desk */}
        {theme.id === 'drafting' && (
          <div
            aria-hidden="true"
            className="font-mono-num pointer-events-none absolute top-1.5 left-4 right-4 flex justify-between text-[9px] font-medium tracking-widest text-teal-100/55"
          >
            {Array.from({ length: cols + 1 }).map((_, idx) => (
              <span key={idx}>{idx * 10}</span>
            ))}
          </div>
        )}

        {/* Subtle Diegetic Surface Stamp along bottom border */}
        <div
          aria-hidden="true"
          className={`font-mono-num pointer-events-none absolute bottom-1.5 right-3.5 text-[9px] font-semibold tracking-wider ${
            theme.id === 'drafting'
              ? 'text-teal-100/45'
              : theme.id === 'midnight'
                ? 'text-slate-400/45'
                : theme.id === 'cork'
                  ? 'text-[#3e220d]/45'
                  : 'text-slate-500/45'
          }`}
        >
          {theme.boardStamp}
        </div>

        {/* Inner Grid Padding Area */}
        <div className="absolute inset-4 sm:inset-5">
          {/* Subtle Slot Guides */}
          <div
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
              gap: `${gapPct}%`,
            }}
            className="pointer-events-none absolute inset-0 grid"
          >
            {Array.from({ length: rows * cols }).map((_, idx) => (
              <div
                key={idx}
                className={`rounded-lg border ${
                  theme.id === 'drafting'
                    ? 'border-teal-200/15 bg-teal-950/15'
                    : theme.id === 'midnight'
                      ? 'border-slate-500/15 bg-black/15'
                      : theme.id === 'cork'
                        ? 'border-[#4a2810]/18 bg-[#4a2810]/6'
                        : 'border-slate-400/20 bg-white/25'
                }`}
              />
            ))}
          </div>

          {/* Static Diegetic Obstacles */}
          {obstacles.map((obs) => {
            const isKnocked =
              blockerFeedback !== null &&
              blockerFeedback.isObstacle &&
              blockerFeedback.blockerR === obs.r &&
              blockerFeedback.blockerC === obs.c;

            return (
              <BoardObstacle
                key={`obs-${levelKey}-${obs.r}-${obs.c}`}
                obstacle={obs}
                leftPct={obs.c * (cellW + gapPct)}
                topPct={obs.r * (cellH + gapPct)}
                widthPct={cellW}
                heightPct={cellH}
                theme={theme}
                knockKey={isKnocked ? blockerFeedback.timestamp : 0}
              />
            );
          })}

          {/* Active Interactive Sticky Notes */}
          {notes.map((note, idx) => {
            const isBumped = blockerFeedback !== null && blockerFeedback.tappedId === note.id;
            const isKnocked =
              blockerFeedback !== null &&
              !blockerFeedback.isObstacle &&
              blockerFeedback.blockerId === note.id;

            return (
              <StickyNote
                key={`${levelKey}-${note.id}`}
                note={note}
                leftPct={note.c * (cellW + gapPct)}
                topPct={note.r * (cellH + gapPct)}
                widthPct={cellW}
                heightPct={cellH}
                cols={cols}
                theme={theme}
                spawnIndex={idx}
                animateSpawn={animateSpawn}
                bumpKey={isBumped ? blockerFeedback.timestamp : 0}
                bumpDir={isBumped ? blockerFeedback.dir : undefined}
                knockKey={isKnocked ? blockerFeedback.timestamp : 0}
                isHinted={hint !== null && hint.noteId === note.id}
                isFocused={focusedCell !== null && focusedCell.r === note.r && focusedCell.c === note.c}
                onTap={onTapNote}
              />
            );
          })}

          {/* Peeling-Out Flying Ghost Notes (never block rapid taps!) */}
          {peelingGhosts.map((ghost) => (
            <StickyNote
              key={ghost.key}
              note={ghost.note}
              leftPct={ghost.note.c * (cellW + gapPct)}
              topPct={ghost.note.r * (cellH + gapPct)}
              widthPct={cellW}
              heightPct={cellH}
              cols={cols}
              theme={theme}
              spawnIndex={0}
              animateSpawn={false}
              isPeeling={true}
              peelDir={ghost.dir}
              onTap={() => {}}
            />
          ))}

          {/* Sightline Vector Overlay: Blocked Collision Ray + Tier-2 Hint Clear Lane */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 z-40 h-full w-full overflow-visible"
          >
            {blockerFeedback && (() => {
              const start = cellCenter(blockerFeedback.tappedR, blockerFeedback.tappedC);
              const end = cellCenter(blockerFeedback.blockerR, blockerFeedback.blockerC);
              return (
                <g key={blockerFeedback.timestamp} className="sightline-blocked">
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#ef4444"
                    strokeWidth="2.2"
                    strokeDasharray="3.2 2.4"
                    strokeLinecap="round"
                  />
                  <circle cx={end.x} cy={end.y} r="3.4" fill="#ef4444" />
                </g>
              );
            })()}

            {hint && hint.tier === 2 && hintedNote && (() => {
              const start = cellCenter(hintedNote.r, hintedNote.c);
              const end = getEdgeEndpoint(hintedNote.r, hintedNote.c, hintedNote.dir);
              return (
                <g>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeDasharray="3 2.5"
                    strokeLinecap="round"
                    opacity="0.88"
                  />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};
