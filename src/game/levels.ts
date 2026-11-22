import { generateSolvableLevel, verifyLevelSolvable } from './solver';
import { DailyMission, LevelDef, LevelRecord, ThemeId, ThemeMeta } from './types';

export const LEVELS_PER_PACK = 18;

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
    isDark: true,
    accentHex: '#2dd4bf',
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

interface PackLevelBlueprint {
  title: string;
  difficulty: LevelDef['difficulty'];
  size: number;
  notes: number;
  obstacles: number;
  doubles: number;
}

function buildPackLevels(
  packId: ThemeId,
  baseSeed: number,
  handcraftedPrefix: LevelDef[],
  remainingBlueprints: PackLevelBlueprint[]
): LevelDef[] {
  const generated = remainingBlueprints.map((bp, offset) => {
    const indexInPack = handcraftedPrefix.length + offset;
    return generateSolvableLevel({
      seed: baseSeed + (indexInPack + 1) * 137,
      id: `${packId}-${indexInPack + 1}`,
      packId,
      indexInPack,
      title: bp.title,
      difficulty: bp.difficulty,
      rows: bp.size,
      cols: bp.size,
      targetNotes: bp.notes,
      obstacleCount: bp.obstacles,
      doubleCount: bp.doubles,
    });
  });

  return [...handcraftedPrefix, ...generated];
}

/**
 * 72 curated, progressively challenging levels across 4 themed packs (18 levels per pack).
 * Every level is verified 100% deadlock-free at initialization.
 */
const RAW_PACK_LEVELS: Record<ThemeId, LevelDef[]> = {
  fridge: buildPackLevels(
    'fridge',
    1000,
    [
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
    ],
    [
      { title: 'Magnet Catch', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0 },
      { title: 'Dinner Recipes', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 0 },
      { title: 'Sunday Pantry', difficulty: 'Clever', size: 4, notes: 14, obstacles: 1, doubles: 1 },
      { title: 'Fresh Berries', difficulty: 'Tricky', size: 4, notes: 14, obstacles: 2, doubles: 1 },
      { title: 'Lunchbox Note', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 1 },
      { title: 'Spice Rack', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 1 },
      { title: 'Tea Kettle', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 2 },
      { title: 'Farmers Market', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 2, doubles: 2 },
      { title: 'Baking Sheet', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 2 },
      { title: 'Leftover Labels', difficulty: 'Expert', size: 5, notes: 21, obstacles: 2, doubles: 3 },
      { title: 'Family Calendar', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 3 },
      { title: 'Brunch Prep', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 2 },
      { title: 'Potluck List', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 3 },
      { title: 'Holiday Menu', difficulty: 'Master', size: 6, notes: 27, obstacles: 3, doubles: 4 },
      { title: 'Clean Fridge', difficulty: 'Master', size: 6, notes: 29, obstacles: 3, doubles: 4 },
    ]
  ),

  cork: buildPackLevels('cork', 2000, [], [
    { title: 'Homeroom Bell', difficulty: 'Warmup', size: 4, notes: 10, obstacles: 1, doubles: 0 },
    { title: 'Club Flyers', difficulty: 'Warmup', size: 4, notes: 12, obstacles: 1, doubles: 0 },
    { title: 'Hall Pass', difficulty: 'Clever', size: 4, notes: 13, obstacles: 2, doubles: 0 },
    { title: 'Science Fair', difficulty: 'Clever', size: 4, notes: 14, obstacles: 1, doubles: 1 },
    { title: 'Book Report', difficulty: 'Clever', size: 4, notes: 14, obstacles: 2, doubles: 1 },
    { title: 'Art Showcase', difficulty: 'Clever', size: 5, notes: 16, obstacles: 2, doubles: 1 },
    { title: 'Hallway Notices', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 1 },
    { title: 'Choir Tryouts', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 2 },
    { title: 'Field Trip', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 2, doubles: 2 },
    { title: 'Study Group', difficulty: 'Tricky', size: 5, notes: 20, obstacles: 2, doubles: 2 },
    { title: 'Exam Schedule', difficulty: 'Expert', size: 5, notes: 20, obstacles: 3, doubles: 2 },
    { title: 'Faculty Wall', difficulty: 'Expert', size: 5, notes: 21, obstacles: 2, doubles: 3 },
    { title: 'Varsity Roster', difficulty: 'Expert', size: 5, notes: 22, obstacles: 2, doubles: 3 },
    { title: 'Drama Auditions', difficulty: 'Expert', size: 6, notes: 24, obstacles: 3, doubles: 2 },
    { title: 'Honor Roll', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 3 },
    { title: 'Library Due', difficulty: 'Master', size: 6, notes: 27, obstacles: 3, doubles: 4 },
    { title: 'Yearbook Proofs', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 4 },
    { title: 'Graduation Day', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 5 },
  ]),

  drafting: buildPackLevels('drafting', 3000, [], [
    { title: 'Floor Plan A', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 1 },
    { title: 'Site Survey', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 2 },
    { title: 'Compass Grid', difficulty: 'Clever', size: 4, notes: 14, obstacles: 2, doubles: 2 },
    { title: 'Scale Elevations', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 2, doubles: 2 },
    { title: 'Section Cut', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 2 },
    { title: 'North Facade', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 3, doubles: 2 },
    { title: 'Cantilever Study', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 2, doubles: 3 },
    { title: 'Beam Load', difficulty: 'Tricky', size: 5, notes: 20, obstacles: 2, doubles: 3 },
    { title: 'Atrium Sketch', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 3 },
    { title: 'Courtyard Axis', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 4 },
    { title: 'Stairwell Core', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 3 },
    { title: 'Grid Masterplan', difficulty: 'Expert', size: 6, notes: 25, obstacles: 3, doubles: 3 },
    { title: 'Glass Pavilion', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 4 },
    { title: 'Bridge Truss', difficulty: 'Expert', size: 6, notes: 27, obstacles: 3, doubles: 4 },
    { title: 'Roof Garden', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 4 },
    { title: 'Urban Plaza', difficulty: 'Master', size: 6, notes: 29, obstacles: 4, doubles: 4 },
    { title: 'Tower Spire', difficulty: 'Master', size: 6, notes: 30, obstacles: 3, doubles: 5 },
    { title: 'Final Blueprint', difficulty: 'Master', size: 6, notes: 31, obstacles: 4, doubles: 5 },
  ]),

  midnight: buildPackLevels('midnight', 4000, [], [
    { title: 'Desk Lamp On', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 2 },
    { title: 'First Draft', difficulty: 'Clever', size: 4, notes: 14, obstacles: 2, doubles: 2 },
    { title: 'Late Espresso', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 2 },
    { title: 'Sprint Backlog', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 3 },
    { title: 'Color Swatches', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 2, doubles: 3 },
    { title: 'Moodboard Stack', difficulty: 'Tricky', size: 5, notes: 20, obstacles: 3, doubles: 3 },
    { title: 'Wireframe Flow', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 4 },
    { title: 'Neon Post-Its', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 4 },
    { title: 'Midnight Tea', difficulty: 'Expert', size: 6, notes: 24, obstacles: 3, doubles: 3 },
    { title: 'Two AM Spark', difficulty: 'Expert', size: 6, notes: 25, obstacles: 3, doubles: 4 },
    { title: 'Bug Triage', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 4 },
    { title: 'Feature Freeze', difficulty: 'Expert', size: 6, notes: 27, obstacles: 4, doubles: 4 },
    { title: 'Soundcheck', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 5 },
    { title: 'Release Notes', difficulty: 'Master', size: 6, notes: 28, obstacles: 4, doubles: 5 },
    { title: 'Deadline Rush', difficulty: 'Master', size: 6, notes: 29, obstacles: 4, doubles: 5 },
    { title: 'Golden Master', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 5 },
    { title: 'Dawn Glow', difficulty: 'Master', size: 6, notes: 31, obstacles: 3, doubles: 6 },
    { title: 'Clean Slate', difficulty: 'Master', size: 6, notes: 32, obstacles: 4, doubles: 6 },
  ]),
};

// Verify every single curated level at module init (guaranteed zero deadlocks)
export const PACK_LEVELS: Record<ThemeId, LevelDef[]> = Object.fromEntries(
  THEME_ORDER.map((packId) => [
    packId,
    RAW_PACK_LEVELS[packId].map((lvl, idx) => {
      if (verifyLevelSolvable(lvl)) return lvl;
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
    size === 4
      ? 12 + (endlessNumber % 3)
      : size === 5
        ? 17 + (endlessNumber % 4)
        : 24 + (endlessNumber % 5);
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

function hashDateKey(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyMission(dateKey: string = getTodayDateKey()): DailyMission {
  const hash = hashDateKey(`sticky-notes-daily-mission:${dateKey}`);
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayOfWeek = new Date(y, (m || 1) - 1, d || 1).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const pool: DailyMission[] = [
    {
      kind: 'max_bumps',
      target: 2,
      label: 'Clear with < 2 bumps',
      rewardTitle: 'Steady Hand Seal',
    },
    {
      kind: 'max_time',
      target: isWeekend ? 45 : 30,
      label: isWeekend ? 'Clear in < 45s' : 'Clear in < 30s',
      rewardTitle: 'Swift Peel Seal',
    },
    {
      kind: 'no_hints',
      target: 0,
      label: 'Clear with no hints',
      rewardTitle: 'Pure Logic Seal',
    },
    {
      kind: 'min_streak',
      target: 5,
      label: 'Reach ×5 clean streak',
      rewardTitle: 'Chain Flow Seal',
    },
  ];

  return pool[hash % pool.length];
}

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

  const generated = generateSolvableLevel({
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

  return {
    ...generated,
    dailyMission: getDailyMission(dateKey),
  };
}

/* =========================================================================
   PROGRESSIVE PACK UNLOCK CHAIN:
   Fridge (unlocked) -> Cork Board -> Drafting -> Midnight
   ========================================================================= */

export function getPreviousPackId(packId: ThemeId): ThemeId | null {
  const idx = THEME_ORDER.indexOf(packId);
  return idx > 0 ? THEME_ORDER[idx - 1] : null;
}

export function getNextPackId(packId: ThemeId): ThemeId | null {
  const idx = THEME_ORDER.indexOf(packId);
  return idx >= 0 && idx + 1 < THEME_ORDER.length ? THEME_ORDER[idx + 1] : null;
}

export function getPackClearedCount(
  packId: ThemeId,
  records: Record<string, LevelRecord>
): number {
  return PACK_LEVELS[packId].reduce(
    (count, lvl) => count + (records[lvl.id] ? 1 : 0),
    0
  );
}

export function isPackCompleted(
  packId: ThemeId,
  records: Record<string, LevelRecord>
): boolean {
  const levels = PACK_LEVELS[packId];
  return levels.every((lvl) => Boolean(records[lvl.id]));
}

export function isPackUnlocked(
  packId: ThemeId,
  records: Record<string, LevelRecord>
): boolean {
  const idx = THEME_ORDER.indexOf(packId);
  if (idx <= 0) return true; // Fridge is always unlocked
  for (let i = 0; i < idx; i++) {
    if (!isPackCompleted(THEME_ORDER[i], records)) {
      return false;
    }
  }
  return true;
}

export function getPackUnlockRequirement(
  packId: ThemeId,
  records: Record<string, LevelRecord>
): { prevPackId: ThemeId; prevPackName: string; cleared: number; total: number } | null {
  if (isPackUnlocked(packId, records)) return null;
  const prevPackId = getPreviousPackId(packId);
  if (!prevPackId) return null;
  const total = PACK_LEVELS[prevPackId].length;
  const cleared = getPackClearedCount(prevPackId, records);
  return {
    prevPackId,
    prevPackName: THEMES[prevPackId].shortName,
    cleared,
    total,
  };
}

export function getHighestUnlockedPack(records: Record<string, LevelRecord>): ThemeId {
  let highest: ThemeId = 'fridge';
  for (const id of THEME_ORDER) {
    if (isPackUnlocked(id, records)) {
      highest = id;
    }
  }
  return highest;
}
