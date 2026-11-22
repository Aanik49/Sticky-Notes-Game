import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Infinity as InfinityIcon,
  Music,
  Play,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  formatDailyDateLabel,
  getTodayDateKey,
  PACK_LEVELS,
  THEME_ORDER,
  THEMES,
} from '../game/levels';
import { checkNotePath, PAPER_HEX } from '../game/solver';
import { ActiveNote, Direction, SavedProgress, ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';

interface TitleScreenProps {
  selectedTheme: ThemeId;
  progress: SavedProgress;
  muted: boolean;
  musicMuted: boolean;
  onSelectTheme: (theme: ThemeId) => void;
  onStartPack: (theme: ThemeId) => void;
  onStartDaily: () => void;
  onStartEndless: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onParticlePeel: (x: number, y: number, dir: Direction, colorHex: string) => void;
}

const DEMO_WALL: Omit<ActiveNote, 'id'>[] = [
  { r: 0, c: 0, dir: 'U', color: 'canary', tilt: -2.2 },
  { r: 0, c: 1, dir: 'R', color: 'coral', tilt: 1.8 },
  { r: 0, c: 2, dir: 'R', color: 'sky', tilt: -1.4 },
  { r: 1, c: 0, dir: 'U', color: 'mint', tilt: 2.1 },
  { r: 1, c: 1, dir: 'U', color: 'apricot', tilt: -1.6 },
  { r: 1, c: 2, dir: 'D', color: 'lavender', tilt: 1.5 },
  { r: 2, c: 0, dir: 'L', color: 'sky', tilt: -1.8 },
  { r: 2, c: 1, dir: 'L', color: 'canary', tilt: 1.2 },
  { r: 2, c: 2, dir: 'D', color: 'mint', tilt: -2.0 },
];

const ARROW_ROT: Record<Direction, number> = { R: 0, D: 90, L: 180, U: -90 };

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedTheme,
  progress,
  muted,
  musicMuted,
  onSelectTheme,
  onStartPack,
  onStartDaily,
  onStartEndless,
  onToggleMute,
  onToggleMusic,
  onParticlePeel,
}) => {
  const theme = THEMES[selectedTheme];
  const todayKey = getTodayDateKey();
  const todayLabel = formatDailyDateLabel(todayKey);
  const todayDailyRecord = progress.dailyRecords[todayKey];

  const [demoNotes, setDemoNotes] = useState<ActiveNote[]>(() =>
    DEMO_WALL.map((n, i) => ({ ...n, id: `demo-${i}` }))
  );
  const [peelingIds, setPeelingIds] = useState<Record<string, Direction>>({});
  const [bumpedId, setBumpedId] = useState<{ id: string; dir: Direction; ts: number } | null>(null);
  const [demoResetting, setDemoResetting] = useState(false);

  // Auto-repopulate the interactive hero wall once cleared
  useEffect(() => {
    if (demoNotes.length === 0) {
      setDemoResetting(true);
      const t = window.setTimeout(() => {
        setDemoNotes(DEMO_WALL.map((n, i) => ({ ...n, id: `demo-${Date.now()}-${i}` })));
        setPeelingIds({});
        setDemoResetting(false);
      }, 650);
      return () => window.clearTimeout(t);
    }
  }, [demoNotes.length]);

  const handleDemoTap = (note: ActiveNote, el: HTMLButtonElement | null) => {
    if (peelingIds[note.id]) return;
    const res = checkNotePath(note, demoNotes, [], 3, 3);
    if (res.clear) {
      sound.playPeel(1, selectedTheme);
      if (el) {
        const rect = el.getBoundingClientRect();
        onParticlePeel(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          note.dir,
          PAPER_HEX[note.color]
        );
      }
      setPeelingIds((prev) => ({ ...prev, [note.id]: note.dir }));
      window.setTimeout(() => {
        setDemoNotes((prev) => prev.filter((n) => n.id !== note.id));
      }, 340);
    } else {
      sound.playBump(selectedTheme);
      setBumpedId({ id: note.id, dir: note.dir, ts: Date.now() });
    }
  };

  const getPackStars = (packId: ThemeId) => {
    const levels = PACK_LEVELS[packId];
    const earned = levels.reduce((acc, lvl) => acc + (progress.records[lvl.id]?.stars ?? 0), 0);
    return { earned, total: levels.length * 3 };
  };

  const totalEarnedStars = THEME_ORDER.reduce((sum, id) => sum + getPackStars(id).earned, 0);
  const totalPossibleStars = THEME_ORDER.reduce((sum, id) => sum + getPackStars(id).total, 0);

  return (
    <div
      className={`${theme.worldClass} relative flex h-dvh w-screen flex-col overflow-hidden transition-colors duration-500`}
    >
      {/* Top Quiet Perimeter Bar with Game Icon + Music & Sound Buttons */}
      <header className="z-20 flex shrink-0 items-center justify-between px-5 pt-4 pb-2 sm:px-8 sm:pt-6">
        <div className="flex items-center gap-3">
          <GameIcon className="h-9 w-9 shrink-0 drop-shadow-sm sm:h-10 sm:w-10" />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-semibold opacity-80 sm:text-sm">
            <span className="font-mono-num flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
              {totalEarnedStars}/{totalPossibleStars}
            </span>
            {progress.dailyStreak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">Daily Streak {progress.dailyStreak}</span>
              </>
            )}
            {progress.endlessBestStreak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">Endless {progress.endlessBestStreak}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={musicMuted ? 'Unmute background music' : 'Mute background music'}
            title={musicMuted ? 'Music Off' : 'Music On'}
            className={`relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition active:scale-95 ${
              theme.isDark
                ? 'bg-white/10 text-slate-100 hover:bg-white/15'
                : 'bg-black/6 text-current hover:bg-black/10'
            }`}
          >
            <Music className={`h-5 w-5 ${musicMuted ? 'text-rose-500 opacity-75' : ''}`} />
            {musicMuted && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-[2px] w-6 rotate-45 rounded-full bg-rose-500"
              />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={muted ? 'Sound Off' : 'Sound On'}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition active:scale-95 ${
              theme.isDark
                ? 'bg-white/10 text-slate-100 hover:bg-white/15'
                : 'bg-black/6 text-current hover:bg-black/10'
            }`}
          >
            {muted ? <VolumeX className="h-5 w-5 text-rose-500" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Responsive Stage: Split 2-column on desktop, airy vertical stack on mobile */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 px-5 pb-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        {/* Left Zone: Bespoke SVG Title Lockup + Pack Selector + Primary Play CTA + Daily Puzzle */}
        <div className="flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
          {/* Bespoke Inline SVG Layered Sticky-Note Title Lockup */}
          <svg
            viewBox="0 0 380 128"
            role="img"
            aria-label="Sticky Notes Puzzle"
            className="mb-1.5 h-auto w-[264px] sm:w-[330px] lg:w-[360px]"
          >
            <defs>
              <filter id="noteShadow" x="-15%" y="-15%" width="135%" height="145%">
                <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.22" />
              </filter>
            </defs>

            {/* Decorative Back Notes */}
            <g transform="translate(18, 22) rotate(-8)" filter="url(#noteShadow)">
              <rect width="74" height="74" rx="8" fill="#fb7185" />
              <rect width="74" height="16" rx="4" fill="#ffffff" fillOpacity="0.28" />
              <path d="M24 44h26M41 35l9 9-9 9" stroke="#4c0519" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            <g transform="translate(292, 16) rotate(9)" filter="url(#noteShadow)">
              <rect width="70" height="70" rx="8" fill="#38bdf8" />
              <rect width="70" height="15" rx="4" fill="#ffffff" fillOpacity="0.28" />
              <path d="M35 50V24M26 33l9-9 9 9" stroke="#082f49" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>

            {/* Primary Canary Title Note */}
            <g transform="translate(66, 8) rotate(-2)" filter="url(#noteShadow)">
              <path
                d="M10 0 H242 A10 10 0 0 1 252 10 V82 L228 106 H10 A10 10 0 0 1 0 96 V10 A10 10 0 0 1 10 0 Z"
                fill="#fde047"
              />
              <rect x="0" y="0" width="252" height="22" rx="6" fill="#ffffff" fillOpacity="0.34" />
              {/* Curled corner flap */}
              <path d="M228 106 V86 A4 4 0 0 1 232 82 H252 Z" fill="#eab308" />
              <text
                x="126"
                y="54"
                textAnchor="middle"
                fill="#291503"
                style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '36px', letterSpacing: '-0.02em' }}
              >
                STICKY NOTES
              </text>
              <text
                x="126"
                y="84"
                textAnchor="middle"
                fill="#713f12"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.18em' }}
              >
                PEEL TO CLEAR
              </text>
            </g>
          </svg>

          <p className="mb-4 max-w-sm text-sm leading-relaxed opacity-80 sm:text-[15px]">
            Tap any note to peel it off along its arrow. Clear blocking notes first to uncover the entire wall.
          </p>

          {/* Pack World Selector (4 Distinct Tactile Packs) */}
          <div className="mb-4 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            {THEME_ORDER.map((id) => {
              const t = THEMES[id];
              const isSelected = id === selectedTheme;
              const stats = getPackStars(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectTheme(id);
                  }}
                  className={`group flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${
                    isSelected
                      ? theme.isDark
                        ? 'border-amber-400 bg-white/12 text-white shadow-md'
                        : 'border-slate-900 bg-white/90 text-slate-900 shadow-md'
                      : theme.isDark
                        ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'border-black/8 bg-white/45 text-current hover:bg-white/75'
                  }`}
                >
                  {/* Mini surface swatch */}
                  <span
                    aria-hidden="true"
                    className={`${t.boardClass} h-8 w-8 shrink-0 rounded-lg !border-2 !shadow-sm`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display truncate text-sm font-semibold leading-tight">
                      {t.shortName}
                    </div>
                    <div className="font-mono-num mt-0.5 flex items-center gap-1 text-[11px] opacity-70">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                      <span>
                        {stats.earned}/{stats.total}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Daily Puzzle + Endless Wall Row (Positioned above Play button) */}
          <div className="mb-2.5 grid w-full grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={onStartDaily}
              className={`col-span-3 flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left transition active:translate-y-0.5 ${
                todayDailyRecord
                  ? theme.isDark
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/16'
                    : 'border-emerald-600/30 bg-emerald-50/85 text-emerald-950 hover:bg-emerald-50'
                  : theme.isDark
                    ? 'border-amber-400/40 bg-amber-400/12 text-amber-100 hover:bg-amber-400/18'
                    : 'border-slate-900/20 bg-white/80 text-slate-900 hover:bg-white'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {todayDailyRecord ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                ) : (
                  <Calendar className="h-5 w-5 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0">
                  <div className="font-display truncate text-sm font-bold leading-tight">
                    Daily Puzzle
                  </div>
                  <div className="font-mono-num truncate text-[11px] opacity-70">
                    {todayLabel}
                  </div>
                </div>
              </div>

              {todayDailyRecord ? (
                <div className="flex shrink-0 items-center gap-0.5" aria-label={`Completed with ${todayDailyRecord.stars} stars`}>
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= todayDailyRecord.stars
                          ? 'fill-amber-400 text-amber-500'
                          : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="shrink-0 text-xs font-bold opacity-75">Play</span>
              )}
            </button>

            <button
              type="button"
              onClick={onStartEndless}
              className={`font-display col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-sm font-bold transition active:translate-y-0.5 whitespace-nowrap ${
                theme.isDark
                  ? 'border-white/20 bg-white/8 text-white hover:bg-white/14'
                  : 'border-slate-900/20 bg-white/75 text-slate-900 hover:bg-white'
              }`}
              title="Play Endless Generated Walls"
            >
              <InfinityIcon className="h-4 w-4 shrink-0" />
              <span>Endless</span>
            </button>
          </div>

          {/* Primary Play Action */}
          <button
            type="button"
            onClick={() => onStartPack(selectedTheme)}
            className="font-display flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-6 py-3.5 text-lg font-bold text-amber-300 shadow-[0_6px_0_#020617,0_14px_28px_-6px_rgba(15,23,42,0.38)] transition hover:bg-slate-800 active:translate-y-1 active:shadow-[0_2px_0_#020617] whitespace-nowrap"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Play {theme.shortName}</span>
          </button>
        </div>

        {/* Right Zone: Live Interactive Hero Wall (Try Peeling Right on the Title Screen!) */}
        <div className="hidden flex-col items-center sm:flex">
          <div
            className={`${theme.boardClass} relative aspect-square w-[250px] rounded-[24px] p-4 transition-all duration-500 lg:w-[340px] lg:p-5`}
          >
            <div className="relative h-full w-full">
              {demoNotes.map((note, i) => {
                const gap = 4;
                const size = (100 - gap * 2) / 3;
                const peelDir = peelingIds[note.id];
                const isBumped = bumpedId?.id === note.id;

                return (
                  <button
                    key={`${note.id}-${isBumped ? bumpedId.ts : 0}`}
                    type="button"
                    onClick={(e) => handleDemoTap(note, e.currentTarget)}
                    aria-label={`Try peeling ${note.color} sticky note`}
                    style={
                      {
                        left: `${note.c * (size + gap)}%`,
                        top: `${note.r * (size + gap)}%`,
                        width: `${size}%`,
                        height: `${size}%`,
                        '--tilt': `${note.tilt}deg`,
                        transform: `rotate(${note.tilt}deg)`,
                        animationDelay: !peelDir && !isBumped ? `${i * 25}ms` : undefined,
                      } as React.CSSProperties
                    }
                    className={`sticky-note-card paper-${note.color} flex cursor-pointer items-center justify-center ${
                      peelDir
                        ? `is-peeling peel-${peelDir}`
                        : isBumped
                          ? `is-blocked bump-${bumpedId.dir}`
                          : 'note-spawn'
                    }`}
                  >
                    <svg
                      viewBox="0 0 32 32"
                      fill="none"
                      style={{ transform: `rotate(${ARROW_ROT[note.dir]}deg)` }}
                      className="h-9 w-9 lg:h-11 lg:w-11"
                    >
                      <path d="M5.5 16H24.5" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" />
                      <path
                        d="M17.5 8.5L25.5 16L17.5 23.5"
                        stroke="currentColor"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}

              {demoResetting && (
                <div className="font-display pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold opacity-75">
                  Nice peel!
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs font-semibold opacity-65">
            Try tapping a note above · {theme.surfaceLabel}
          </p>
        </div>
      </main>

      {/* Single Flat Control-Hint Footer Line */}
      <footer className="z-20 shrink-0 pb-4 text-center text-xs font-medium opacity-65">
        Tap or Click to Peel
      </footer>
    </div>
  );
};
