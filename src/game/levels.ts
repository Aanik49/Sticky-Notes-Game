import { generateSolvableLevel, verifyLevelSolvable } from './solver';
import { LevelDef, ThemeId, ThemeMeta } from './types';

export const THEME_ORDER: ThemeId[] = ['fridge', 'cork', 'drafting', 'midnight'];

export const THEMES: Record<ThemeId, ThemeMeta> = {
  fridge: {
    id: 'fridge',
    name: 'Kitchen Fridge',
    shortName: 'Fridge',
    surfaceLabel: 'Enamel Steel Door',
    tagline: 'Sunny morning memos pinned with ceramic magnets',
    worldClass: 'world-fridge',
    boardClass: 'board-fridge',
    isDark: false,
    accentHex: '#0284c7',
    boardStamp: 'KITCHEN DOOR · PACK 01',
    fastenerType: 'magnet',
  },
  cork: {
    id: 'cork',
    name: 'Bulletin Board',
    shortName: 'Cork Board',
    surfaceLabel: 'Oak-Framed Cork',
    tagline: 'Classroom reminders tacked with colorful pushpins',
    worldClass: 'world-cork',
    boardClass: 'board-cork',
    isDark: false,
    accentHex: '#b45309',
    boardStamp: 'ROOM 204 · PACK 02',
    fastenerType: 'pushpin',
  },
  drafting: {
    id: 'drafting',
    name: 'Drafting Desk',
    shortName: 'Drafting',
    surfaceLabel: 'Self-Healing Cutting Mat',
    tagline: 'Studio layouts taped cleanly over millimeter grid lines',
    worldClass: 'world-drafting',
    boardClass: 'board-drafting',
    isDark: false,
    accentHex: '#0f766e',
    boardStamp: 'STUDIO MAT 1:50 · PACK 03',
    fastenerType: 'tape',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Studio',
    shortName: 'Midnight',
    surfaceLabel: 'Lamp-Lit Slate Pegboard',
    tagline: 'Late-night brainstorm stacks under warm desk light',
    worldClass: 'world-midnight',
    boardClass: 'board-midnight',
    isDark: true,
    accentHex: '#f59e0b',
    boardStamp: 'LATE SHIFT · PACK 04',
    fastenerType: 'clip',
  },
};

/**
 * 24 curated, progressively challenging levels across 4 themed packs (6 per pack).
 * Early levels are handcrafted for crystal-clear onboarding; deeper levels use
 * deterministic seeded reverse-peel construction with obstacles & double-stacked notes.
 */
const RAW_PACK_LEVELS: Record<ThemeId, LevelDef[]> = {
  fridge: [
    // Level 1-1: Instant clarity 3x3 warmup
    {
      id: 'fridge-1',
      packId: 'fridge',
      indexInPack: 0,
      title: 'Morning Coffee',
      difficulty: 'Warmup',
      rows: 3,
      cols: 3,
      notes: [
        { r: 0, c: 1, dir: 'R', color: 'canary' },
        { r: 0, c: 2, dir: 'R', color: 'coral' },
        { r: 1, c: 1, dir: 'U', color: 'sky' },
        { r: 1, c: 2, dir: 'L', color: 'mint' },
        { r: 2, c: 0, dir: 'R', color: 'apricot' },
        { r: 2, c: 1, dir: 'U', color: 'canary' },
      ],
    },
    // Level 1-2: 3x3 full-wall interlocking chain
    {
      id: 'fridge-2',
      packId: 'fridge',
      indexInPack: 1,
      title: 'Milk & Eggs',
      difficulty: 'Warmup',
      rows: 3,
      cols: 3,
      notes: [
        { r: 0, c: 0, dir: 'R', color: 'mint' },
        { r: 0, c: 1, dir: 'D', color: 'canary' },
        { r: 0, c: 2, dir: 'U', color: 'sky' },
        { r: 1, c: 0, dir: 'U', color: 'coral' },
        { r: 1, c: 1, dir: 'R', color: 'apricot' },
        { r: 1, c: 2, dir: 'U', color: 'lavender' },
        { r: 2, c: 0, dir: 'L', color: 'sky' },
        { r: 2, c: 1, dir: 'L', color: 'canary' },
        { r: 2, c: 2, dir: 'L', color: 'coral' },
      ],
    },
    // Level 1-3: 4x4 spiral cross
    {
      id: 'fridge-3',
      packId: 'fridge',
      indexInPack: 2,
      title: 'Grocery Run',
      difficulty: 'Clever',
      rows: 4,
      cols: 4,
      notes: [
        { r: 0, c: 1, dir: 'U', color: 'sky' },
        { r: 0, c: 2, dir: 'L', color: 'canary' },
        { r: 1, c: 0, dir: 'L', color: 'coral' },
        { r: 1, c: 1, dir: 'L', color: 'mint' },
        { r: 1, c: 2, dir: 'U', color: 'apricot' },
        { r: 1, c: 3, dir: 'R', color: 'canary' },
        { r: 2, c: 1, dir: 'U', color: 'coral' },
        { r: 2, c: 2, dir: 'R', color: 'sky' },
        { r: 3, c: 1, dir: 'D', color: 'apricot' },
        { r: 3, c: 2, dir: 'L', color: 'mint' },
      ],
    },
    // Level 1-4: 4x4 with first ceramic magnet obstacle!
    generateSolvableLevel({
      seed: 1041,
      id: 'fridge-4',
      packId: 'fridge',
      indexInPack: 3,
      title: 'Magnet Catch',
      difficulty: 'Clever',
      rows: 4,
      cols: 4,
      targetNotes: 12,
      obstacleCount: 1,
    }),
    // Level 1-5: 4x4 denser weave
    generateSolvableLevel({
      seed: 1057,
      id: 'fridge-5',
      packId: 'fridge',
      indexInPack: 4,
      title: 'Dinner Recipes',
      difficulty: 'Tricky',
      rows: 4,
      cols: 4,
      targetNotes: 14,
      obstacleCount: 1,
    }),
    // Level 1-6: 5x5 fridge finale
    generateSolvableLevel({
      seed: 1069,
      id: 'fridge-6',
      packId: 'fridge',
      indexInPack: 5,
      title: 'Sunday Pantry',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 17,
      obstacleCount: 2,
    }),
  ],

  cork: [
    // Pack 2 introduces more pushpin obstacles & tight classroom pinboards
    generateSolvableLevel({
      seed: 2011,
      id: 'cork-1',
      packId: 'cork',
      indexInPack: 0,
      title: 'Homeroom Bell',
      difficulty: 'Clever',
      rows: 4,
      cols: 4,
      targetNotes: 11,
      obstacleCount: 1,
    }),
    generateSolvableLevel({
      seed: 2029,
      id: 'cork-2',
      packId: 'cork',
      indexInPack: 1,
      title: 'Club Flyers',
      difficulty: 'Clever',
      rows: 4,
      cols: 4,
      targetNotes: 13,
      obstacleCount: 2,
    }),
    generateSolvableLevel({
      seed: 2037,
      id: 'cork-3',
      packId: 'cork',
      indexInPack: 2,
      title: 'Science Fair',
      difficulty: 'Tricky',
      rows: 4,
      cols: 4,
      targetNotes: 14,
      obstacleCount: 1,
      doubleCount: 1,
    }),
    generateSolvableLevel({
      seed: 2043,
      id: 'cork-4',
      packId: 'cork',
      indexInPack: 3,
      title: 'Hallway Notices',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 17,
      obstacleCount: 2,
      doubleCount: 1,
    }),
    generateSolvableLevel({
      seed: 2059,
      id: 'cork-5',
      packId: 'cork',
      indexInPack: 4,
      title: 'Exam Schedule',
      difficulty: 'Expert',
      rows: 5,
      cols: 5,
      targetNotes: 19,
      obstacleCount: 2,
      doubleCount: 2,
    }),
    generateSolvableLevel({
      seed: 2063,
      id: 'cork-6',
      packId: 'cork',
      indexInPack: 5,
      title: 'Faculty Wall',
      difficulty: 'Expert',
      rows: 5,
      cols: 5,
      targetNotes: 21,
      obstacleCount: 2,
      doubleCount: 2,
    }),
  ],

  drafting: [
    // Pack 3: Architect's Drafting Desk — precision stacks & tight blueprint corridors
    generateSolvableLevel({
      seed: 3013,
      id: 'drafting-1',
      packId: 'drafting',
      indexInPack: 0,
      title: 'Floor Plan A',
      difficulty: 'Clever',
      rows: 4,
      cols: 4,
      targetNotes: 13,
      obstacleCount: 1,
      doubleCount: 2,
    }),
    generateSolvableLevel({
      seed: 3027,
      id: 'drafting-2',
      packId: 'drafting',
      indexInPack: 1,
      title: 'Scale Elevations',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 17,
      obstacleCount: 2,
      doubleCount: 2,
    }),
    generateSolvableLevel({
      seed: 3039,
      id: 'drafting-3',
      packId: 'drafting',
      indexInPack: 2,
      title: 'Section Cut',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 19,
      obstacleCount: 3,
      doubleCount: 2,
    }),
    generateSolvableLevel({
      seed: 3041,
      id: 'drafting-4',
      packId: 'drafting',
      indexInPack: 3,
      title: 'Cantilever Study',
      difficulty: 'Expert',
      rows: 5,
      cols: 5,
      targetNotes: 20,
      obstacleCount: 2,
      doubleCount: 3,
    }),
    generateSolvableLevel({
      seed: 3055,
      id: 'drafting-5',
      packId: 'drafting',
      indexInPack: 4,
      title: 'Grid Masterplan',
      difficulty: 'Expert',
      rows: 6,
      cols: 6,
      targetNotes: 24,
      obstacleCount: 3,
      doubleCount: 3,
    }),
    generateSolvableLevel({
      seed: 3067,
      id: 'drafting-6',
      packId: 'drafting',
      indexInPack: 5,
      title: 'Final Blueprint',
      difficulty: 'Master',
      rows: 6,
      cols: 6,
      targetNotes: 27,
      obstacleCount: 3,
      doubleCount: 4,
    }),
  ],

  midnight: [
    // Pack 4: Midnight Studio — deep layered brainstorm walls
    generateSolvableLevel({
      seed: 4019,
      id: 'midnight-1',
      packId: 'midnight',
      indexInPack: 0,
      title: 'Desk Lamp On',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 18,
      obstacleCount: 2,
      doubleCount: 2,
    }),
    generateSolvableLevel({
      seed: 4023,
      id: 'midnight-2',
      packId: 'midnight',
      indexInPack: 1,
      title: 'Sprint Backlog',
      difficulty: 'Tricky',
      rows: 5,
      cols: 5,
      targetNotes: 20,
      obstacleCount: 2,
      doubleCount: 3,
    }),
    generateSolvableLevel({
      seed: 4031,
      id: 'midnight-3',
      packId: 'midnight',
      indexInPack: 2,
      title: 'Moodboard Stack',
      difficulty: 'Expert',
      rows: 5,
      cols: 5,
      targetNotes: 21,
      obstacleCount: 3,
      doubleCount: 4,
    }),
    generateSolvableLevel({
      seed: 4049,
      id: 'midnight-4',
      packId: 'midnight',
      indexInPack: 3,
      title: 'Two AM Spark',
      difficulty: 'Expert',
      rows: 6,
      cols: 6,
      targetNotes: 25,
      obstacleCount: 3,
      doubleCount: 4,
    }),
    generateSolvableLevel({
      seed: 4057,
      id: 'midnight-5',
      packId: 'midnight',
      indexInPack: 4,
      title: 'Deadline Rush',
      difficulty: 'Master',
      rows: 6,
      cols: 6,
      targetNotes: 28,
      obstacleCount: 4,
      doubleCount: 5,
    }),
    generateSolvableLevel({
      seed: 4073,
      id: 'midnight-6',
      packId: 'midnight',
      indexInPack: 5,
      title: 'Clean Slate',
      difficulty: 'Master',
      rows: 6,
      cols: 6,
      targetNotes: 30,
      obstacleCount: 3,
      doubleCount: 6,
    }),
  ],
};

// Verify every single curated level at module init (guaranteed zero deadlocks)
export const PACK_LEVELS: Record<ThemeId, LevelDef[]> = Object.fromEntries(
  THEME_ORDER.map((packId) => [
    packId,
    RAW_PACK_LEVELS[packId].map((lvl, idx) => {
      if (verifyLevelSolvable(lvl)) return lvl;
      // Fallback to verified procedural level with same parameters if ever needed
      return generateSolvableLevel({
        seed: 9000 + idx * 77 + packId.charCodeAt(0) * 13,
        id: lvl.id,
        packId: lvl.packId,
        indexInPack: lvl.indexInPack,
        title: lvl.title,
        difficulty: lvl.difficulty,
        rows: lvl.rows,
        cols: lvl.cols,
        targetNotes: lvl.notes.length,
        obstacleCount: lvl.obstacles?.length ?? 0,
      });
    }),
  ])
) as Record<ThemeId, LevelDef[]>;

export function createEndlessLevel(endlessNumber: number, themeId: ThemeId): LevelDef {
  const tier = Math.min(4, Math.floor((endlessNumber - 1) / 3));
  const size = tier === 0 ? 4 : tier <= 2 ? 5 : 6;
  const targetNotes =
    size === 4 ? 12 + (endlessNumber % 3) : size === 5 ? 17 + (endlessNumber % 4) : 24 + (endlessNumber % 5);
  const obstacleCount = tier === 0 ? 1 : tier <= 2 ? 2 : 3;
  const doubleCount = tier === 0 ? 0 : Math.min(5, tier + 1);
  const difficulties: LevelDef['difficulty'][] = ['Clever', 'Tricky', 'Expert', 'Master', 'Master'];

  return generateSolvableLevel({
    seed: 77001 + endlessNumber * 1319,
    id: `endless-${endlessNumber}`,
    packId: themeId,
    indexInPack: endlessNumber - 1,
    title: `Endless Wall #${endlessNumber}`,
    difficulty: difficulties[tier],
    rows: size,
    cols: size,
    targetNotes,
    obstacleCount,
    doubleCount,
    isEndless: true,
    endlessNumber,
  });
}

/**
 * Returns local calendar date string YYYY-MM-DD so each player gets a fresh daily wall at midnight.
 */
export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDailyDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Deterministic 32-bit FNV-1a hash for YYYY-MM-DD daily seed stability.
 */
function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates a unique, guaranteed-solvable Daily Puzzle for the given calendar date.
 * Rotates theme packs, board sizes (5x5 on weekdays, 6x6 on weekends), obstacles, and stacks.
 */
export function createDailyLevel(dateKey: string = getTodayDateKey()): LevelDef {
  const hash = hashDateKey(`sticky-notes-daily:${dateKey}`);
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayOfWeek = new Date(y, (m || 1) - 1, d || 1).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const packId = THEME_ORDER[hash % THEME_ORDER.length];
  const size = isWeekend ? 6 : 5;
  const targetNotes = isWeekend ? 25 + (hash % 4) : 18 + (hash % 4);
  const obstacleCount = isWeekend ? 3 : 2;
  const doubleCount = isWeekend ? 4 : 2 + (hash % 2);

  return generateSolvableLevel({
    seed: hash,
    id: `daily-${dateKey}`,
    packId,
    indexInPack: 0,
    title: `Daily · ${formatDailyDateLabel(dateKey)}`,
    difficulty: isWeekend ? 'Master' : 'Expert',
    rows: size,
    cols: size,
    targetNotes,
    obstacleCount,
    doubleCount,
    isDaily: true,
    dailyDateKey: dateKey,
  });
}
