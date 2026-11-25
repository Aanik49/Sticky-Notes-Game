import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  Home,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  Music,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  formatDailyDateLabel,
  getHighestUnlockedPack,
  getPackUnlockRequirement,
  getTodayDateKey,
  isPackUnlocked,
  PACK_LEVELS,
  THEME_ORDER,
  THEMES,
} from '../game/levels';
import { ACHIEVEMENTS, PAPER_STYLES } from '../game/mastery';
import { LevelDef, MAX_BUMPS, PaperStyleId, SavedProgress, ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';
import { BauhausPosterStamp, StudioArchiveTab } from './StudioArchiveModal';

const PACK_GLOW_RGB: Record<ThemeId, string> = {
  fridge: '214, 48, 42',
  cork: '228, 180, 60',
  drafting: '45, 212, 191',
  midnight: '228, 180, 60',
  atelier: '214, 48, 42',
  gallery: '43, 86, 163',
};

const PACK_SWATCH_BG: Record<ThemeId, string> = {
  fridge: '#f5f0e2',
  cork: '#e4b43c',
  drafting: '#1e6b64',
  midnight: '#181b24',
  atelier: '#d6302a',
  gallery: '#2b56a3',
};

/** Small geometric Bauhaus reward seal earned by completing the Daily Mission */
export const DailyRewardIcon: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    role="img"
    aria-label="Daily Mission Reward Seal"
    className={className}
  >
    {/* Twin vermilion geometric ribbon tails */}
    <polygon points="12,24 9,38 17,34 20,38 20,25" fill="#d6302a" stroke="#111111" strokeWidth="1.8" strokeLinejoin="miter" />
    <polygon points="28,24 31,38 23,34 20,38 20,25" fill="#2b56a3" stroke="#111111" strokeWidth="1.8" strokeLinejoin="miter" />
    {/* Bold Ochre Bauhaus Circle Badge */}
    <circle cx="20" cy="17" r="12" fill="#e4b43c" stroke="#111111" strokeWidth="2.2" />
    {/* Crisp Star Cutout */}
    <path
      d="M20 10.2L22 14.3L26.5 14.9L23.2 18.1L24 22.6L20 20.5L16 22.6L16.8 18.1L13.5 14.9L18 14.3L20 10.2Z"
      fill="#f5f0e2"
      stroke="#111111"
      strokeWidth="1.4"
      strokeLinejoin="miter"
    />
  </svg>
);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatStopwatchMs(ms: number): string {
  const clamped = Math.max(0, ms);
  const totalTenths = Math.floor(clamped / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

/* =========================================================================
   1. PACK & LEVEL SELECTOR MODAL (6 Packs x 18 Scrollable Levels)
   ========================================================================= */
interface LevelPickerModalProps {
  currentLevel: LevelDef;
  initialPack?: ThemeId;
  progress: SavedProgress;
  onSelectLevel: (level: LevelDef) => void;
  onSelectDaily: () => void;
  onSelectEndless: (themeId: ThemeId) => void;
  onClose: () => void;
}

export const LevelPickerModal: React.FC<LevelPickerModalProps> = ({
  currentLevel,
  initialPack,
  progress,
  onSelectLevel,
  onSelectDaily,
  onSelectEndless,
  onClose,
}) => {
  const [viewingPack, setViewingPack] = useState<ThemeId>(initialPack ?? currentLevel.packId);
  const packTheme = THEMES[viewingPack];
  const levels = PACK_LEVELS[viewingPack];
  const todayKey = getTodayDateKey();
  const todayDailyRecord = progress.dailyRecords[todayKey];
  const clearedCount = levels.filter((l) => Boolean(progress.records[l.id])).length;
  const viewingUnlocked = isPackUnlocked(viewingPack, progress.records);
  const unlockReq = getPackUnlockRequirement(viewingPack, progress.records);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose pack and level"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-md flex-col overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[8px_8px_0_#111111] sm:max-h-[min(86dvh,620px)] sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bauhaus Primary Color Rule */}
        <div aria-hidden="true" className="grid h-2 shrink-0 grid-cols-3 border-b-2 border-[#111111]">
          <div className="border-r-2 border-[#111111] bg-[#d6302a]" />
          <div className="border-r-2 border-[#111111] bg-[#e4b43c]" />
          <div className="bg-[#2b56a3]" />
        </div>

        {/* Header with Game Icon (Pinned, never clipped) */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-[#111111] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <GameIcon className="h-8 w-8 shrink-0 shadow-[2px_2px_0_#111111]" />
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-black tracking-tight uppercase leading-tight">
                Walls & Packs
              </h2>
              <p className="font-mono-num truncate text-[11px] font-bold text-[#111111]/70">
                {packTheme.name} ·{' '}
                {viewingUnlocked ? `${clearedCount}/${levels.length} cleared` : 'Locked'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level selector"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#faf6ea] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:bg-[#d6302a] hover:text-[#faf6ea]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Pack Tabs (6 Packs, locked tabs still browsable, unlocked progression tabs glow & shine) */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b-2 border-[#111111] bg-[#ece5d2] px-4 py-2.5 sm:px-5">
          {THEME_ORDER.map((id) => {
            const t = THEMES[id];
            const active = id === viewingPack;
            const packLevels = PACK_LEVELS[id];
            const unlocked = isPackUnlocked(id, progress.records);
            const showShine = unlocked && id !== 'fridge';
            const isJustUnlocked = showShine && progress.newlyUnlockedPacks.includes(id);
            const packStars = packLevels.reduce(
              (acc, l) => acc + (progress.records[l.id]?.stars ?? 0),
              0
            );
            const maxStars = packLevels.length * 3;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewingPack(id);
                }}
                style={
                  showShine
                    ? ({ '--pack-glow-rgb': PACK_GLOW_RGB[id] } as React.CSSProperties)
                    : undefined
                }
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 border-2 border-[#111111] px-2.5 py-1.5 text-xs font-extrabold uppercase transition whitespace-nowrap ${
                  showShine ? 'pack-unlocked-shine' : ''
                } ${isJustUnlocked ? 'pack-just-unlocked' : ''} ${
                  active
                    ? 'bg-[#111111] text-[#e4b43c] shadow-[2px_2px_0_#d6302a]'
                    : unlocked
                      ? 'bg-[#faf6ea] text-[#111111] shadow-[2px_2px_0_#111111] hover:bg-white'
                      : 'bg-[#dfd7c2] text-[#111111]/60 hover:bg-[#e8e1ce]'
                }`}
              >
                {unlocked ? (
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: PACK_SWATCH_BG[id] }}
                    className={`h-3 w-3 border ${active ? 'border-[#faf6ea]' : 'border-[#111111]'}`}
                  />
                ) : (
                  <Lock className="h-3 w-3 shrink-0" />
                )}
                <span>{t.shortName}</span>
                {unlocked && (
                  <span className="font-mono-num opacity-80">
                    {packStars}/{maxStars}
                  </span>
                )}
                {isJustUnlocked && (
                  <Sparkles className="h-3 w-3 shrink-0 text-[#e4b43c]" />
                )}
              </button>
            );
          })}
        </div>

        {/* All 18 Levels Scrollable Grid (Shows all 18 levels even when pack is locked) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {!viewingUnlocked && unlockReq && (
            <div className="mb-3.5 flex items-center gap-2.5 border-2 border-[#111111] bg-[#e4b43c]/35 px-3.5 py-2.5 text-left text-xs text-[#111111]">
              <Lock className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-display font-extrabold uppercase">
                  {packTheme.shortName} Locked
                </span>
                <span className="mx-1.5">·</span>
                <span>
                  Clear all {unlockReq.total} {unlockReq.prevPackName} walls to unlock (
                  <span className="font-mono-num font-bold">
                    {unlockReq.cleared}/{unlockReq.total}
                  </span>
                  )
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {levels.map((lvl) => {
              const rec = progress.records[lvl.id];
              const isCurrent =
                viewingUnlocked &&
                !currentLevel.isEndless &&
                !currentLevel.isDaily &&
                currentLevel.id === lvl.id;

              return (
                <button
                  key={lvl.id}
                  type="button"
                  aria-disabled={!viewingUnlocked}
                  onClick={() => {
                    if (!viewingUnlocked) {
                      sound.playBump(viewingPack);
                      return;
                    }
                    sound.playClick();
                    onSelectLevel(lvl);
                  }}
                  className={`flex flex-col justify-between border-2 border-[#111111] p-3 text-left transition ${
                    !viewingUnlocked
                      ? 'cursor-not-allowed bg-[#e5decb] opacity-65'
                      : isCurrent
                        ? 'cursor-pointer bg-[#e4b43c] shadow-[3px_3px_0_#111111] active:translate-x-[1px] active:translate-y-[1px]'
                        : 'cursor-pointer bg-[#faf6ea] shadow-[2px_2px_0_#111111] hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num text-xs font-extrabold text-[#111111]/60">
                      {lvl.indexInPack + 1}
                    </span>
                    {viewingUnlocked ? (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              rec && rec.stars >= s
                                ? 'fill-[#d6302a] text-[#111111]'
                                : 'text-[#111111]/20'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-[#111111]/55" />
                    )}
                  </div>

                  <div className="mt-2">
                    <div
                      className={`font-display truncate text-sm font-extrabold ${
                        viewingUnlocked ? 'text-[#111111]' : 'text-[#111111]/55'
                      }`}
                    >
                      {lvl.title}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1 text-[11px] font-bold text-[#111111]/65">
                      <span>{viewingUnlocked ? lvl.difficulty : 'Locked'}</span>
                      {viewingUnlocked && rec?.bestTimeMs !== undefined && (
                        <span className="font-mono-num flex items-center gap-0.5 text-[10px] text-[#2b56a3]">
                          <Timer className="h-2.5 w-2.5" />
                          {formatStopwatchMs(rec.bestTimeMs)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Daily Puzzle & Endless Mode Quick Launch (Pinned) */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t-2 border-[#111111] bg-[#ece5d2] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSelectDaily();
            }}
            className={`font-display flex cursor-pointer items-center gap-1.5 border-2 border-[#111111] px-3 py-1.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 whitespace-nowrap ${
              todayDailyRecord
                ? 'bg-[#e4b43c] text-[#111111]'
                : 'bg-[#faf6ea] text-[#111111] hover:bg-white'
            }`}
          >
            {todayDailyRecord?.dailyMissionCompleted ? (
              <DailyRewardIcon className="h-4 w-4 shrink-0" />
            ) : todayDailyRecord ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[#111111]" />
            ) : (
              <Calendar className="h-3.5 w-3.5 text-[#d6302a]" />
            )}
            <span>Daily · {formatDailyDateLabel(todayKey)}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              const endlessTheme = viewingUnlocked
                ? viewingPack
                : getHighestUnlockedPack(progress.records);
              onSelectEndless(endlessTheme);
            }}
            className="font-display flex cursor-pointer items-center gap-1.5 border-2 border-[#111111] bg-[#2b56a3] px-3 py-1.5 text-xs font-extrabold text-[#faf6ea] uppercase shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-[#244a8e] whitespace-nowrap"
          >
            <InfinityIcon className="h-3.5 w-3.5" />
            <span>Endless #{progress.endlessCurrentLevel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. PAUSE MODAL
   ========================================================================= */
interface PauseModalProps {
  level: LevelDef;
  muted: boolean;
  musicMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenLevels: () => void;
  onOpenArchive: (tab?: StudioArchiveTab) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onTitleScreen: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  muted,
  musicMuted,
  onResume,
  onRestart,
  onOpenLevels,
  onOpenArchive,
  onToggleMute,
  onToggleMusic,
  onTitleScreen,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onResume}
    >
      <div
        className="w-full max-w-sm overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[8px_8px_0_#111111]"
        onClick={(e) => e.stopPropagation()}
      >
        <div aria-hidden="true" className="grid h-2.5 grid-cols-3 border-b-2 border-[#111111]">
          <div className="border-r-2 border-[#111111] bg-[#d6302a]" />
          <div className="border-r-2 border-[#111111] bg-[#e4b43c]" />
          <div className="bg-[#2b56a3]" />
        </div>

        <div className="p-6">
          <div className="mb-5 text-center">
            <GameIcon className="mx-auto mb-3 h-12 w-12 shadow-[3px_3px_0_#111111]" />
            <h2 className="font-display text-2xl font-black uppercase">Paused</h2>
            <p className="font-mono-num mt-1 text-xs font-bold text-[#111111]/65">
              {level.title} · {THEMES[level.packId].name}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="font-display flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#d6302a] py-3.5 text-base font-black tracking-wide text-[#faf6ea] uppercase shadow-[4px_4px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Resume</span>
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="font-display flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#faf6ea] py-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-white"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart Wall</span>
            </button>

            <button
              type="button"
              onClick={onOpenLevels}
              className="font-display flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#faf6ea] py-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-white"
            >
              <Layers className="h-4 w-4" />
              <span>Switch Pack or Wall</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenArchive('styles')}
              className="font-display flex w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#e4b43c] py-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-[#ecc252]"
            >
              <Award className="h-4 w-4" />
              <span>Gallery, Mastery & Styles</span>
            </button>

            <div className="mt-1 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onToggleMusic}
                className="flex cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] py-2.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_#111111] transition hover:bg-white whitespace-nowrap"
              >
                <Music className={`h-4 w-4 ${musicMuted ? 'text-[#d6302a]' : ''}`} />
                <span>{musicMuted ? 'Off' : 'Music'}</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                className="flex cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] py-2.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_#111111] transition hover:bg-white whitespace-nowrap"
              >
                {muted ? <VolumeX className="h-4 w-4 text-[#d6302a]" /> : <Volume2 className="h-4 w-4" />}
                <span>{muted ? 'Muted' : 'SFX'}</span>
              </button>

              <button
                type="button"
                onClick={onTitleScreen}
                className="flex cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] py-2.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_#111111] transition hover:bg-white whitespace-nowrap"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. VICTORY (SUCCESS) CELEBRATION MODAL
   ========================================================================= */
interface VictoryModalProps {
  level: LevelDef;
  starsEarned: 1 | 2 | 3;
  sheetsPeeled: number;
  bumps: number;
  elapsedSec: number;
  elapsedMs: number;
  timeAttackActive: boolean;
  bestTimeMs: number | null;
  isNewBestTime: boolean;
  maxCombo: number;
  dailyStreak: number;
  dailyMissionCompleted: boolean;
  newlyUnlockedPack: ThemeId | null;
  newlyUnlockedAchievements?: string[];
  newlyUnlockedStyles?: PaperStyleId[];
  hasNextLevelInPack: boolean;
  nextPackUnlocked: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
  onOpenLevels: () => void;
  onOpenArchive?: (tab?: StudioArchiveTab) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  starsEarned,
  sheetsPeeled,
  bumps,
  elapsedSec,
  elapsedMs,
  timeAttackActive,
  bestTimeMs,
  isNewBestTime,
  maxCombo,
  dailyStreak,
  dailyMissionCompleted,
  newlyUnlockedPack,
  newlyUnlockedAchievements = [],
  newlyUnlockedStyles = [],
  hasNextLevelInPack,
  nextPackUnlocked,
  onReplay,
  onNext,
  onHome,
  onOpenLevels,
  onOpenArchive,
}) => {
  const unlockedStampDefs = newlyUnlockedAchievements
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const headline = level.isDaily
    ? 'Daily Wall Cleared'
    : starsEarned === 3
      ? 'Spotless Peel'
      : starsEarned === 2
        ? 'Wall Cleared'
        : 'All Notes Peeled';

  const subtitle = level.isDaily
    ? dailyStreak > 1
      ? `Daily streak: ${dailyStreak} days in a row. Come back tomorrow for a fresh wall!`
      : 'Today’s puzzle is complete! Come back tomorrow for a brand-new wall.'
    : starsEarned === 3
      ? 'Zero blocked taps — crisp order from start to finish.'
      : starsEarned === 2
        ? 'Clean clear with only a bump or two along the way.'
        : 'Board cleared! Replay with zero bumps to earn 3 stars.';

  const nextLabel = newlyUnlockedPack
    ? `Play ${THEMES[newlyUnlockedPack].shortName}`
    : level.isDaily
      ? 'Play Endless'
      : level.isEndless
        ? `Endless #${(level.endlessNumber ?? 1) + 1}`
        : hasNextLevelInPack
          ? 'Next Wall'
          : nextPackUnlocked
            ? 'Next Pack'
            : 'Next Unfinished';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Level complete"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4"
    >
      <div className="combo-pop relative flex max-h-[calc(100dvh-24px)] w-full max-w-sm flex-col overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-center text-[#111111] shadow-[8px_8px_0_#111111]">
        {/* Top Bauhaus Primary Color Band */}
        <div aria-hidden="true" className="grid h-3 shrink-0 grid-cols-3 border-b-2 border-[#111111]">
          <div className="border-r-2 border-[#111111] bg-[#e4b43c]" />
          <div className="border-r-2 border-[#111111] bg-[#d6302a]" />
          <div className="bg-[#2b56a3]" />
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="font-mono-num text-xs font-bold tracking-wider text-[#111111]/65 uppercase">
            {level.title}
          </div>
          <h2 className="font-display mt-1 text-2xl font-black tracking-tight uppercase sm:text-3xl">
            {headline}
          </h2>
          <p className="mx-auto mt-1 max-w-[270px] text-xs font-medium leading-relaxed text-[#111111]/75">
            {subtitle}
          </p>

          {/* Stars Display */}
          <div className="my-3 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => {
              const earned = s <= starsEarned;
              return (
                <Star
                  key={s}
                  className={`h-10 w-10 transition-transform duration-300 sm:h-11 sm:w-11 ${
                    earned
                      ? 'scale-105 fill-[#e4b43c] text-[#111111] drop-shadow-[2px_2px_0_#111111]'
                      : 'scale-95 text-[#111111]/20'
                  }`}
                />
              );
            })}
          </div>

          {/* Newly Unlocked Pack Celebration Banner (with Glow & Shine) */}
          {newlyUnlockedPack && (
            <div
              style={
                { '--pack-glow-rgb': PACK_GLOW_RGB[newlyUnlockedPack] } as React.CSSProperties
              }
              className="pack-unlocked-shine pack-just-unlocked mb-3 flex items-center gap-3 border-2 border-[#111111] bg-[#e4b43c] px-3 py-2 text-left text-[#111111]"
            >
              <span
                aria-hidden="true"
                style={{ backgroundColor: PACK_SWATCH_BG[newlyUnlockedPack] }}
                className="relative z-10 h-8 w-8 shrink-0 border-2 border-[#111111]"
              />
              <div className="relative z-10 min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase">
                  <Unlock className="h-3.5 w-3.5 shrink-0" />
                  <span>New Category Unlocked</span>
                </div>
                <div className="font-display truncate text-sm font-black uppercase">
                  {THEMES[newlyUnlockedPack].name} · 18 Walls
                </div>
              </div>
              <Sparkles className="relative z-10 h-4 w-4 shrink-0" />
            </div>
          )}

          {/* Daily Mission Reward Display (Daily Puzzle only) */}
          {level.isDaily && level.dailyMission && (
            <div
              className={`mb-3 flex items-center gap-3 border-2 border-[#111111] px-3 py-2 text-left ${
                dailyMissionCompleted
                  ? 'bg-[#e4b43c]/50 text-[#111111]'
                  : 'bg-[#e6dfd0] text-[#111111]/75'
              }`}
            >
              {dailyMissionCompleted ? (
                <DailyRewardIcon className="reward-seal-pop h-9 w-9 shrink-0" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#111111] bg-[#f5f0e2] text-[#111111]">
                  <Target className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-display text-[11px] font-extrabold uppercase leading-tight">
                  {dailyMissionCompleted
                    ? `Daily Mission Complete · ${level.dailyMission.rewardTitle}`
                    : 'Daily Mission Missed'}
                </div>
                <div className="mt-0.5 truncate text-xs font-semibold opacity-85">
                  {level.dailyMission.label}
                  {!dailyMissionCompleted && ' · Replay to earn seal'}
                </div>
              </div>
            </div>
          )}

          {/* Newly Unlocked Bauhaus Poster Stamp Callout */}
          {unlockedStampDefs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenArchive?.('gallery');
              }}
              className="mb-2.5 flex w-full cursor-pointer items-center gap-3 border-2 border-[#111111] bg-[#faf6ea] px-3 py-2 text-left shadow-[3px_3px_0_#111111] transition hover:bg-white"
            >
              <BauhausPosterStamp
                motif={unlockedStampDefs[0].motif}
                unlocked={true}
                className="h-10 w-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-mono-num flex items-center gap-1 text-[10px] font-extrabold text-[#d6302a] uppercase">
                  <Award className="h-3 w-3 shrink-0" />
                  <span>
                    Poster Stamp Unlocked
                    {unlockedStampDefs.length > 1 ? ` (+${unlockedStampDefs.length - 1})` : ''}
                  </span>
                </div>
                <div className="font-display truncate text-sm font-black uppercase">
                  {unlockedStampDefs[0].title}
                </div>
              </div>
              <span className="font-display shrink-0 text-[10px] font-black uppercase underline">
                View
              </span>
            </button>
          )}

          {/* Newly Unlocked Paper / Arrow Style Callout */}
          {newlyUnlockedStyles.length > 0 && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenArchive?.('styles');
              }}
              className="mb-3 flex w-full cursor-pointer items-center gap-3 border-2 border-[#111111] bg-[#2b56a3] px-3 py-2 text-left text-[#faf6ea] shadow-[3px_3px_0_#111111] transition hover:bg-[#244a8e]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#111111] bg-[#e4b43c] text-[#111111]">
                <Palette className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono-num text-[10px] font-extrabold text-[#e4b43c] uppercase">
                  Paper Style Unlocked
                </div>
                <div className="font-display truncate text-sm font-black uppercase">
                  {PAPER_STYLES[newlyUnlockedStyles[0]].name}
                </div>
              </div>
              <span className="font-display shrink-0 text-[10px] font-black uppercase underline">
                Equip
              </span>
            </button>
          )}

          {/* Time Attack Highlight Row */}
          {(timeAttackActive || bestTimeMs !== null) && (
            <div className="mb-3 flex items-center justify-center gap-4 border-t-2 border-[#111111] pt-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <Timer className="h-3.5 w-3.5 text-[#d6302a]" />
                <span className="font-mono-num text-sm font-extrabold">
                  {formatStopwatchMs(elapsedMs)}
                </span>
              </div>

              {bestTimeMs !== null && (
                <>
                  <span aria-hidden="true" className="opacity-40">
                    ·
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Trophy className="h-3.5 w-3.5 text-[#2b56a3]" />
                    <span className="opacity-70">Best</span>
                    <span className="font-mono-num text-sm font-extrabold">
                      {formatStopwatchMs(bestTimeMs)}
                    </span>
                    {isNewBestTime && (
                      <span className="font-display text-xs font-black text-[#d6302a] uppercase">
                        New!
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Crisp Tabular Stats Grid */}
          <div className="mb-4 grid grid-cols-4 divide-x-2 divide-[#111111] border-y-2 border-[#111111] py-2.5">
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Sheets</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">{sheetsPeeled}</div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Bumps</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">
                {bumps}/{MAX_BUMPS}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Time</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">
                {timeAttackActive ? formatStopwatchMs(elapsedMs) : formatTime(elapsedSec)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Streak</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">×{maxCombo}</div>
            </div>
          </div>

          {/* Actions: Full-width Primary CTA on top + Home & Replay cleanly below (never clips on any screen) */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onNext}
              className="font-display flex h-12 w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#d6302a] px-4 text-base font-black tracking-wide text-[#faf6ea] uppercase shadow-[4px_4px_0_#111111] transition hover:bg-[#c02621] active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap"
            >
              <span className="truncate">{nextLabel}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onHome}
                className="font-display flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] px-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-white active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap"
              >
                <Home className="h-4 w-4 shrink-0" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={onReplay}
                className="font-display flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] px-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-white active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Replay</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLevels}
            className="mt-3.5 cursor-pointer text-xs font-extrabold uppercase underline-offset-4 opacity-70 hover:underline hover:opacity-100"
          >
            Browse all packs & walls
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. FAILED PANEL MODAL (Reached Bump Limit)
   ========================================================================= */
interface FailedModalProps {
  level: LevelDef;
  sheetsRemaining: number;
  bumps: number;
  elapsedSec: number;
  onRetry: () => void;
  onHome: () => void;
  onOpenLevels: () => void;
}

export const FailedModal: React.FC<FailedModalProps> = ({
  level,
  sheetsRemaining,
  bumps,
  elapsedSec,
  onRetry,
  onHome,
  onOpenLevels,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Level failed"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4"
    >
      <div className="combo-pop relative flex max-h-[calc(100dvh-24px)] w-full max-w-sm flex-col overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-center text-[#111111] shadow-[8px_8px_0_#111111]">
        {/* Top Vermilion Warning Strip */}
        <div aria-hidden="true" className="h-3 shrink-0 border-b-2 border-[#111111] bg-[#d6302a]" />

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border-2 border-[#111111] bg-[#d6302a] text-[#faf6ea] shadow-[3px_3px_0_#111111]">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="font-mono-num text-xs font-bold uppercase opacity-65">
            {level.title} · {THEMES[level.packId].shortName}
          </div>
          <h2 className="font-display mt-1 text-2xl font-black tracking-tight uppercase sm:text-3xl">
            Wall Jammed
          </h2>
          <p className="mx-auto mt-1 max-w-[260px] text-xs font-medium leading-relaxed opacity-75">
            You hit {MAX_BUMPS} blocked bumps. Clear the notes obstructing the exit path first, or use a hint!
          </p>

          {/* Tabular Stats Summary */}
          <div className="my-4 grid grid-cols-3 divide-x-2 divide-[#111111] border-y-2 border-[#111111] py-2.5">
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Left</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">{sheetsRemaining}</div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Bumps</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold text-[#d6302a]">
                {bumps}/{MAX_BUMPS}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase opacity-60">Time</div>
              <div className="font-mono-num mt-0.5 text-base font-extrabold">
                {formatTime(elapsedSec)}
              </div>
            </div>
          </div>

          {/* Actions: Home + Try Again */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onHome}
              className="font-display flex h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#faf6ea] px-3 text-sm font-extrabold uppercase shadow-[3px_3px_0_#111111] transition hover:bg-white active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={onRetry}
              className="font-display flex h-12 min-w-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#111111] px-3 text-sm font-black text-[#e4b43c] uppercase shadow-[4px_4px_0_#d6302a] transition hover:bg-[#222222] active:translate-x-[1px] active:translate-y-[1px] whitespace-nowrap sm:text-base"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span>Try Again</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenLevels}
            className="mt-3.5 cursor-pointer text-xs font-extrabold uppercase underline-offset-4 opacity-70 hover:underline hover:opacity-100"
          >
            Browse all packs & walls
          </button>
        </div>
      </div>
    </div>
  );
};
