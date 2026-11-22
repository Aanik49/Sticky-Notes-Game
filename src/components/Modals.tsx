import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Home,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  Music,
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
import { LevelDef, MAX_BUMPS, SavedProgress, ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';

const PACK_GLOW_RGB: Record<ThemeId, string> = {
  fridge: '14, 165, 233',
  cork: '217, 119, 6',
  drafting: '20, 184, 166',
  midnight: '251, 191, 36',
};

/** Small golden wax-seal & ribbon reward icon earned by completing the Daily Mission */
export const DailyRewardIcon: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    role="img"
    aria-label="Daily Mission Reward Seal"
    className={className}
  >
    <defs>
      <linearGradient id="dailySealGold" x1="8" y1="4" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="52%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="dailyRibbon" x1="12" y1="24" x2="28" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
    </defs>
    {/* Twin ribbon tails */}
    <path d="M13 24L10 37L16.5 33.5L20 37V25H13Z" fill="url(#dailyRibbon)" />
    <path d="M27 24L30 37L23.5 33.5L20 37V25H27Z" fill="url(#dailyRibbon)" opacity="0.9" />
    {/* Outer scalloped medal body */}
    <circle cx="20" cy="17" r="12.5" fill="url(#dailySealGold)" stroke="#92400e" strokeWidth="1.4" />
    <circle cx="20" cy="17" r="9.4" fill="#fef9c3" fillOpacity="0.28" stroke="#fef3c7" strokeWidth="1" />
    {/* Center crisp star */}
    <path
      d="M20 10.6L21.9 14.5L26.2 15.1L23.1 18.1L23.8 22.4L20 20.4L16.2 22.4L16.9 18.1L13.8 15.1L18.1 14.5L20 10.6Z"
      fill="#fffbeb"
      stroke="#92400e"
      strokeWidth="0.9"
      strokeLinejoin="round"
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
   1. PACK & LEVEL SELECTOR MODAL
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl sm:max-h-[min(86dvh,600px)] sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Game Icon (Pinned, never clipped) */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <GameIcon className="h-8 w-8 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-bold leading-tight">
                Walls & Packs
              </h2>
              <p className="font-mono-num truncate text-[11px] text-slate-500">
                {packTheme.name} ·{' '}
                {viewingUnlocked ? `${clearedCount}/${levels.length} cleared` : 'Locked'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level selector"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Theme Pack Tabs (Pinned, locked tabs still browsable, unlocked progression tabs glow & shine) */}
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 sm:px-5">
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
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  showShine ? 'pack-unlocked-shine' : ''
                } ${isJustUnlocked ? 'pack-just-unlocked' : ''} ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : unlocked
                      ? 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                      : 'bg-slate-100/80 text-slate-400 ring-1 ring-slate-200/80 hover:bg-slate-200/70'
                }`}
              >
                {unlocked ? (
                  <span
                    aria-hidden="true"
                    className={`${t.boardClass} h-3 w-3 rounded-sm !border !shadow-none`}
                  />
                ) : (
                  <Lock className="h-3 w-3 shrink-0 opacity-75" />
                )}
                <span>{t.shortName}</span>
                {unlocked && (
                  <span className="font-mono-num opacity-70">
                    {packStars}/{maxStars}
                  </span>
                )}
                {isJustUnlocked && (
                  <Sparkles className="h-3 w-3 shrink-0 text-amber-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* All 18 Levels Scrollable Grid (Shows all 18 levels even when pack is locked) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {!viewingUnlocked && unlockReq && (
            <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-xs text-slate-600">
              <Lock className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-slate-800">{packTheme.shortName} Locked</span>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>
                  Clear all {unlockReq.total} {unlockReq.prevPackName} walls to unlock (
                  <span className="font-mono-num font-bold text-slate-800">
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
                  className={`flex flex-col justify-between rounded-2xl border-2 p-3 text-left transition ${
                    !viewingUnlocked
                      ? 'cursor-not-allowed border-slate-200/80 bg-slate-50/90 opacity-65'
                      : isCurrent
                        ? 'cursor-pointer border-amber-400 bg-amber-50/80 shadow-sm active:scale-[0.98]'
                        : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-num text-xs font-bold text-slate-400">
                      {lvl.indexInPack + 1}
                    </span>
                    {viewingUnlocked ? (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              rec && rec.stars >= s
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>

                  <div className="mt-2">
                    <div
                      className={`font-display truncate text-sm font-bold ${
                        viewingUnlocked ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {lvl.title}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-1 text-[11px] font-medium text-slate-500">
                      <span>{viewingUnlocked ? lvl.difficulty : 'Locked'}</span>
                      {viewingUnlocked && rec?.bestTimeMs !== undefined && (
                        <span className="font-mono-num flex items-center gap-0.5 text-[10px] text-amber-600">
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
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSelectDaily();
            }}
            className={`font-display flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              todayDailyRecord
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                : 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
            }`}
          >
            {todayDailyRecord?.dailyMissionCompleted ? (
              <DailyRewardIcon className="h-4 w-4 shrink-0" />
            ) : todayDailyRecord ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Calendar className="h-3.5 w-3.5 text-amber-600" />
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
            className="font-display flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-slate-800 whitespace-nowrap"
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
  onToggleMute,
  onToggleMusic,
  onTitleScreen,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game paused"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onResume}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 text-center">
          <GameIcon className="mx-auto mb-2.5 h-12 w-12 drop-shadow-sm" />
          <h2 className="font-display text-2xl font-bold">Paused</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {level.title} · {THEMES[level.packId].name}
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="font-display flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-base font-bold text-amber-300 shadow-md transition hover:bg-slate-800"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Wall</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevels}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
          >
            <Layers className="h-4 w-4" />
            <span>Switch Pack or Wall</span>
          </button>

          <div className="mt-1 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onToggleMusic}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
            >
              <Music className={`h-4 w-4 ${musicMuted ? 'text-rose-500' : ''}`} />
              <span>{musicMuted ? 'Off' : 'Music'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
            >
              {muted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4" />}
              <span>{muted ? 'Muted' : 'SFX'}</span>
            </button>

            <button
              type="button"
              onClick={onTitleScreen}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 whitespace-nowrap"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>
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
  hasNextLevelInPack: boolean;
  nextPackUnlocked: boolean;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
  onOpenLevels: () => void;
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
  hasNextLevelInPack,
  nextPackUnlocked,
  onReplay,
  onNext,
  onHome,
  onOpenLevels,
}) => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="combo-pop relative w-full max-w-sm overflow-hidden rounded-[28px] bg-white p-6 text-center text-slate-900 shadow-2xl">
        {/* Top Canary Adhesive Strip Accent */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-2.5 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400"
        />

        <div className="mt-1 text-xs font-semibold text-slate-500">
          {level.title}
        </div>
        <h2 className="font-display mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {headline}
        </h2>
        <p className="mx-auto mt-1 max-w-[270px] text-xs leading-relaxed text-slate-500">
          {subtitle}
        </p>

        {/* Stars Display */}
        <div className="my-3.5 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => {
            const earned = s <= starsEarned;
            return (
              <Star
                key={s}
                className={`h-11 w-11 transition-transform duration-300 ${
                  earned
                    ? 'scale-105 fill-amber-400 text-amber-500 drop-shadow-sm'
                    : 'scale-95 text-slate-200'
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
            className="pack-unlocked-shine pack-just-unlocked mb-3.5 flex items-center gap-3 rounded-2xl border-2 border-amber-300/80 bg-amber-50/90 px-3.5 py-2.5 text-left"
          >
            <span
              aria-hidden="true"
              className={`${THEMES[newlyUnlockedPack].boardClass} relative z-10 h-9 w-9 shrink-0 rounded-xl !border-2 !shadow-sm`}
            />
            <div className="relative z-10 min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                <Unlock className="h-3.5 w-3.5 shrink-0" />
                <span>New Category Unlocked</span>
              </div>
              <div className="font-display truncate text-sm font-bold text-slate-900">
                {THEMES[newlyUnlockedPack].name} · 18 Walls
              </div>
            </div>
            <Sparkles className="relative z-10 h-4 w-4 shrink-0 text-amber-500" />
          </div>
        )}

        {/* Daily Mission Reward Display (Daily Puzzle only) */}
        {level.isDaily && level.dailyMission && (
          <div
            className={`mb-3.5 flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left ${
              dailyMissionCompleted
                ? 'border-amber-200 bg-amber-50/85 text-amber-950'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {dailyMissionCompleted ? (
              <DailyRewardIcon className="reward-seal-pop h-9 w-9 shrink-0 drop-shadow-xs" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200/70 text-slate-500">
                <Target className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold leading-tight">
                {dailyMissionCompleted
                  ? `Daily Mission Complete · ${level.dailyMission.rewardTitle}`
                  : 'Daily Mission Missed'}
              </div>
              <div className="mt-0.5 truncate text-xs opacity-80">
                {level.dailyMission.label}
                {!dailyMissionCompleted && ' · Replay to earn seal'}
              </div>
            </div>
          </div>
        )}

        {/* Time Attack Highlight Row (shows clear time + best time when Time Attack active or recorded) */}
        {(timeAttackActive || bestTimeMs !== null) && (
          <div className="mb-3.5 flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Timer className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-mono-num text-sm font-bold text-slate-900">
                {formatStopwatchMs(elapsedMs)}
              </span>
            </div>

            {bestTimeMs !== null && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-slate-500">Best</span>
                  <span className="font-mono-num text-sm font-bold text-slate-900">
                    {formatStopwatchMs(bestTimeMs)}
                  </span>
                  {isNewBestTime && (
                    <span className="font-display text-xs font-bold text-emerald-600">
                      New!
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Crisp Tabular Stats Row */}
        <div className="mb-5 grid grid-cols-4 divide-x divide-slate-200 border-y border-slate-100 py-3">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Sheets</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              {sheetsPeeled}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Bumps</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              {bumps}/{MAX_BUMPS}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Time</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              {timeAttackActive ? formatStopwatchMs(elapsedMs) : formatTime(elapsedSec)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Streak</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              ×{maxCombo}
            </div>
          </div>
        </div>

        {/* Actions: Home + Replay + Next */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onHome}
            aria-label="Back to Home"
            title="Home"
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:translate-y-0.5"
          >
            <Home className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onReplay}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200 active:translate-y-0.5 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>Replay</span>
          </button>

          <button
            type="button"
            onClick={onNext}
            className="font-display flex h-12 flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-base font-bold text-amber-300 shadow-[0_5px_0_#020617] transition hover:bg-slate-800 active:translate-y-0.5 whitespace-nowrap"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenLevels}
          className="mt-3.5 cursor-pointer text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Browse all packs & walls
        </button>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
    >
      <div className="combo-pop relative w-full max-w-sm overflow-hidden rounded-[28px] bg-white p-6 text-center text-slate-900 shadow-2xl">
        {/* Top Rose Accent Strip */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-2.5 bg-gradient-to-r from-rose-400 via-rose-500 to-red-500"
        />

        <div className="mx-auto mt-2 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {level.title} · {THEMES[level.packId].shortName}
        </div>
        <h2 className="font-display mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Wall Jammed
        </h2>
        <p className="mx-auto mt-1 max-w-[260px] text-xs leading-relaxed text-slate-500">
          You hit {MAX_BUMPS} blocked bumps. Clear the notes obstructing the exit path first, or use a hint!
        </p>

        {/* Tabular Stats Summary */}
        <div className="my-5 grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-100 py-3">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Left</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              {sheetsRemaining}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Bumps</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-rose-600">
              {bumps}/{MAX_BUMPS}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Time</div>
            <div className="font-mono-num mt-0.5 text-base font-bold text-slate-900">
              {formatTime(elapsedSec)}
            </div>
          </div>
        </div>

        {/* Actions: Home + Try Again */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onHome}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200 active:translate-y-0.5 whitespace-nowrap"
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="font-display flex h-12 flex-[1.5] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-base font-bold text-amber-300 shadow-[0_5px_0_#020617] transition hover:bg-slate-800 active:translate-y-0.5 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>Try Again</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenLevels}
          className="mt-3.5 cursor-pointer text-xs font-semibold text-slate-500 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Browse all packs & walls
        </button>
      </div>
    </div>
  );
};
