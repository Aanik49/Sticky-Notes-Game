import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  Music,
  Play,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  formatDailyDateLabel,
  getDailyMission,
  getPackClearedCount,
  getPackUnlockRequirement,
  getTodayDateKey,
  isPackUnlocked,
  PACK_LEVELS,
  THEME_ORDER,
  THEMES,
} from '../game/levels';
import { PAPER_STYLES } from '../game/mastery';
import { checkNotePath } from '../game/solver';
import { ActiveNote, Direction, SavedProgress, ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';
import { DailyRewardIcon } from './Modals';
import { BauhausNoteArrow } from './StickyNote';
import { StudioArchiveTab } from './StudioArchiveModal';

interface TitleScreenProps {
  selectedTheme: ThemeId;
  progress: SavedProgress;
  muted: boolean;
  musicMuted: boolean;
  onSelectTheme: (theme: ThemeId) => void;
  onStartPack: (theme: ThemeId) => void;
  onOpenLevels: (packId?: ThemeId) => void;
  onOpenArchive: (tab?: StudioArchiveTab) => void;
  onStartDaily: () => void;
  onStartEndless: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onParticlePeel: (x: number, y: number, dir: Direction, colorHex: string) => void;
}

const DEMO_WALL: Omit<ActiveNote, 'id'>[] = [
  { r: 0, c: 0, dir: 'U', color: 'canary', tilt: 0 },
  { r: 0, c: 1, dir: 'R', color: 'coral', tilt: 0 },
  { r: 0, c: 2, dir: 'R', color: 'sky', tilt: 0 },
  { r: 1, c: 0, dir: 'U', color: 'mint', tilt: 0 },
  { r: 1, c: 1, dir: 'U', color: 'canary', tilt: 0 },
  { r: 1, c: 2, dir: 'D', color: 'coral', tilt: 0 },
  { r: 2, c: 0, dir: 'L', color: 'sky', tilt: 0 },
  { r: 2, c: 1, dir: 'L', color: 'mint', tilt: 0 },
  { r: 2, c: 2, dir: 'D', color: 'canary', tilt: 0 },
];


const PACK_GLOW_RGB: Record<ThemeId, string> = {
  fridge: '214, 48, 42',
  cork: '228, 180, 60',
  drafting: '45, 212, 191',
  midnight: '228, 180, 60',
  atelier: '255, 118, 97',
  gallery: '96, 165, 250',
};

const PACK_SWATCH_BG: Record<ThemeId, string> = {
  fridge: '#f5f0e2',
  cork: '#e4b43c',
  drafting: '#1e6b64',
  midnight: '#181b24',
  atelier: '#d6302a',
  gallery: '#2b56a3',
};

const PLAY_BUTTON_THEME: Record<ThemeId, string> = {
  fridge: 'bg-[#d6302a] text-[#faf6ea] hover:bg-[#c02621]',
  cork: 'bg-[#111111] text-[#e4b43c] hover:bg-[#222222]',
  drafting: 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]',
  midnight: 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]',
  atelier: 'bg-[#f5f0e2] text-[#111111] hover:bg-[#ffffff]',
  gallery: 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]',
};

const LOBBY_FOOTER_TIPS = [
  'Tap or Click to Peel',
  'Tap any note to Peel it off along its arrow',
  'Clear Blocking notes first to uncover the entire Wall',
] as const;

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedTheme,
  progress,
  muted,
  musicMuted,
  onSelectTheme,
  onStartPack,
  onOpenLevels,
  onOpenArchive,
  onStartDaily,
  onStartEndless,
  onToggleMute,
  onToggleMusic,
  onParticlePeel,
}) => {
  const theme = THEMES[selectedTheme];
  const activeStyle = PAPER_STYLES[progress.paperStyle] ?? PAPER_STYLES.primary;
  const todayKey = getTodayDateKey();
  const todayLabel = formatDailyDateLabel(todayKey);
  const todayMission = getDailyMission(todayKey);
  const todayDailyRecord = progress.dailyRecords[todayKey];
  const selectedUnlocked = isPackUnlocked(selectedTheme, progress.records);
  const selectedRequirement = getPackUnlockRequirement(selectedTheme, progress.records);

  const [demoNotes, setDemoNotes] = useState<ActiveNote[]>(() =>
    DEMO_WALL.map((n, i) => ({ ...n, id: `demo-${i}` }))
  );
  const [peelingIds, setPeelingIds] = useState<Record<string, Direction>>({});
  const [bumpedId, setBumpedId] = useState<{ id: string; dir: Direction; ts: number } | null>(null);
  const [demoResetting, setDemoResetting] = useState(false);
  const [footerTipIndex, setFooterTipIndex] = useState(0);

  // Cycle bottom single-line instruction tips continuously every 2 seconds
  useEffect(() => {
    const interval = window.setInterval(() => {
      setFooterTipIndex((prev) => (prev + 1) % LOBBY_FOOTER_TIPS.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, []);

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
          activeStyle.paperHex[note.color]
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

  const headerBtnClass =
    'flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none';

  return (
    <div
      className={`${theme.worldClass} relative flex h-dvh w-screen flex-col overflow-hidden transition-colors duration-500`}
    >
      {/* Bauhaus Architectural Top Header Bar (Mondrian structural divider) */}
      <header className="z-20 flex shrink-0 items-center justify-between border-b-[3px] border-[#111111] px-4 py-2.5 sm:px-7 sm:py-3">
        <div className="flex items-center gap-3">
          <GameIcon className="h-9 w-9 shrink-0 shadow-[2px_2px_0_#111111] sm:h-10 sm:w-10" />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-bold sm:text-sm">
            <span className="font-mono-num flex items-center gap-1">
              <Star className="h-4 w-4 fill-[#e4b43c] text-[#111111]" />
              {totalEarnedStars}/{totalPossibleStars}
            </span>
            {progress.dailyStreak > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">Streak {progress.dailyStreak}</span>
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
            onClick={() => {
              sound.playClick();
              onOpenArchive('gallery');
            }}
            aria-label="Open Studio Archive: Gallery, Mastery, and Paper Styles"
            title="Gallery, Mastery & Styles"
            className={headerBtnClass}
          >
            <Award className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenLevels(selectedTheme);
            }}
            aria-label="Browse all walls and packs"
            title="All Walls"
            className={headerBtnClass}
          >
            <Layers className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={musicMuted ? 'Unmute background music' : 'Mute background music'}
            title={musicMuted ? 'Music Off' : 'Music On'}
            className={`${headerBtnClass} relative`}
          >
            <Music className={`h-5 w-5 ${musicMuted ? 'text-[#d6302a]' : ''}`} />
            {musicMuted && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-[2.5px] w-6 rotate-45 bg-[#d6302a]"
              />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            title={muted ? 'Sound Off' : 'Sound On'}
            className={headerBtnClass}
          >
            {muted ? <VolumeX className="h-5 w-5 text-[#d6302a]" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Responsive Bauhaus Stage */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-2 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        {/* Left Zone: Animated Bauhaus Lockup + 6 Categories + Daily/Endless + Primary Play */}
        <div className="flex w-full max-w-lg flex-col items-center text-center lg:items-start lg:text-left">
          {/* Animated Bauhaus Grid Art Title Lockup (moved cleanly higher) */}
          <svg
            viewBox="0 0 420 120"
            role="img"
            aria-label="Sticky Notes Puzzle"
            className="-mt-4 mb-5 h-auto w-[280px] overflow-visible sm:-mt-5 sm:mb-6 sm:w-[356px] lg:w-[390px]"
          >
            {/* Left Bauhaus Ochre Note: nudges toward center along its red right block arrow */}
            <g transform="translate(8, 22)">
              <g className="lobby-note-left">
                <rect x="4" y="4" width="66" height="66" fill="#111111" />
                <rect width="66" height="66" fill="#E4B43C" stroke="#111111" strokeWidth="3.5" />
                <polygon points="52,0 66,0 66,14" fill="#F5F0E2" />
                <polygon points="52,0 52,14 66,14" fill="#C99724" stroke="#111111" strokeWidth="2.2" />
                <path
                  className="lobby-arrow-right"
                  d="M15 27.5 H34 V19 L50 33 L34 47 V38.5 H15 Z"
                  fill="#D6302A"
                  stroke="#111111"
                  strokeWidth="2.6"
                  strokeLinejoin="miter"
                />
              </g>
            </g>

            {/* Right Bauhaus Cobalt Note: glides upward along its cream up block arrow */}
            <g transform="translate(344, 18)">
              <g className="lobby-note-right">
                <rect x="4" y="4" width="66" height="66" fill="#111111" />
                <rect width="66" height="66" fill="#2B56A3" stroke="#111111" strokeWidth="3.5" />
                <polygon points="52,66 66,66 66,52" fill="#F5F0E2" />
                <polygon points="52,52 66,52 52,66" fill="#1D3F7A" stroke="#111111" strokeWidth="2.2" />
                <path
                  className="lobby-arrow-up"
                  d="M27.5 51 V32 H19 L33 16 L47 32 H38.5 V51 Z"
                  fill="#F5F0E2"
                  stroke="#111111"
                  strokeWidth="2.6"
                  strokeLinejoin="miter"
                />
              </g>
            </g>

            {/* Center Bauhaus Architectural Title Block: STICKY [NOTES] */}
            <g transform="translate(84, 12)">
              <g className="lobby-note-center">
                <rect x="5" y="5" width="250" height="86" fill="#111111" />
                <rect width="250" height="86" fill="#F5F0E2" stroke="#111111" strokeWidth="3.5" />
                {/* Red Accent Block behind NOTES (faithful to reference image) */}
                <rect x="131" y="12" width="107" height="44" fill="#D6302A" stroke="#111111" strokeWidth="2.5" />
                {/* Crisp Corner Fold Accent */}
                <polygon
                  className="lobby-corner-flap"
                  points="234,86 250,70 250,86"
                  fill="#E4B43C"
                  stroke="#111111"
                  strokeWidth="2"
                />
                <text
                  x="70"
                  y="45"
                  textAnchor="middle"
                  fill="#111111"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '31px', letterSpacing: '-0.02em' }}
                >
                  STICKY
                </text>
                <text
                  x="184"
                  y="45"
                  textAnchor="middle"
                  fill="#FAF6EA"
                  style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '30px', letterSpacing: '0.01em' }}
                >
                  NOTES
                </text>
                <line x1="12" y1="64" x2="226" y2="64" stroke="#111111" strokeWidth="2" />
                <text
                  x="119"
                  y="79"
                  textAnchor="middle"
                  fill="#111111"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '10.5px', letterSpacing: '0.24em' }}
                >
                  BAUHAUS GRID PUZZLE
                </text>
              </g>
            </g>
          </svg>

          {/* 6 Category Packs Selector (Progressive Unlock + Glow & Shine + Theme Sync) */}
          <div className="mb-3 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
            {THEME_ORDER.map((id) => {
              const t = THEMES[id];
              const isSelected = id === selectedTheme;
              const unlocked = isPackUnlocked(id, progress.records);
              const isProgressionPack = id !== 'fridge';
              const showShine = unlocked && isProgressionPack;
              const isJustUnlocked = showShine && progress.newlyUnlockedPacks.includes(id);
              const cleared = getPackClearedCount(id, progress.records);
              const totalLevels = PACK_LEVELS[id].length;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onSelectTheme(id);
                  }}
                  style={
                    showShine
                      ? ({ '--pack-glow-rgb': PACK_GLOW_RGB[id] } as React.CSSProperties)
                      : undefined
                  }
                  className={`group flex cursor-pointer items-center gap-2.5 border-2 border-[#111111] px-2.5 py-2 text-left transition active:translate-x-[1px] active:translate-y-[1px] ${
                    showShine ? 'pack-unlocked-shine' : ''
                  } ${isJustUnlocked ? 'pack-just-unlocked' : ''} ${
                    !unlocked
                      ? isSelected
                        ? 'bg-[#e8e1ce] text-[#111111] shadow-[3px_3px_0_#111111]'
                        : 'bg-[#f5f0e2]/80 text-[#111111]/70 shadow-[2px_2px_0_#111111] hover:bg-[#f5f0e2]'
                      : isSelected
                        ? 'bg-[#111111] text-[#faf6ea] shadow-[4px_4px_0_#e4b43c]'
                        : 'bg-[#f5f0e2] text-[#111111] shadow-[3px_3px_0_#111111] hover:-translate-y-0.5 hover:bg-white'
                  }`}
                >
                  {/* Solid Bauhaus Primary Color Swatch Block */}
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: PACK_SWATCH_BG[id] }}
                    className={`relative flex h-7 w-7 shrink-0 items-center justify-center border-2 ${
                      isSelected && unlocked ? 'border-[#faf6ea]' : 'border-[#111111]'
                    } ${!unlocked ? 'opacity-65' : ''}`}
                  >
                    {!unlocked && (
                      <span className="flex h-4.5 w-4.5 items-center justify-center bg-[#111111] text-[#faf6ea]">
                        <Lock className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </span>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-display truncate text-xs font-extrabold tracking-tight uppercase sm:text-[13px]">
                        {t.shortName}
                      </span>
                      {isJustUnlocked && (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#e4b43c]" />
                      )}
                    </div>
                    <div className="font-mono-num mt-0.5 flex items-center gap-1 text-[10px] font-bold opacity-80">
                      {unlocked ? (
                        <>
                          <Star className="h-2.5 w-2.5 shrink-0 fill-[#e4b43c] text-[#e4b43c]" />
                          <span>
                            {cleared}/{totalLevels}
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-2.5 w-2.5 shrink-0" />
                          <span>Locked</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Daily Puzzle (with Daily Mission preview) + Endless Wall Row */}
          <div className="mb-2 grid w-full grid-cols-5 gap-2">
            <button
              type="button"
              onClick={onStartDaily}
              className={`col-span-3 flex cursor-pointer items-center justify-between gap-2 border-2 border-[#111111] px-3 py-2 text-left shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                todayDailyRecord
                  ? 'bg-[#e4b43c] text-[#111111]'
                  : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {todayDailyRecord?.dailyMissionCompleted ? (
                  <DailyRewardIcon className="h-6 w-6 shrink-0" />
                ) : todayDailyRecord ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#111111]" />
                ) : (
                  <Calendar className="h-5 w-5 shrink-0 text-[#d6302a]" />
                )}
                <div className="min-w-0">
                  <div className="font-display truncate text-xs font-extrabold tracking-tight uppercase sm:text-sm">
                    Daily · {todayLabel}
                  </div>
                  <div className="truncate text-[11px] font-semibold opacity-80">
                    {todayMission.label}
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
                          ? 'fill-[#111111] text-[#111111]'
                          : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <span className="font-display shrink-0 text-xs font-extrabold uppercase">Go</span>
              )}
            </button>

            <button
              type="button"
              onClick={onStartEndless}
              className="font-display col-span-2 flex cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#2b56a3] px-3 py-2 text-xs font-extrabold tracking-wide text-[#faf6ea] uppercase shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 hover:bg-[#244a8e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none whitespace-nowrap sm:text-sm"
              title="Play Endless Generated Walls"
            >
              <InfinityIcon className="h-4 w-4 shrink-0" />
              <span>Endless</span>
            </button>
          </div>

          {/* Primary Play Action (moved slightly down, with specular shine sweep & Bauhaus block styling) */}
          {selectedUnlocked ? (
            <button
              type="button"
              onClick={() => onStartPack(selectedTheme)}
              className={`play-btn-shine font-display mt-3.5 flex w-full cursor-pointer items-center justify-center gap-2.5 border-[3px] border-[#111111] px-6 py-3.5 text-lg font-black tracking-wider uppercase shadow-[5px_5px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111111] whitespace-nowrap ${PLAY_BUTTON_THEME[selectedTheme]}`}
            >
              <Play className="relative z-10 h-5 w-5 fill-current" />
              <span className="relative z-10">Play {theme.shortName}</span>
            </button>
          ) : (
            <div className="mt-3.5 w-full">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenLevels(selectedTheme);
                }}
                className="font-display flex w-full cursor-pointer items-center justify-center gap-2 border-[3px] border-[#111111] bg-[#f5f0e2] px-5 py-3 text-base font-extrabold tracking-wide text-[#111111] uppercase shadow-[5px_5px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111111] whitespace-nowrap"
              >
                <Lock className="h-4 w-4 shrink-0" />
                <span>View {theme.shortName} Walls</span>
              </button>
              {selectedRequirement && (
                <p className="font-mono-num mt-1.5 text-center text-[11px] font-bold opacity-85 lg:text-left">
                  Clear all {selectedRequirement.total} {selectedRequirement.prevPackName} walls to unlock ({selectedRequirement.cleared}/{selectedRequirement.total})
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Zone: Live Interactive Bauhaus Demo Wall + Mondrian Color Mosaic */}
        <div className="hidden items-stretch gap-3 sm:flex">
          <div className="flex flex-col items-center">
            <div
              className={`${theme.boardClass} ${activeStyle.cssClass} relative aspect-square w-[250px] p-4 transition-all duration-500 lg:w-[328px] lg:p-5`}
            >
              <div className="relative h-full w-full">
                {demoNotes.map((note, i) => {
                  const gap = 4.2;
                  const size = (100 - gap * 2) / 3;
                  const peelDir = peelingIds[note.id];
                  const isBumped = bumpedId?.id === note.id;

                  return (
                    <button
                      key={`${note.id}-${isBumped ? bumpedId.ts : 0}`}
                      type="button"
                      onClick={(e) => handleDemoTap(note, e.currentTarget)}
                      aria-label={`Try peeling ${note.color} sticky note`}
                      style={{
                        left: `${note.c * (size + gap)}%`,
                        top: `${note.r * (size + gap)}%`,
                        width: `${size}%`,
                        height: `${size}%`,
                        animationDelay: !peelDir && !isBumped ? `${i * 25}ms` : undefined,
                      }}
                      className={`sticky-note-card paper-${note.color} flex cursor-pointer items-center justify-center ${
                        peelDir
                          ? `is-peeling peel-${peelDir}`
                          : isBumped
                            ? `is-blocked bump-${bumpedId.dir}`
                            : 'note-spawn'
                      }`}
                    >
                      {/* Top-right & Bottom-right Bauhaus corner folds */}
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 18 18"
                        className="pointer-events-none absolute -top-[1px] -right-[1px] h-[22%] w-[22%]"
                      >
                        <polygon points="0,0 18,0 18,18" fill={activeStyle.cornerReveal} />
                        <polygon
                          points="0,0 0,18 18,18"
                          fill={activeStyle.foldFill[note.color]}
                          stroke="#111111"
                          strokeWidth="2.2"
                        />
                      </svg>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 18 18"
                        className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-[22%] w-[22%]"
                      >
                        <polygon points="18,0 18,18 0,18" fill={activeStyle.cornerReveal} />
                        <polygon
                          points="0,0 18,0 0,18"
                          fill={activeStyle.foldFill[note.color]}
                          stroke="#111111"
                          strokeWidth="2.2"
                        />
                      </svg>

                      <BauhausNoteArrow
                        dir={note.dir}
                        variant={activeStyle.arrowVariant}
                        fill={activeStyle.arrowFill[note.color]}
                        stroke={activeStyle.arrowStroke[note.color]}
                        className="h-9 w-9 lg:h-11 lg:w-11"
                      />
                    </button>
                  );
                })}

                {demoResetting && (
                  <div className="font-display pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black uppercase">
                    Grid Cleared!
                  </div>
                )}
              </div>
            </div>

            <p className="font-mono-num mt-3 text-[11px] font-bold tracking-wide uppercase opacity-80">
              Try tapping a note · {activeStyle.name}
            </p>
          </div>

          {/* Right-edge Decorative Mondrian Primary Color Column (echoes reference composition) */}
          <div
            aria-hidden="true"
            className="hidden h-[328px] w-16 grid-rows-6 border-[3px] border-[#111111] shadow-[6px_6px_0_#111111] xl:grid"
          >
            <div className="row-span-2 border-b-[3px] border-[#111111] bg-[#d6302a]" />
            <div className="row-span-1 border-b-[3px] border-[#111111] bg-[#2b56a3]" />
            <div className="row-span-1 border-b-[3px] border-[#111111] bg-[#f5f0e2]" />
            <div className="row-span-2 bg-[#e4b43c]" />
          </div>
        </div>
      </main>

      {/* Single Flat Rotating Control-Hint Footer Line (cycles every 2s) */}
      <footer className="z-20 flex min-h-10 shrink-0 items-center justify-center border-t-[3px] border-[#111111] px-4 py-2 text-center text-xs font-bold tracking-wide">
        <span key={footerTipIndex} className="footer-tip-fade truncate whitespace-nowrap">
          {LOBBY_FOOTER_TIPS[footerTipIndex]}
        </span>
      </footer>
    </div>
  );
};
