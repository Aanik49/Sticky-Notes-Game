import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Check,
  Lock,
  Palette,
  Star,
  Timer,
  X,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  CLASSIC_THEME_ORDER,
  getPackClearedCount,
  LAB_THEME_ORDER,
  PACK_LEVELS,
  THEMES,
} from '../game/levels';
import {
  ACHIEVEMENTS,
  computeMasterySummary,
  getTotalEarnedStars,
  isPaperStyleUnlocked,
  PAPER_STYLE_ORDER,
  PAPER_STYLES,
  StampMotif,
} from '../game/mastery';
import {
  ClassicThemeId,
  Direction,
  PaperColor,
  PaperStyleId,
  SavedProgress,
} from '../game/types';
import { formatStopwatchMs } from './Modals';
import { BauhausNoteArrow } from './StickyNote';

export type StudioArchiveTab = 'gallery' | 'stats' | 'styles';

interface StudioArchiveModalProps {
  progress: SavedProgress;
  initialTab?: StudioArchiveTab;
  onSelectPaperStyle: (styleId: PaperStyleId) => void;
  onClose: () => void;
}

const PACK_SWATCH_BG: Record<ClassicThemeId, string> = {
  fridge: '#f5f0e2',
  cork: '#e4b43c',
  drafting: '#1e6b64',
  midnight: '#181b24',
  atelier: '#d6302a',
  gallery: '#2b56a3',
};

/**
 * Bespoke minimalist Bauhaus exhibition poster stamp SVG for each achievement.
 * Unlocked renders in vivid archival primary pigments; locked renders as a crisp wireframe study.
 */
export const BauhausPosterStamp: React.FC<{
  motif: StampMotif;
  unlocked: boolean;
  className?: string;
}> = ({ motif, unlocked, className = 'h-16 w-16' }) => {
  const red = unlocked ? '#d6302a' : '#c8c1b0';
  const ochre = unlocked ? '#e4b43c' : '#d5cfc0';
  const blue = unlocked ? '#2b56a3' : '#b8b09f';
  const ink = unlocked ? '#111111' : '#57534a';
  const paper = unlocked ? '#faf6ea' : '#ebe4d3';

  return (
    <svg viewBox="0 0 72 72" fill="none" aria-hidden="true" className={className}>
      <rect x="1.5" y="1.5" width="69" height="69" fill={paper} stroke={ink} strokeWidth="3" />

      {motif === 'circle-red' && (
        <>
          <line x1="36" y1="2" x2="36" y2="70" stroke={ink} strokeWidth="2.5" />
          <line x1="2" y1="48" x2="70" y2="48" stroke={ink} strokeWidth="2.5" />
          <rect x="2" y="48" width="34" height="22" fill={blue} stroke={ink} strokeWidth="2" />
          <circle cx="36" cy="30" r="17" fill={red} stroke={ink} strokeWidth="2.6" />
          <rect x="44" y="54" width="18" height="10" fill={ochre} stroke={ink} strokeWidth="2" />
        </>
      )}

      {motif === 'grid-stars' && (
        <>
          <rect x="10" y="10" width="24" height="24" fill={ochre} stroke={ink} strokeWidth="2.4" />
          <rect x="38" y="10" width="24" height="24" fill={red} stroke={ink} strokeWidth="2.4" />
          <rect x="10" y="38" width="24" height="24" fill={blue} stroke={ink} strokeWidth="2.4" />
          <polygon points="50,39 62,61 38,61" fill={ochre} stroke={ink} strokeWidth="2.4" />
        </>
      )}

      {motif === 'arrow-chain' && (
        <>
          <rect x="2" y="2" width="68" height="22" fill={ochre} stroke={ink} strokeWidth="2" />
          <path d="M12 13H54M44 6L55 13L44 20" stroke={ink} strokeWidth="3.5" strokeLinejoin="miter" />
          <rect x="2" y="24" width="68" height="22" fill={red} stroke={ink} strokeWidth="2" />
          <path d="M60 35H18M28 28L17 35L28 42" stroke={paper} strokeWidth="3.5" strokeLinejoin="miter" />
          <rect x="2" y="46" width="68" height="24" fill={blue} stroke={ink} strokeWidth="2" />
          <path d="M14 58H56M46 51L57 58L46 65" stroke={ochre} strokeWidth="3.5" strokeLinejoin="miter" />
        </>
      )}

      {motif === 'sun-calendar' && (
        <>
          <rect x="2" y="2" width="68" height="18" fill={red} stroke={ink} strokeWidth="2" />
          <circle cx="36" cy="45" r="16" fill={ochre} stroke={ink} strokeWidth="2.6" />
          <path d="M20 45H52M36 29V61" stroke={ink} strokeWidth="2.2" />
          <rect x="14" y="7" width="8" height="8" fill={paper} stroke={ink} strokeWidth="1.8" />
          <rect x="50" y="7" width="8" height="8" fill={paper} stroke={ink} strokeWidth="1.8" />
        </>
      )}

      {motif === 'wax-seal' && (
        <>
          <polygon points="24,42 18,68 31,61 36,68 36,44" fill={red} stroke={ink} strokeWidth="2.2" />
          <polygon points="48,42 54,68 41,61 36,68 36,44" fill={blue} stroke={ink} strokeWidth="2.2" />
          <circle cx="36" cy="29" r="19" fill={ochre} stroke={ink} strokeWidth="2.6" />
          <polygon
            points="36,16 39.5,24 48,25 41.5,31 43,39.5 36,35 29,39.5 30.5,31 24,25 32.5,24"
            fill={paper}
            stroke={ink}
            strokeWidth="2"
          />
        </>
      )}

      {motif === 'clock-arc' && (
        <>
          <circle cx="36" cy="36" r="24" fill={paper} stroke={ink} strokeWidth="2.8" />
          <path d="M36 12 A24 24 0 0 1 60 36 L36 36 Z" fill={red} stroke={ink} strokeWidth="2.2" />
          <path d="M36 36 L60 36 A24 24 0 0 1 36 60 Z" fill={ochre} stroke={ink} strokeWidth="2.2" />
          <line x1="36" y1="36" x2="36" y2="18" stroke={ink} strokeWidth="3.2" />
          <line x1="36" y1="36" x2="49" y2="36" stroke={ink} strokeWidth="3.2" />
          <circle cx="36" cy="36" r="3.5" fill={ink} />
        </>
      )}

      {motif === 'stack-bars' && (
        <>
          <rect x="10" y="44" width="52" height="16" fill={blue} stroke={ink} strokeWidth="2.4" />
          <rect x="16" y="28" width="46" height="16" fill={ochre} stroke={ink} strokeWidth="2.4" />
          <rect x="22" y="12" width="40" height="16" fill={red} stroke={ink} strokeWidth="2.4" />
        </>
      )}

      {motif === 'monolith-tower' && (
        <>
          <rect x="10" y="10" width="16" height="52" fill={ink} />
          <rect x="30" y="20" width="16" height="42" fill={red} stroke={ink} strokeWidth="2.4" />
          <rect x="50" y="32" width="12" height="30" fill={ochre} stroke={ink} strokeWidth="2.4" />
          <circle cx="56" cy="18" r="7" fill={blue} stroke={ink} strokeWidth="2.4" />
        </>
      )}

      {motif === 'infinity-loop' && (
        <>
          <rect x="2" y="2" width="68" height="34" fill={blue} stroke={ink} strokeWidth="2" />
          <circle cx="24" cy="36" r="14" fill={ochre} stroke={ink} strokeWidth="2.8" />
          <circle cx="48" cy="36" r="14" fill={red} stroke={ink} strokeWidth="2.8" />
          <circle cx="24" cy="36" r="5" fill={paper} stroke={ink} strokeWidth="2" />
          <circle cx="48" cy="36" r="5" fill={paper} stroke={ink} strokeWidth="2" />
        </>
      )}

      {motif === 'split-diamond' && (
        <>
          <rect x="2" y="2" width="34" height="34" fill={ochre} stroke={ink} strokeWidth="2" />
          <rect x="36" y="36" width="34" height="34" fill={blue} stroke={ink} strokeWidth="2" />
          <polygon points="36,10 62,36 36,62 10,36" fill={red} stroke={ink} strokeWidth="2.6" />
          <rect x="29" y="29" width="14" height="14" fill={paper} stroke={ink} strokeWidth="2.2" />
        </>
      )}

      {motif === 'atelier-press' && (
        <>
          <rect x="2" y="2" width="68" height="68" fill={red} stroke={ink} strokeWidth="2" />
          <polygon points="2,70 70,2 70,70" fill={ink} />
          <circle cx="28" cy="28" r="15" fill={ochre} stroke={ink} strokeWidth="2.6" />
          <rect x="40" y="40" width="20" height="20" fill={paper} stroke={ink} strokeWidth="2.4" />
        </>
      )}

      {motif === 'gallery-crown' && (
        <>
          <rect x="2" y="2" width="68" height="68" fill={blue} stroke={ink} strokeWidth="2" />
          <polygon points="12,56 12,24 27,38 36,18 45,38 60,24 60,56" fill={ochre} stroke={ink} strokeWidth="2.6" strokeLinejoin="miter" />
          <rect x="12" y="56" width="48" height="8" fill={red} stroke={ink} strokeWidth="2.4" />
        </>
      )}
    </svg>
  );
};

const PREVIEW_TRIO: { color: PaperColor; dir: Direction }[] = [
  { color: 'canary', dir: 'U' },
  { color: 'coral', dir: 'R' },
  { color: 'sky', dir: 'D' },
  { color: 'mint', dir: 'L' },
];

export const StudioArchiveModal: React.FC<StudioArchiveModalProps> = ({
  progress,
  initialTab = 'gallery',
  onSelectPaperStyle,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StudioArchiveTab>(initialTab);
  const totalStars = useMemo(() => getTotalEarnedStars(progress), [progress]);
  const summary = useMemo(() => computeMasterySummary(progress), [progress]);

  const achievementRows = useMemo(
    () =>
      ACHIEVEMENTS.map((def) => {
        const res = def.evaluate(progress, totalStars);
        const unlocked = res.unlocked || progress.unlockedAchievements.includes(def.id);
        return {
          def,
          unlocked,
          current: unlocked ? res.target : res.current,
          target: res.target,
        };
      }),
    [progress, totalStars]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bauhaus Studio Archive"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-lg flex-col overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[8px_8px_0_#111111] sm:max-h-[min(88dvh,660px)] sm:max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bauhaus Primary Tri-Band */}
        <div aria-hidden="true" className="grid h-2.5 shrink-0 grid-cols-3 border-b-2 border-[#111111]">
          <div className="border-r-2 border-[#111111] bg-[#d6302a]" />
          <div className="border-r-2 border-[#111111] bg-[#e4b43c]" />
          <div className="bg-[#2b56a3]" />
        </div>

        {/* Pinned Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-[#111111] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="font-display truncate text-lg font-black tracking-tight uppercase leading-tight sm:text-xl">
              Studio Archive
            </h2>
            <p className="font-mono-num truncate text-[11px] font-bold text-[#111111]/70">
              {summary.unlockedAchievementsCount}/{summary.totalAchievementsCount} Stamps ·{' '}
              {summary.totalStars}/{summary.maxStars} ★ · {summary.unlockedStylesCount}/
              {summary.totalStylesCount} Styles
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close studio archive"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#faf6ea] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:bg-[#d6302a] hover:text-[#faf6ea]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pinned 3-Tab Bauhaus Navigation Bar */}
        <div className="grid shrink-0 grid-cols-3 border-b-2 border-[#111111] bg-[#ece5d2]">
          {(
            [
              { id: 'gallery', label: 'Gallery', icon: Award },
              { id: 'stats', label: 'Mastery', icon: BarChart3 },
              { id: 'styles', label: 'Styles', icon: Palette },
            ] as const
          ).map(({ id, label, icon: Icon }, idx) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveTab(id);
                }}
                className={`font-display flex cursor-pointer items-center justify-center gap-1.5 py-2.5 text-xs font-black tracking-wider uppercase transition sm:text-sm ${
                  idx < 2 ? 'border-r-2 border-[#111111]' : ''
                } ${
                  active
                    ? 'bg-[#111111] text-[#e4b43c]'
                    : 'bg-transparent text-[#111111] hover:bg-[#faf6ea]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {/* ===============================================================
              TAB 1: BAUHAUS GALLERY / ACHIEVEMENT POSTER STAMPS
             =============================================================== */}
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {achievementRows.map(({ def, unlocked, current, target }) => {
                const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                return (
                  <div
                    key={def.id}
                    className={`flex items-start gap-3 border-2 border-[#111111] p-3 transition ${
                      unlocked
                        ? 'bg-[#faf6ea] shadow-[3px_3px_0_#111111]'
                        : 'bg-[#ebe4d3]/80 opacity-85'
                    }`}
                  >
                    <BauhausPosterStamp
                      motif={def.motif}
                      unlocked={unlocked}
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono-num text-[10px] font-bold tracking-wider opacity-60">
                          {def.code}
                        </span>
                        {unlocked ? (
                          <span className="font-display border border-[#111111] bg-[#e4b43c] px-1.5 py-0.5 text-[9px] font-black uppercase leading-none">
                            Stamped
                          </span>
                        ) : (
                          <Lock className="h-3 w-3 opacity-55" />
                        )}
                      </div>
                      <h3 className="font-display mt-0.5 truncate text-sm font-black uppercase">
                        {def.title}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#111111]/75">
                        {def.description}
                      </p>

                      {/* Progress Rule */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden border border-[#111111] bg-[#f5f0e2]">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full transition-all duration-300 ${
                              unlocked ? 'bg-[#d6302a]' : 'bg-[#2b56a3]'
                            }`}
                          />
                        </div>
                        <span className="font-mono-num shrink-0 text-[10px] font-extrabold">
                          {current}/{target}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===============================================================
              TAB 2: COMPACT BAUHAUS STATS & MASTERY SHEET
             =============================================================== */}
          {activeTab === 'stats' && (
            <div className="flex flex-col gap-4">
              {/* Primary 4-Cell Mondrian Stat Grid */}
              <div className="grid grid-cols-2 border-2 border-[#111111] bg-[#faf6ea] shadow-[4px_4px_0_#111111]">
                <div className="border-r-2 border-b-2 border-[#111111] p-3.5">
                  <div className="text-[10px] font-extrabold tracking-wider uppercase opacity-65">
                    Sheets Peeled
                  </div>
                  <div className="font-mono-num mt-1 text-2xl font-black text-[#111111] sm:text-3xl">
                    {summary.totalSheetsPeeled.toLocaleString()}
                  </div>
                  <div className="font-mono-num mt-0.5 text-[11px] font-bold opacity-65">
                    {summary.totalWallsCleared} walls cleared
                  </div>
                </div>

                <div className="border-b-2 border-[#111111] bg-[#e4b43c]/35 p-3.5">
                  <div className="text-[10px] font-extrabold tracking-wider uppercase opacity-70">
                    Spotless Rate
                  </div>
                  <div className="font-mono-num mt-1 text-2xl font-black text-[#111111] sm:text-3xl">
                    {summary.spotlessRatePct}%
                  </div>
                  <div className="font-mono-num mt-0.5 text-[11px] font-bold opacity-70">
                    {summary.spotlessClears} zero-bump wins
                  </div>
                </div>

                <div className="border-r-2 border-[#111111] p-3.5">
                  <div className="text-[10px] font-extrabold tracking-wider uppercase opacity-65">
                    Longest Streak
                  </div>
                  <div className="font-mono-num mt-1 text-2xl font-black text-[#d6302a] sm:text-3xl">
                    ×{summary.longestCleanStreak}
                  </div>
                  <div className="font-mono-num mt-0.5 text-[11px] font-bold opacity-65">
                    Daily {summary.dailyStreak}d · Endless #{summary.endlessBestStreak}
                  </div>
                </div>

                <div className="p-3.5">
                  <div className="text-[10px] font-extrabold tracking-wider uppercase opacity-65">
                    Favorite Pack
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {summary.favoritePackId && (
                      <span
                        aria-hidden="true"
                        style={{
                          backgroundColor: PACK_SWATCH_BG[THEMES[summary.favoritePackId].visualBase],
                        }}
                        className="h-5 w-5 shrink-0 border-2 border-[#111111]"
                      />
                    )}
                    <span className="font-display truncate text-lg font-black uppercase leading-tight sm:text-xl">
                      {summary.favoritePackName}
                    </span>
                  </div>
                  <div className="font-mono-num mt-0.5 text-[11px] font-bold opacity-65">
                    {summary.favoritePackClears > 0
                      ? `${summary.favoritePackClears} clears logged`
                      : 'Clear a wall to set'}
                  </div>
                </div>
              </div>

              {/* Fastest Time Attack Clears */}
              <div className="border-2 border-[#111111] bg-[#faf6ea] shadow-[3px_3px_0_#111111]">
                <div className="flex items-center justify-between border-b-2 border-[#111111] bg-[#2b56a3] px-3.5 py-2 text-[#faf6ea]">
                  <div className="font-display flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Fastest Time Attack Clears</span>
                  </div>
                  <span className="font-mono-num text-[10px] font-bold opacity-85">TOP 4</span>
                </div>

                {summary.fastestClears.length > 0 ? (
                  <div className="divide-y divide-[#111111]/20">
                    {summary.fastestClears.map((entry, idx) => (
                      <div
                        key={entry.levelId}
                        className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-mono-num flex h-5 w-5 shrink-0 items-center justify-center border border-[#111111] bg-[#e4b43c] text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="font-display truncate font-extrabold uppercase">
                            {entry.title}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold opacity-60">
                            {entry.packName}
                          </span>
                        </div>
                        <span className="font-mono-num shrink-0 font-black text-[#d6302a]">
                          {formatStopwatchMs(entry.timeMs)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-3.5 py-3 text-xs font-semibold opacity-70">
                    Toggle <span className="font-extrabold uppercase">Time Attack</span> above the
                    board and clear a wall to record your fastest times.
                  </div>
                )}
              </div>

              {/* Pack Mastery Breakdown (Classic 6 + Studio Lab 6) */}
              <div className="border-2 border-[#111111] bg-[#faf6ea] p-3.5 shadow-[3px_3px_0_#111111]">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="font-display text-xs font-black tracking-wider uppercase">
                    Category Mastery
                  </span>
                  <span className="font-mono-num text-xs font-extrabold">
                    {summary.totalStars}/{summary.maxStars} ★
                  </span>
                </div>

                <div className="mb-1.5 text-[10px] font-extrabold tracking-wider uppercase opacity-65">
                  Classic Mode
                </div>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CLASSIC_THEME_ORDER.map((id) => {
                    const cleared = getPackClearedCount(id, progress.records);
                    const total = PACK_LEVELS[id].length;
                    const pct = Math.round((cleared / total) * 100);
                    return (
                      <div key={id} className="border border-[#111111] bg-[#f5f0e2] p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              style={{ backgroundColor: PACK_SWATCH_BG[THEMES[id].visualBase] }}
                              className="h-3 w-3 shrink-0 border border-[#111111]"
                            />
                            <span className="font-display truncate text-[11px] font-extrabold uppercase">
                              {THEMES[id].shortName}
                            </span>
                          </div>
                          <span className="font-mono-num text-[10px] font-bold">
                            {cleared}/{total}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden border border-[#111111] bg-white">
                          <div style={{ width: `${pct}%` }} className="h-full bg-[#111111]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-1.5 text-[10px] font-extrabold tracking-wider text-[#2b56a3] uppercase">
                  Studio Lab
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LAB_THEME_ORDER.map((id) => {
                    const cleared = getPackClearedCount(id, progress.records);
                    const total = PACK_LEVELS[id].length;
                    const pct = Math.round((cleared / total) * 100);
                    return (
                      <div key={id} className="border border-[#111111] bg-[#f5f0e2] p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              style={{ backgroundColor: PACK_SWATCH_BG[THEMES[id].visualBase] }}
                              className="h-3 w-3 shrink-0 border border-[#111111]"
                            />
                            <span className="font-display truncate text-[11px] font-extrabold uppercase">
                              {THEMES[id].shortName}
                            </span>
                          </div>
                          <span className="font-mono-num text-[10px] font-bold">
                            {cleared}/{total}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden border border-[#111111] bg-white">
                          <div style={{ width: `${pct}%` }} className="h-full bg-[#2b56a3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 3: UNLOCKABLE ARROW / PAPER PRINT STYLES (UNLOCKED BY STARS)
             =============================================================== */}
          {activeTab === 'styles' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-2 border-[#111111] bg-[#e4b43c]/40 px-3.5 py-2 text-xs font-bold">
                <span>Earn stars across packs to unlock archival paper & arrow editions.</span>
                <span className="font-mono-num flex shrink-0 items-center gap-1 font-black">
                  <Star className="h-3.5 w-3.5 fill-[#111111] text-[#111111]" />
                  {totalStars}
                </span>
              </div>

              {PAPER_STYLE_ORDER.map((styleId) => {
                const meta = PAPER_STYLES[styleId];
                const unlocked = isPaperStyleUnlocked(styleId, totalStars);
                const equipped = progress.paperStyle === styleId;

                return (
                  <div
                    key={styleId}
                    className={`flex flex-col gap-3 border-2 border-[#111111] p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                      equipped
                        ? 'bg-[#faf6ea] shadow-[4px_4px_0_#d6302a]'
                        : unlocked
                          ? 'bg-[#faf6ea] shadow-[3px_3px_0_#111111]'
                          : 'bg-[#ebe4d3]/85 opacity-85'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Live Mini 4-Note Style Preview */}
                      <div
                        className={`${meta.cssClass} grid h-16 w-16 shrink-0 grid-cols-2 gap-1 border-2 border-[#111111] bg-[#f5f0e2] p-1`}
                      >
                        {PREVIEW_TRIO.map((sample) => (
                          <div
                            key={sample.color}
                            style={{ backgroundColor: meta.paperHex[sample.color] }}
                            className="flex items-center justify-center border border-[#111111]"
                          >
                            <BauhausNoteArrow
                              dir={sample.dir}
                              variant={meta.arrowVariant}
                              fill={meta.arrowFill[sample.color]}
                              stroke={meta.arrowStroke[sample.color]}
                              className="h-4.5 w-4.5"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-num text-[10px] font-bold opacity-60">
                            {meta.edition}
                          </span>
                          {!unlocked && (
                            <span className="font-mono-num flex items-center gap-0.5 text-[10px] font-extrabold text-[#d6302a]">
                              <Star className="h-3 w-3 fill-current" />
                              {totalStars}/{meta.requiredStars}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-base font-black uppercase leading-tight">
                          {meta.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-medium leading-snug text-[#111111]/75">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    {/* Equip / Locked Action */}
                    <div className="shrink-0">
                      {unlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onSelectPaperStyle(styleId);
                          }}
                          className={`font-display flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 border-2 border-[#111111] px-3.5 text-xs font-black uppercase shadow-[2px_2px_0_#111111] transition active:translate-x-[1px] active:translate-y-[1px] sm:w-28 ${
                            equipped
                              ? 'bg-[#111111] text-[#e4b43c]'
                              : 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]'
                          }`}
                        >
                          {equipped ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Equipped</span>
                            </>
                          ) : (
                            <span>Equip</span>
                          )}
                        </button>
                      ) : (
                        <div className="font-mono-num flex h-9 w-full items-center justify-center gap-1.5 border-2 border-[#111111] bg-[#dfd8c5] px-3 text-xs font-extrabold text-[#111111]/70 uppercase sm:w-28">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span>{meta.requiredStars} ★</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
