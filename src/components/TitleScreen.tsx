import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  FlaskConical,
  HelpCircle,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  Medal,
  Music,
  Play,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  formatDailyDateLabel,
  formatWeekLabel,
  getCurrentWeekKey,
  getDailyMission,
  getPackClearedCount,
  getPackUnlockRequirement,
  getThemesForMode,
  getTodayDateKey,
  isPackUnlocked,
  isProgressionPack,
  PACK_LEVELS,
  THEME_ORDER,
  THEMES,
} from '../game/levels';
import { PAPER_STYLES } from '../game/mastery';
import { evaluateNoteTap, isNoteTapedLocked, TAPE_COLOR_META } from '../game/solver';
import {
  ActiveNote,
  ClassicThemeId,
  Direction,
  GameMode,
  SavedProgress,
  ThemeId,
} from '../game/types';
import { GameIcon } from './GameIcon';
import { DailyRewardIcon } from './Modals';
import { BauhausNoteArrow } from './StickyNote';
import { StudioArchiveTab } from './StudioArchiveModal';

interface TitleScreenProps {
  selectedMode: GameMode;
  selectedTheme: ThemeId;
  progress: SavedProgress;
  muted: boolean;
  musicMuted: boolean;
  onSelectMode: (mode: GameMode) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onStartPack: (theme: ThemeId) => void;
  onOpenLevels: (packId?: ThemeId) => void;
  onOpenArchive: (tab?: StudioArchiveTab) => void;
  onOpenGuide: () => void;
  onStartDaily: () => void;
  onStartWeekly: () => void;
  onStartBlitz: () => void;
  onStartEndless: () => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onParticlePeel: (x: number, y: number, dir: Direction, colorHex: string) => void;
}

const CLASSIC_DEMO_WALL: Omit<ActiveNote, 'id'>[] = [
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

/** Live interactive 3x3 Studio Lab preview featuring all 3 new mechanics (Key+Tape, Pivot, Chain-Peel) */
const LAB_DEMO_WALL: Omit<ActiveNote, 'id'>[] = [
  { r: 0, c: 0, dir: 'L', color: 'coral', tilt: 0, keyColor: 'red' },
  { r: 0, c: 2, dir: 'U', color: 'canary', tilt: 0, linkId: 'A' },
  { r: 1, c: 1, dir: 'D', color: 'sky', tilt: 0, pivot: true },
  { r: 1, c: 2, dir: 'R', color: 'mint', tilt: 0 },
  { r: 2, c: 0, dir: 'L', color: 'canary', tilt: 0, linkId: 'A' },
  { r: 2, c: 1, dir: 'U', color: 'sky', tilt: 0, tapeColor: 'red' },
  { r: 2, c: 2, dir: 'D', color: 'coral', tilt: 0 },
];

const PACK_GLOW_RGB: Record<ClassicThemeId, string> = {
  fridge: '214, 48, 42',
  cork: '228, 180, 60',
  drafting: '45, 212, 191',
  midnight: '228, 180, 60',
  atelier: '255, 118, 97',
  gallery: '96, 165, 250',
};

const PACK_SWATCH_BG: Record<ClassicThemeId, string> = {
  fridge: '#f5f0e2',
  cork: '#e4b43c',
  drafting: '#1e6b64',
  midnight: '#181b24',
  atelier: '#d6302a',
  gallery: '#2b56a3',
};

const PLAY_BUTTON_THEME: Record<ClassicThemeId, string> = {
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

function buildDemoNotes(mode: GameMode): ActiveNote[] {
  const src = mode === 'lab' ? LAB_DEMO_WALL : CLASSIC_DEMO_WALL;
  return src.map((n, i) => ({ ...n, id: `demo-${mode}-${Date.now()}-${i}` }));
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedMode,
  selectedTheme,
  progress,
  muted,
  musicMuted,
  onSelectMode,
  onSelectTheme,
  onStartPack,
  onOpenLevels,
  onOpenArchive,
  onOpenGuide,
  onStartDaily,
  onStartWeekly,
  onStartBlitz,
  onStartEndless,
  onToggleMute,
  onToggleMusic,
  onParticlePeel,
}) => {
  const theme = THEMES[selectedTheme];
  const visiblePackIds = getThemesForMode(selectedMode);
  const activeStyle = PAPER_STYLES[progress.paperStyle] ?? PAPER_STYLES.primary;
  const todayKey = getTodayDateKey();
  const todayLabel = formatDailyDateLabel(todayKey);
  const todayMission = getDailyMission(todayKey);
  const todayDailyRecord = progress.dailyRecords[todayKey];
  const weekKey = getCurrentWeekKey();
  const weekLabel = formatWeekLabel(weekKey);
  const weeklyRecord = progress.weeklyRecords?.[weekKey];
  const blitzBestWalls = (progress.blitzLeaderboard ?? []).reduce(
    (max, r) => Math.max(max, r.wallsCleared),
    0
  );
  const selectedUnlocked = isPackUnlocked(selectedTheme, progress.records);
  const selectedRequirement = getPackUnlockRequirement(selectedTheme, progress.records);

  const [demoNotes, setDemoNotes] = useState<ActiveNote[]>(() => buildDemoNotes(selectedMode));
  const [peelingIds, setPeelingIds] = useState<Record<string, Direction>>({});
  const [bumpedId, setBumpedId] = useState<{ id: string; dir: Direction; ts: number } | null>(null);
  const [demoResetting, setDemoResetting] = useState(false);
  const [footerTipIndex, setFooterTipIndex] = useState(0);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const audioMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!audioMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
        setAudioMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAudioMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [audioMenuOpen]);

  // Switch demo wall immediately when toggling Classic <-> Studio Lab
  useEffect(() => {
    setDemoNotes(buildDemoNotes(selectedMode));
    setPeelingIds({});
    setBumpedId(null);
    setDemoResetting(false);
  }, [selectedMode]);

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
        setDemoNotes(buildDemoNotes(selectedMode));
        setPeelingIds({});
        setDemoResetting(false);
      }, 650);
      return () => window.clearTimeout(t);
    }
  }, [demoNotes.length, selectedMode]);

  const handleDemoTap = (note: ActiveNote, el: HTMLButtonElement | null) => {
    if (peelingIds[note.id]) return;
    const ev = evaluateNoteTap(note, demoNotes, [], 3, 3);
    if (ev.canPeel) {
      sound.playPeel(ev.peeledNotes.length, selectedTheme);
      if (ev.unlockedTapeColors.length > 0) sound.playUnlockTape();
      if (ev.rotatedPivotCount > 0) sound.playPivotTick();

      if (el) {
        const rect = el.getBoundingClientRect();
        onParticlePeel(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          note.dir,
          activeStyle.paperHex[note.color]
        );
      }

      const nextPeeling: Record<string, Direction> = {};
      for (const p of ev.peeledNotes) {
        nextPeeling[p.id] = p.dir;
      }
      setPeelingIds((prev) => ({ ...prev, ...nextPeeling }));

      window.setTimeout(() => {
        setDemoNotes(ev.nextNotes);
      }, 300);
    } else {
      sound.playBump(selectedTheme);
      setBumpedId({ id: ev.blameNote.id, dir: ev.blameNote.dir, ts: Date.now() });
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

  // Active linked pairs on the Studio Lab demo board
  const demoLinkedPairs: { linkId: string; a: ActiveNote; b: ActiveNote }[] = [];
  const seenDemoLinks = new Set<string>();
  for (const n of demoNotes) {
    if (!n.linkId || seenDemoLinks.has(n.linkId)) continue;
    const partner = demoNotes.find((o) => o.id !== n.id && o.linkId === n.linkId);
    if (partner) {
      seenDemoLinks.add(n.linkId);
      demoLinkedPairs.push({ linkId: n.linkId, a: n, b: partner });
    }
  }

  return (
    <div
      className={`${theme.worldClass} relative flex h-dvh w-screen flex-col overflow-hidden transition-colors duration-500`}
    >
      {/* Bauhaus Architectural Top Header Bar (Clean & Uncluttered) */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b-[3px] border-[#111111] px-4 py-2.5 sm:px-7 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <GameIcon className="h-9 w-9 shrink-0 shadow-[2px_2px_0_#111111] sm:h-10 sm:w-10" />
          <span className="font-mono-num flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold sm:text-sm">
            <Star className="h-4 w-4 shrink-0 fill-[#e4b43c] text-[#111111]" />
            <span>
              {totalEarnedStars}/{totalPossibleStars}
            </span>
          </span>
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

          {/* Compact Audio Popover (Sound FX & Music) */}
          <div ref={audioMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setAudioMenuOpen((prev) => !prev);
              }}
              aria-expanded={audioMenuOpen}
              aria-haspopup="menu"
              aria-label="Audio settings: Sound and Music"
              title="Sound & Music"
              className={`${headerBtnClass} ${audioMenuOpen ? 'bg-[#e4b43c]' : ''}`}
            >
              {muted && musicMuted ? (
                <VolumeX className="h-5 w-5 text-[#d6302a]" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>

            {audioMenuOpen && (
              <div
                role="menu"
                aria-label="Audio controls"
                className="combo-pop absolute top-full right-0 z-40 mt-2 flex w-44 flex-col border-[3px] border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[5px_5px_0_#111111]"
              >
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={!muted}
                  onClick={onToggleMute}
                  className="flex cursor-pointer items-center justify-between border-b-2 border-[#111111] px-3 py-2.5 text-xs font-extrabold uppercase transition hover:bg-white"
                >
                  <span className="flex items-center gap-2">
                    {muted ? (
                      <VolumeX className="h-4 w-4 text-[#d6302a]" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    Sound FX
                  </span>
                  <span
                    className={`font-mono-num border border-[#111111] px-1.5 py-0.5 text-[10px] font-black ${
                      muted ? 'bg-[#d6302a] text-[#faf6ea]' : 'bg-[#e4b43c] text-[#111111]'
                    }`}
                  >
                    {muted ? 'OFF' : 'ON'}
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={!musicMuted}
                  onClick={onToggleMusic}
                  className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-xs font-extrabold uppercase transition hover:bg-white"
                >
                  <span className="flex items-center gap-2">
                    <Music className={`h-4 w-4 ${musicMuted ? 'text-[#d6302a]' : ''}`} />
                    Music
                  </span>
                  <span
                    className={`font-mono-num border border-[#111111] px-1.5 py-0.5 text-[10px] font-black ${
                      musicMuted ? 'bg-[#d6302a] text-[#faf6ea]' : 'bg-[#e4b43c] text-[#111111]'
                    }`}
                  >
                    {musicMuted ? 'OFF' : 'ON'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Bauhaus Stage */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-3 px-4 py-2 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        {/* Left Zone: Animated Bauhaus Lockup + Classic/Studio Lab Toggle + 6 Categories + Daily/Endless + Play */}
        <div className="flex w-full max-w-lg flex-col items-center text-center lg:items-start lg:text-left">
          {/* Animated Bauhaus Grid Art Title Lockup */}
          <svg
            viewBox="0 0 420 120"
            role="img"
            aria-label="Sticky Notes Puzzle"
            className="-mt-10 mb-8 h-auto w-[264px] overflow-visible sm:-mt-12 sm:mb-9 sm:w-[340px] lg:w-[376px]"
          >
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

            <g transform="translate(84, 12)">
              <g className="lobby-note-center">
                <rect x="5" y="5" width="250" height="86" fill="#111111" />
                <rect width="250" height="86" fill="#F5F0E2" stroke="#111111" strokeWidth="3.5" />
                <rect x="131" y="12" width="107" height="44" fill="#D6302A" stroke="#111111" strokeWidth="2.5" />
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

          {/* CLASSIC vs STUDIO LAB Mode Toggle Bar (+ Contextual Mode Guide ?) */}
          <div className="mb-2.5 flex w-full border-2 border-[#111111] bg-[#f5f0e2] shadow-[3px_3px_0_#111111]">
            <div role="tablist" aria-label="Game Mode" className="grid flex-1 grid-cols-2">
              <button
                type="button"
                role="tab"
                aria-selected={selectedMode === 'classic'}
                onClick={() => {
                  if (selectedMode !== 'classic') {
                    sound.playClick();
                    onSelectMode('classic');
                  }
                }}
                className={`font-display flex cursor-pointer items-center justify-center gap-1.5 border-r-2 border-[#111111] py-2 text-xs font-black tracking-wider uppercase transition sm:text-sm ${
                  selectedMode === 'classic'
                    ? 'bg-[#e4b43c] text-[#111111]'
                    : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>Classic</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedMode === 'lab'}
                onClick={() => {
                  if (selectedMode !== 'lab') {
                    sound.playClick();
                    onSelectMode('lab');
                  }
                }}
                className={`font-display flex cursor-pointer items-center justify-center gap-1.5 border-r-2 border-[#111111] py-2 text-xs font-black tracking-wider uppercase transition sm:text-sm ${
                  selectedMode === 'lab'
                    ? 'bg-[#2b56a3] text-[#faf6ea]'
                    : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
                }`}
              >
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span>Studio Lab</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenGuide();
              }}
              aria-label={
                selectedMode === 'lab' ? 'Open Studio Lab rules guide' : 'Open Classic Mode rules guide'
              }
              title={selectedMode === 'lab' ? 'Studio Lab Guide' : 'Classic Mode Guide'}
              className="flex w-10 shrink-0 cursor-pointer items-center justify-center bg-[#f5f0e2] text-[#111111] transition hover:bg-white"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          {/* 6 Category Packs Selector for Active Mode (15 levels each) */}
          <div className="mb-2.5 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
            {visiblePackIds.map((id) => {
              const t = THEMES[id];
              const base = t.visualBase;
              const isSelected = id === selectedTheme;
              const unlocked = isPackUnlocked(id, progress.records);
              const showShine = unlocked && isProgressionPack(id);
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
                      ? ({ '--pack-glow-rgb': PACK_GLOW_RGB[base] } as React.CSSProperties)
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
                    style={{ backgroundColor: PACK_SWATCH_BG[base] }}
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

          {/* Special Modes Single-Row Icon Buttons: Daily, Weekly, 60s Blitz, Endless */}
          <div className="mb-1 grid w-full grid-cols-4 gap-2">
            {/* 1. Daily */}
            <button
              type="button"
              onClick={onStartDaily}
              aria-label={`Daily Wall (${todayLabel}): ${todayMission.label}`}
              title={`Daily · ${todayLabel} — ${todayMission.label}`}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-[#111111] px-1 py-2 shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:py-2.5 ${
                todayDailyRecord
                  ? 'bg-[#e4b43c] text-[#111111]'
                  : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
              }`}
            >
              {todayDailyRecord?.dailyMissionCompleted ? (
                <DailyRewardIcon className="h-5 w-5 shrink-0" />
              ) : todayDailyRecord ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#111111]" />
              ) : (
                <Calendar className="h-5 w-5 shrink-0 text-[#d6302a]" />
              )}
              <span className="font-display truncate text-[10px] leading-none font-extrabold tracking-tight uppercase sm:text-[11px]">
                Daily
              </span>
            </button>

            {/* 2. Weekly */}
            <button
              type="button"
              onClick={onStartWeekly}
              aria-label={`Weekly Exhibition (${weekLabel}): 3-Wall Gauntlet`}
              title={`Weekly · ${weekLabel} — ${weeklyRecord ? 'Exhibition Stamp Earned' : '3-Wall Gauntlet · 5 Bumps'}`}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-[#111111] px-1 py-2 shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:py-2.5 ${
                weeklyRecord
                  ? 'bg-[#e4b43c] text-[#111111]'
                  : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
              }`}
            >
              {weeklyRecord ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#111111]" />
              ) : (
                <Medal className="h-5 w-5 shrink-0 text-[#2b56a3]" />
              )}
              <span className="font-display truncate text-[10px] leading-none font-extrabold tracking-tight uppercase sm:text-[11px]">
                Weekly
              </span>
            </button>

            {/* 3. 60s Blitz */}
            <button
              type="button"
              onClick={onStartBlitz}
              aria-label={`60s Blitz Arcade Rush${blitzBestWalls > 0 ? `, best ${blitzBestWalls} walls` : ''}`}
              title={`60s Blitz — ${blitzBestWalls > 0 ? `Best ${blitzBestWalls} walls` : 'Arcade Rush'}`}
              className="relative flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-[#111111] bg-[#d6302a] px-1 py-2 text-[#faf6ea] shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 hover:bg-[#c02621] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:py-2.5"
            >
              <Zap className="h-5 w-5 shrink-0 fill-[#e4b43c] text-[#e4b43c]" />
              <span className="font-display truncate text-[10px] leading-none font-black tracking-tight uppercase sm:text-[11px]">
                60s Blitz
              </span>
            </button>

            {/* 4. Endless */}
            <button
              type="button"
              onClick={onStartEndless}
              aria-label={`Endless Mode, Wall #${progress.endlessCurrentLevel}`}
              title={`Endless — ${progress.endlessBestStreak > 0 ? `Best #${progress.endlessBestStreak}` : `Wall #${progress.endlessCurrentLevel}`}`}
              className="relative flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-[#111111] bg-[#2b56a3] px-1 py-2 text-[#faf6ea] shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 hover:bg-[#244a8e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:py-2.5"
            >
              <InfinityIcon className="h-5 w-5 shrink-0" />
              <span className="font-display truncate text-[10px] leading-none font-black tracking-tight uppercase sm:text-[11px]">
                Endless
              </span>
            </button>
          </div>

          {/* Primary Play Action */}
          {selectedUnlocked ? (
            <button
              type="button"
              onClick={() => onStartPack(selectedTheme)}
              className={`play-btn-shine font-display mt-8 flex w-full cursor-pointer items-center justify-center gap-2.5 border-[3px] border-[#111111] px-6 py-3.5 text-lg font-black tracking-wider uppercase shadow-[5px_5px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111111] whitespace-nowrap sm:mt-11 ${PLAY_BUTTON_THEME[theme.visualBase]}`}
            >
              <Play className="relative z-10 h-5 w-5 fill-current" />
              <span className="relative z-10">Play {theme.shortName}</span>
            </button>
          ) : (
            <div className="mt-8 w-full sm:mt-11">
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
                  Clear all {selectedRequirement.total} {selectedRequirement.prevPackName} walls to unlock (
                  {selectedRequirement.cleared}/{selectedRequirement.total})
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Zone: Live Interactive Bauhaus Demo Wall (switches to live Studio Lab mechanics in Lab mode!) */}
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
                  const tapedLocked = isNoteTapedLocked(note, demoNotes);
                  const tapeMeta = note.tapeColor ? TAPE_COLOR_META[note.tapeColor] : null;
                  const keyMeta = note.keyColor ? TAPE_COLOR_META[note.keyColor] : null;

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
                      {/* Corner Folds */}
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

                      {/* Studio Lab Demo Indicators */}
                      {tapedLocked && tapeMeta && !peelDir && (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 48 48"
                          className="pointer-events-none absolute -top-[2px] -left-[2px] z-20 h-[56%] w-[56%]"
                        >
                          <polygon
                            points="0,18 18,0 32,0 0,32"
                            fill={tapeMeta.hex}
                            stroke="#111111"
                            strokeWidth="2.4"
                          />
                        </svg>
                      )}

                      {keyMeta && !peelDir && (
                        <div
                          aria-hidden="true"
                          style={{ backgroundColor: keyMeta.hex, color: keyMeta.text }}
                          className="pointer-events-none absolute -top-1 -left-1 z-20 flex h-5 w-5 items-center justify-center border-2 border-[#111111]"
                        >
                          <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                            <circle cx="7" cy="10" r="3.4" stroke="currentColor" strokeWidth="2.2" />
                            <path d="M10.4 10H17M15 10V13" stroke="currentColor" strokeWidth="2.2" />
                          </svg>
                        </div>
                      )}

                      {note.pivot && !peelDir && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute top-1 left-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#111111] bg-[#e4b43c]"
                        >
                          <span className="h-1 w-1 rounded-full bg-[#111111]" />
                        </span>
                      )}

                      {note.linkId && !peelDir && (
                        <span
                          aria-hidden="true"
                          className="font-mono-num pointer-events-none absolute bottom-0.5 left-0.5 z-20 border border-[#111111] bg-[#111111] px-1 text-[9px] font-black text-[#e4b43c]"
                        >
                          {note.linkId}
                        </span>
                      )}

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

                {/* Dashed Ink Link Connector on Lab Demo Wall */}
                {demoLinkedPairs.length > 0 && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible"
                  >
                    {demoLinkedPairs.map(({ linkId, a, b }) => {
                      const gap = 4.2;
                      const size = (100 - gap * 2) / 3;
                      const ax = a.c * (size + gap) + size / 2;
                      const ay = a.r * (size + gap) + size / 2;
                      const bx = b.c * (size + gap) + size / 2;
                      const by = b.r * (size + gap) + size / 2;
                      return (
                        <line
                          key={linkId}
                          x1={ax}
                          y1={ay}
                          x2={bx}
                          y2={by}
                          stroke={theme.isDark ? '#e4b43c' : '#111111'}
                          strokeWidth="1.6"
                          strokeDasharray="3.2 2.2"
                        />
                      );
                    })}
                  </svg>
                )}

                {demoResetting && (
                  <div className="font-display pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black uppercase">
                    Grid Cleared!
                  </div>
                )}
              </div>
            </div>

            <p className="font-mono-num mt-3 text-[11px] font-bold tracking-wide uppercase opacity-80">
              {selectedMode === 'lab'
                ? `Studio Lab Preview · ${activeStyle.name}`
                : `Try tapping a note · ${activeStyle.name}`}
            </p>
          </div>

          {/* Right-edge Decorative Mondrian Primary Color Column */}
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
