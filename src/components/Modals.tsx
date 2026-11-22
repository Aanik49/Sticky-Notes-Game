import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Home,
  Infinity as InfinityIcon,
  Layers,
  Music,
  Play,
  RotateCcw,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  formatDailyDateLabel,
  getTodayDateKey,
  PACK_LEVELS,
  THEME_ORDER,
  THEMES,
} from '../game/levels';
import { LevelDef, MAX_BUMPS, SavedProgress, ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* =========================================================================
   1. PACK & LEVEL SELECTOR MODAL
   ========================================================================= */
interface LevelPickerModalProps {
  currentLevel: LevelDef;
  progress: SavedProgress;
  onSelectLevel: (level: LevelDef) => void;
  onSelectDaily: () => void;
  onSelectEndless: (themeId: ThemeId) => void;
  onClose: () => void;
}

export const LevelPickerModal: React.FC<LevelPickerModalProps> = ({
  currentLevel,
  progress,
  onSelectLevel,
  onSelectDaily,
  onSelectEndless,
  onClose,
}) => {
  const [viewingPack, setViewingPack] = useState<ThemeId>(currentLevel.packId);
  const packTheme = THEMES[viewingPack];
  const levels = PACK_LEVELS[viewingPack];
  const todayKey = getTodayDateKey();
  const todayDailyRecord = progress.dailyRecords[todayKey];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose pack and level"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-xs sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Game Icon */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <GameIcon className="h-9 w-9 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-bold leading-tight">Walls & Packs</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {packTheme.name} · {packTheme.tagline}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level selector"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Theme Pack Tabs */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-6 py-3">
          {THEME_ORDER.map((id) => {
            const t = THEMES[id];
            const active = id === viewingPack;
            const packStars = PACK_LEVELS[id].reduce(
              (acc, l) => acc + (progress.records[l.id]?.stars ?? 0),
              0
            );
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewingPack(id);
                }}
                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`${t.boardClass} h-3.5 w-3.5 rounded-sm !border !shadow-none`}
                />
                <span>{t.shortName}</span>
                <span className="font-mono-num opacity-70">{packStars}/18</span>
              </button>
            );
          })}
        </div>

        {/* 6 Levels Grid */}
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
          {levels.map((lvl) => {
            const rec = progress.records[lvl.id];
            const isCurrent =
              !currentLevel.isEndless && !currentLevel.isDaily && currentLevel.id === lvl.id;
            const hasDoubles = lvl.notes.some((n) => n.under);
            const hasObstacles = (lvl.obstacles?.length ?? 0) > 0;

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectLevel(lvl);
                }}
                className={`flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-3.5 text-left transition active:scale-[0.98] ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-50/80 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-num text-xs font-bold text-slate-400">
                    {lvl.indexInPack + 1}
                  </span>
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
                </div>

                <div className="mt-2">
                  <div className="font-display truncate text-sm font-bold text-slate-900">
                    {lvl.title}
                  </div>
                  <div className="font-mono-num mt-0.5 text-[11px] text-slate-500">
                    {lvl.rows}×{lvl.cols} · {lvl.difficulty}
                  </div>
                </div>

                {(hasDoubles || hasObstacles) && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    {hasDoubles && <span>Stacks</span>}
                    {hasDoubles && hasObstacles && <span aria-hidden="true">·</span>}
                    {hasObstacles && <span>Pins</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Daily Puzzle & Endless Mode Quick Launch */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSelectDaily();
            }}
            className={`font-display flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${
              todayDailyRecord
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                : 'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100'
            }`}
          >
            {todayDailyRecord ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <Calendar className="h-4 w-4 text-amber-600" />
            )}
            <span>Daily · {formatDailyDateLabel(todayKey)}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onSelectEndless(viewingPack);
            }}
            className="font-display flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:bg-slate-800 whitespace-nowrap"
          >
            <InfinityIcon className="h-4 w-4" />
            <span>Endless Wall #{progress.endlessCurrentLevel}</span>
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
  maxCombo: number;
  dailyStreak: number;
  hasNextLevelInPack: boolean;
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
  maxCombo,
  dailyStreak,
  hasNextLevelInPack,
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

  const nextLabel = level.isDaily
    ? 'Play Endless'
    : level.isEndless
      ? `Endless #${(level.endlessNumber ?? 1) + 1}`
      : hasNextLevelInPack
        ? 'Next Wall'
        : 'Next Pack';

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
          {level.title} · {THEMES[level.packId].shortName}
        </div>
        <h2 className="font-display mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {headline}
        </h2>
        <p className="mx-auto mt-1 max-w-[270px] text-xs leading-relaxed text-slate-500">
          {subtitle}
        </p>

        {/* Stars Display */}
        <div className="my-5 flex items-center justify-center gap-3">
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

        {/* Crisp Tabular Stats Row */}
        <div className="mb-6 grid grid-cols-4 divide-x divide-slate-200 border-y border-slate-100 py-3">
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
              {formatTime(elapsedSec)}
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
