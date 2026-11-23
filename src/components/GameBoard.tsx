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
  const gapPct = cols >= 6 ? 2.1 : cols === 5 ? 2.4 : 2.9;
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

  const slotBorderClass =
    theme.id === 'drafting'
      ? 'border-[#f5f0e2]/25 bg-[#12423d]/35'
      : theme.id === 'midnight'
        ? 'border-[#f5f0e2]/18 bg-[#0e1017]/40'
        : 'border-[#111111]/25 bg-black/[0.025]';

  const stampColorClass =
    theme.id === 'drafting'
      ? 'text-[#f5f0e2]/65'
      : theme.id === 'midnight'
        ? 'text-[#e4b43c]/70'
        : 'text-[#111111]/60';

  return (
    <div className="relative flex items-center justify-center">
      {/* Subtle Architectural Mondrian Side Accent Strip on wide viewports */}
      <div
        aria-hidden="true"
        className="pointer-events-none mr-3 hidden flex-col border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] md:flex"
      >
        <span className="h-14 w-3.5 border-b-[3px] border-[#111111] bg-[#d6302a]" />
        <span className="h-20 w-3.5 border-b-[3px] border-[#111111] bg-[#e4b43c]" />
        <span className="h-14 w-3.5 bg-[#2b56a3]" />
      </div>

      {/* Main Responsive Square Bauhaus Grid Board */}
      <div
        className={`${theme.boardClass} relative aspect-square w-[min(calc(100vw-28px),calc(100dvh-236px),532px)] min-w-[264px] rounded-none transition-colors duration-300`}
      >
        {/* Crisp Architectural Corner Ticks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 h-2.5 w-2.5 border-r-2 border-b-2 border-[#111111] bg-[#d6302a]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-2.5 w-2.5 border-b-2 border-l-2 border-[#111111] bg-[#2b56a3]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-t-2 border-r-2 border-[#111111] bg-[#e4b43c]"
        />

        {/* Subtle Architectural Scale Markings on Drafting / Atelier / Gallery */}
        {(theme.id === 'drafting' || theme.id === 'atelier' || theme.id === 'gallery') && (
          <div
            aria-hidden="true"
            className={`font-mono-num pointer-events-none absolute top-1 left-4 right-4 flex justify-between text-[9px] font-bold tracking-widest ${
              theme.id === 'drafting' ? 'text-[#f5f0e2]/60' : 'text-[#111111]/50'
            }`}
          >
            {Array.from({ length: cols + 1 }).map((_, idx) => (
              <span key={idx}>{idx * 10}</span>
            ))}
          </div>
        )}

        {/* Diegetic Bauhaus Grid Stamp along bottom border */}
        <div
          aria-hidden="true"
          className={`font-mono-num pointer-events-none absolute bottom-1 right-3 text-[9px] font-bold tracking-widest ${stampColorClass}`}
        >
          {theme.boardStamp}
        </div>

        {/* Inner Grid Padding Area */}
        <div className="absolute inset-4 sm:inset-5">
          {/* Crisp Architectural Rectilinear Slot Guides */}
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
              <div key={idx} className={`rounded-none border ${slotBorderClass}`} />
            ))}
          </div>

          {/* Static Bauhaus Geometric Obstacles */}
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

          {/* Active Interactive Bauhaus Sticky Notes */}
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

          {/* Peeling-Out Flying Ghost Notes */}
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
                    stroke="#d6302a"
                    strokeWidth="2.4"
                    strokeDasharray="3.2 2.2"
                  />
                  <rect
                    x={end.x - 3}
                    y={end.y - 3}
                    width="6"
                    height="6"
                    fill="#d6302a"
                    stroke="#111111"
                    strokeWidth="1"
                  />
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
                    strokeWidth="2.4"
                    strokeDasharray="3.2 2.2"
                    opacity="0.92"
                  />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Right Complementary Bauhaus Accent Strip on wide viewports */}
      <div
        aria-hidden="true"
        className="pointer-events-none ml-3 hidden flex-col border-[3px] border-[#111111] shadow-[4px_4px_0_#111111] md:flex"
      >
        <span className="h-16 w-3.5 border-b-[3px] border-[#111111] bg-[#2b56a3]" />
        <span className="h-14 w-3.5 border-b-[3px] border-[#111111] bg-[#f5f0e2]" />
        <span className="h-18 w-3.5 bg-[#d6302a]" />
      </div>
    </div>
  );
};
