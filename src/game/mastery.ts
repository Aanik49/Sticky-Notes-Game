import { isPackCompleted, PACK_LEVELS, THEME_ORDER, THEMES } from './levels';
import { PaperColor, PaperStyleId, SavedProgress, ThemeId } from './types';

/* =========================================================================
   1. UNLOCKABLE BAUHAUS ARROW & PAPER PRINT STYLES (UNLOCKED BY STARS)
   ========================================================================= */

export interface PaperStyleMeta {
  id: PaperStyleId;
  name: string;
  edition: string;
  description: string;
  requiredStars: number;
  cssClass: string;
  arrowVariant: 'block' | 'technical' | 'double' | 'foil';
  paperHex: Record<PaperColor, string>;
  arrowFill: Record<PaperColor, string>;
  arrowStroke: Record<PaperColor, string>;
  foldFill: Record<PaperColor, string>;
  cornerReveal: string;
}

export const PAPER_STYLE_ORDER: PaperStyleId[] = [
  'primary',
  'mono',
  'blueprint',
  'risograph',
  'goldfoil',
];

export const PAPER_STYLES: Record<PaperStyleId, PaperStyleMeta> = {
  primary: {
    id: 'primary',
    name: 'Primary Print',
    edition: 'EDITION 01',
    description: 'Classic Bauhaus ochre, vermilion, cobalt & archival cream stock.',
    requiredStars: 0,
    cssClass: 'style-primary',
    arrowVariant: 'block',
    paperHex: {
      canary: '#e4b43c',
      coral: '#d6302a',
      sky: '#2b56a3',
      mint: '#f3eee0',
      apricot: '#dc6b2f',
      lavender: '#1e6b64',
    },
    arrowFill: {
      canary: '#d6302a',
      coral: '#e4b43c',
      sky: '#f5f0e2',
      mint: '#2b56a3',
      apricot: '#f5f0e2',
      lavender: '#e4b43c',
    },
    arrowStroke: {
      canary: '#111111',
      coral: '#111111',
      sky: '#111111',
      mint: '#111111',
      apricot: '#111111',
      lavender: '#111111',
    },
    foldFill: {
      canary: '#c99724',
      coral: '#ad211c',
      sky: '#1d3f7a',
      mint: '#dad3c1',
      apricot: '#b8511b',
      lavender: '#144e49',
    },
    cornerReveal: '#f5f0e2',
  },

  mono: {
    id: 'mono',
    name: 'Mono Ink',
    edition: 'EDITION 02',
    description: 'Stark archival bone, graphite, and charcoal press blocks with bold ink arrows.',
    requiredStars: 15,
    cssClass: 'style-mono',
    arrowVariant: 'double',
    paperHex: {
      canary: '#f7f4ec',
      coral: '#1c1c1e',
      sky: '#4b4d52',
      mint: '#e3ded1',
      apricot: '#b8b2a6',
      lavender: '#2f3136',
    },
    arrowFill: {
      canary: '#111111',
      coral: '#f7f4ec',
      sky: '#f7f4ec',
      mint: '#111111',
      apricot: '#111111',
      lavender: '#e3ded1',
    },
    arrowStroke: {
      canary: '#111111',
      coral: '#111111',
      sky: '#111111',
      mint: '#111111',
      apricot: '#111111',
      lavender: '#111111',
    },
    foldFill: {
      canary: '#d6d1c4',
      coral: '#09090a',
      sky: '#323438',
      mint: '#c5bfb0',
      apricot: '#948e82',
      lavender: '#1a1b1f',
    },
    cornerReveal: '#ece8dc',
  },

  blueprint: {
    id: 'blueprint',
    name: 'Blueprint White',
    edition: 'EDITION 03',
    description: 'Architectural Prussian cyan sheets ruled with crisp white drafting vectors.',
    requiredStars: 45,
    cssClass: 'style-blueprint',
    arrowVariant: 'technical',
    paperHex: {
      canary: '#184e8c',
      coral: '#0f3666',
      sky: '#256bb5',
      mint: '#eaf3fb',
      apricot: '#1d5fa3',
      lavender: '#11294d',
    },
    arrowFill: {
      canary: '#ffffff',
      coral: '#93c5fd',
      sky: '#ffffff',
      mint: '#184e8c',
      apricot: '#dbeafe',
      lavender: '#ffffff',
    },
    arrowStroke: {
      canary: '#0b2240',
      coral: '#07172e',
      sky: '#0b2240',
      mint: '#0b2240',
      apricot: '#0b2240',
      lavender: '#07172e',
    },
    foldFill: {
      canary: '#103869',
      coral: '#092245',
      sky: '#184e8c',
      mint: '#c6dcf0',
      apricot: '#134275',
      lavender: '#081830',
    },
    cornerReveal: '#eaf3fb',
  },

  risograph: {
    id: 'risograph',
    name: 'Risograph Pop',
    edition: 'EDITION 04',
    description: 'Overprinted fluorescent coral, electric cobalt, lemon & emerald studio inks.',
    requiredStars: 90,
    cssClass: 'style-risograph',
    arrowVariant: 'block',
    paperHex: {
      canary: '#f7d53b',
      coral: '#e83b6e',
      sky: '#1d62d8',
      mint: '#2cb67d',
      apricot: '#ff6b35',
      lavender: '#faf3e3',
    },
    arrowFill: {
      canary: '#1d62d8',
      coral: '#f7d53b',
      sky: '#faf3e3',
      mint: '#faf3e3',
      apricot: '#111111',
      lavender: '#e83b6e',
    },
    arrowStroke: {
      canary: '#111111',
      coral: '#111111',
      sky: '#111111',
      mint: '#111111',
      apricot: '#111111',
      lavender: '#111111',
    },
    foldFill: {
      canary: '#d4b21c',
      coral: '#bf2252',
      sky: '#1447a3',
      mint: '#1d8f60',
      apricot: '#d64c1a',
      lavender: '#e0d6c1',
    },
    cornerReveal: '#faf3e3',
  },

  goldfoil: {
    id: 'goldfoil',
    name: 'Gold Foil',
    edition: 'EDITION 05',
    description: 'Collector museum press: obsidian black, ivory & stamped 24k Bauhaus gold.',
    requiredStars: 150,
    cssClass: 'style-goldfoil',
    arrowVariant: 'foil',
    paperHex: {
      canary: '#d9a426',
      coral: '#161618',
      sky: '#25262c',
      mint: '#f7f1e1',
      apricot: '#b8861b',
      lavender: '#2d2417',
    },
    arrowFill: {
      canary: '#141416',
      coral: '#f5cb5c',
      sky: '#f5cb5c',
      mint: '#c9931a',
      apricot: '#faf5e6',
      lavender: '#f5cb5c',
    },
    arrowStroke: {
      canary: '#111111',
      coral: '#111111',
      sky: '#111111',
      mint: '#111111',
      apricot: '#111111',
      lavender: '#111111',
    },
    foldFill: {
      canary: '#a87a13',
      coral: '#08080a',
      sky: '#14151a',
      mint: '#ded3b8',
      apricot: '#8c620c',
      lavender: '#1a140c',
    },
    cornerReveal: '#f7f1e1',
  },
};

export function getTotalEarnedStars(progress: SavedProgress): number {
  return THEME_ORDER.reduce((sum, packId) => {
    const packStars = PACK_LEVELS[packId].reduce(
      (acc, lvl) => acc + (progress.records[lvl.id]?.stars ?? 0),
      0
    );
    return sum + packStars;
  }, 0);
}

export function getTotalPossibleStars(): number {
  return THEME_ORDER.reduce((sum, packId) => sum + PACK_LEVELS[packId].length * 3, 0);
}

export function isPaperStyleUnlocked(styleId: PaperStyleId, totalStars: number): boolean {
  return totalStars >= PAPER_STYLES[styleId].requiredStars;
}

/* =========================================================================
   2. BAUHAUS GALLERY / ACHIEVEMENTS (12 MINIMALIST POSTER STAMPS)
   ========================================================================= */

export type StampMotif =
  | 'circle-red'
  | 'grid-stars'
  | 'split-diamond'
  | 'arrow-chain'
  | 'stack-bars'
  | 'monolith-tower'
  | 'sun-calendar'
  | 'wax-seal'
  | 'clock-arc'
  | 'infinity-loop'
  | 'atelier-press'
  | 'gallery-crown';

export interface AchievementDef {
  id: string;
  code: string;
  title: string;
  description: string;
  motif: StampMotif;
  evaluate: (progress: SavedProgress, totalStars: number) => {
    unlocked: boolean;
    current: number;
    target: number;
  };
}

function getFastestTimeAttackMs(progress: SavedProgress): number | null {
  let fastest: number | null = null;
  for (const rec of Object.values(progress.records)) {
    if (rec.bestTimeMs !== undefined && (fastest === null || rec.bestTimeMs < fastest)) {
      fastest = rec.bestTimeMs;
    }
  }
  for (const rec of Object.values(progress.dailyRecords)) {
    if (rec.bestTimeMs !== undefined && (fastest === null || rec.bestTimeMs < fastest)) {
      fastest = rec.bestTimeMs;
    }
  }
  return fastest;
}

function getPackClearedCountSafe(packId: ThemeId, progress: SavedProgress): number {
  return PACK_LEVELS[packId].filter((lvl) => Boolean(progress.records[lvl.id])).length;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-study',
    code: 'NO.01',
    title: 'First Study',
    description: 'Clear your very first sticky note wall.',
    motif: 'circle-red',
    evaluate: (p) => {
      const val = Math.max(p.stats.totalWallsCleared, Object.keys(p.records).length);
      return { unlocked: val >= 1, current: Math.min(val, 1), target: 1 };
    },
  },
  {
    id: 'spotless-10',
    code: 'NO.02',
    title: 'Pure Geometry',
    description: 'Complete 10 spotless 3-star walls with zero bumps.',
    motif: 'grid-stars',
    evaluate: (p) => {
      const recordSpotless =
        Object.values(p.records).filter((r) => r.stars === 3).length +
        Object.values(p.dailyRecords).filter((r) => r.stars === 3).length;
      const val = Math.max(p.stats.spotlessClears, recordSpotless);
      return { unlocked: val >= 10, current: Math.min(val, 10), target: 10 };
    },
  },
  {
    id: 'streak-15',
    code: 'NO.03',
    title: 'Chain Kinetic',
    description: 'Reach a ×15 clean peel combo streak in a single wall.',
    motif: 'arrow-chain',
    evaluate: (p) => {
      const val = p.stats.longestCleanStreak;
      return { unlocked: val >= 15, current: Math.min(val, 15), target: 15 };
    },
  },
  {
    id: 'daily-streak-7',
    code: 'NO.04',
    title: 'Weekly Ritual',
    description: 'Maintain a 7-day Daily Wall streak.',
    motif: 'sun-calendar',
    evaluate: (p) => {
      const val = p.dailyStreak;
      return { unlocked: val >= 7, current: Math.min(val, 7), target: 7 };
    },
  },
  {
    id: 'daily-missions-3',
    code: 'NO.05',
    title: 'Sealed Edition',
    description: 'Earn 3 Daily Mission reward seals.',
    motif: 'wax-seal',
    evaluate: (p) => {
      const dailySeals = Object.values(p.dailyRecords).filter(
        (r) => r.dailyMissionCompleted
      ).length;
      const val = Math.max(p.stats.dailyMissionsCompleted, dailySeals);
      return { unlocked: val >= 3, current: Math.min(val, 3), target: 3 };
    },
  },
  {
    id: 'speed-15s',
    code: 'NO.06',
    title: 'Kinetic Clock',
    description: 'Clear any wall in under 15.0s with Time Attack enabled.',
    motif: 'clock-arc',
    evaluate: (p) => {
      const fastest = getFastestTimeAttackMs(p);
      const ok = fastest !== null && fastest < 15_000;
      return { unlocked: ok, current: ok ? 1 : 0, target: 1 };
    },
  },
  {
    id: 'sheets-250',
    code: 'NO.07',
    title: 'Paper Cascade',
    description: 'Peel 250 sticky note sheets across all modes.',
    motif: 'stack-bars',
    evaluate: (p) => {
      const val = p.stats.totalSheetsPeeled;
      return { unlocked: val >= 250, current: Math.min(val, 250), target: 250 };
    },
  },
  {
    id: 'sheets-1000',
    code: 'NO.08',
    title: 'Grand Archive',
    description: 'Peel 1,000 sticky note sheets across all modes.',
    motif: 'monolith-tower',
    evaluate: (p) => {
      const val = p.stats.totalSheetsPeeled;
      return { unlocked: val >= 1000, current: Math.min(val, 1000), target: 1000 };
    },
  },
  {
    id: 'endless-10',
    code: 'NO.09',
    title: 'Infinite Grid',
    description: 'Clear 10 walls in Endless mode.',
    motif: 'infinity-loop',
    evaluate: (p) => {
      const val = p.endlessBestStreak;
      return { unlocked: val >= 10, current: Math.min(val, 10), target: 10 };
    },
  },
  {
    id: 'clear-fridge',
    code: 'NO.10',
    title: 'Kitchen Folio',
    description: 'Clear all 18 walls in the Fridge pack.',
    motif: 'split-diamond',
    evaluate: (p) => {
      const cleared = getPackClearedCountSafe('fridge', p);
      return { unlocked: isPackCompleted('fridge', p.records), current: cleared, target: 18 };
    },
  },
  {
    id: 'clear-atelier',
    code: 'NO.11',
    title: 'Atelier Proof',
    description: 'Clear all 18 walls in the Vermilion Atelier pack.',
    motif: 'atelier-press',
    evaluate: (p) => {
      const cleared = getPackClearedCountSafe('atelier', p);
      return { unlocked: isPackCompleted('atelier', p.records), current: cleared, target: 18 };
    },
  },
  {
    id: 'clear-gallery',
    code: 'NO.12',
    title: 'Gallery Curator',
    description: 'Clear all 18 walls in the Cobalt Gallery pack.',
    motif: 'gallery-crown',
    evaluate: (p) => {
      const cleared = getPackClearedCountSafe('gallery', p);
      return { unlocked: isPackCompleted('gallery', p.records), current: cleared, target: 18 };
    },
  },
];

export function getCurrentlyUnlockedAchievementIds(progress: SavedProgress): string[] {
  const totalStars = getTotalEarnedStars(progress);
  return ACHIEVEMENTS.filter((a) => a.evaluate(progress, totalStars).unlocked).map((a) => a.id);
}

/* =========================================================================
   3. STATS & MASTERY SUMMARY COMPUTATION
   ========================================================================= */

export interface FastestClearEntry {
  levelId: string;
  title: string;
  packName: string;
  timeMs: number;
}

export interface MasterySummary {
  totalSheetsPeeled: number;
  totalWallsCleared: number;
  spotlessClears: number;
  spotlessRatePct: number;
  longestCleanStreak: number;
  totalStars: number;
  maxStars: number;
  dailyStreak: number;
  dailyMissionsCompleted: number;
  endlessBestStreak: number;
  favoritePackId: ThemeId | null;
  favoritePackName: string;
  favoritePackClears: number;
  fastestClears: FastestClearEntry[];
  unlockedAchievementsCount: number;
  totalAchievementsCount: number;
  unlockedStylesCount: number;
  totalStylesCount: number;
}

export function computeMasterySummary(progress: SavedProgress): MasterySummary {
  const totalStars = getTotalEarnedStars(progress);
  const maxStars = getTotalPossibleStars();

  // Backfill totals safely if user had cleared walls before stats tracking was added
  const recordedWalls =
    Object.keys(progress.records).length + Object.keys(progress.dailyRecords).length;
  const totalWallsCleared = Math.max(progress.stats.totalWallsCleared, recordedWalls);

  const recordedSpotless =
    Object.values(progress.records).filter((r) => r.stars === 3).length +
    Object.values(progress.dailyRecords).filter((r) => r.stars === 3).length;
  const spotlessClears = Math.max(progress.stats.spotlessClears, recordedSpotless);
  const spotlessRatePct =
    totalWallsCleared > 0
      ? Math.min(100, Math.round((spotlessClears / totalWallsCleared) * 100))
      : 0;

  // Favorite pack based on play clears (falls back to highest pack record count)
  let favoritePackId: ThemeId | null = null;
  let favoritePackClears = 0;
  for (const id of THEME_ORDER) {
    const statCount = progress.stats.packClearsCount[id] ?? 0;
    const recCount = getPackClearedCountSafe(id, progress);
    const effective = Math.max(statCount, recCount);
    if (effective > favoritePackClears) {
      favoritePackClears = effective;
      favoritePackId = id;
    }
  }

  // Fastest Time Attack clears across all campaign levels & daily walls
  const fastestEntries: FastestClearEntry[] = [];
  for (const packId of THEME_ORDER) {
    for (const lvl of PACK_LEVELS[packId]) {
      const rec = progress.records[lvl.id];
      if (rec?.bestTimeMs !== undefined) {
        fastestEntries.push({
          levelId: lvl.id,
          title: lvl.title,
          packName: THEMES[packId].shortName,
          timeMs: rec.bestTimeMs,
        });
      }
    }
  }
  for (const [dateKey, rec] of Object.entries(progress.dailyRecords)) {
    if (rec?.bestTimeMs !== undefined) {
      fastestEntries.push({
        levelId: `daily-${dateKey}`,
        title: `Daily · ${dateKey}`,
        packName: 'Daily',
        timeMs: rec.bestTimeMs,
      });
    }
  }
  fastestEntries.sort((a, b) => a.timeMs - b.timeMs);

  const unlockedIds = new Set([
    ...progress.unlockedAchievements,
    ...getCurrentlyUnlockedAchievementIds(progress),
  ]);
  const unlockedStylesCount = PAPER_STYLE_ORDER.filter((id) =>
    isPaperStyleUnlocked(id, totalStars)
  ).length;

  const dailySeals = Object.values(progress.dailyRecords).filter(
    (r) => r.dailyMissionCompleted
  ).length;

  return {
    totalSheetsPeeled: progress.stats.totalSheetsPeeled,
    totalWallsCleared,
    spotlessClears,
    spotlessRatePct,
    longestCleanStreak: progress.stats.longestCleanStreak,
    totalStars,
    maxStars,
    dailyStreak: progress.dailyStreak,
    dailyMissionsCompleted: Math.max(progress.stats.dailyMissionsCompleted, dailySeals),
    endlessBestStreak: progress.endlessBestStreak,
    favoritePackId,
    favoritePackName: favoritePackId ? THEMES[favoritePackId].shortName : 'None yet',
    favoritePackClears,
    fastestClears: fastestEntries.slice(0, 4),
    unlockedAchievementsCount: unlockedIds.size,
    totalAchievementsCount: ACHIEVEMENTS.length,
    unlockedStylesCount,
    totalStylesCount: PAPER_STYLE_ORDER.length,
  };
}
