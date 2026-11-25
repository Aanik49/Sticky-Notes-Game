import { generateSolvableLevel, verifyLevelSolvable } from './solver';
import {
  ClassicThemeId,
  DailyMission,
  GameMode,
  LabThemeId,
  LevelDef,
  LevelRecord,
  ThemeId,
  ThemeMeta,
} from './types';

export const LEVELS_PER_PACK = 15;

export const CLASSIC_THEME_ORDER: ClassicThemeId[] = [
  'fridge',
  'cork',
  'drafting',
  'midnight',
  'atelier',
  'gallery',
];

export const LAB_THEME_ORDER: LabThemeId[] = [
  'lab-tape',
  'lab-pivot',
  'lab-chain',
  'lab-sync',
  'lab-matrix',
  'lab-master',
];

export const THEME_ORDER: ThemeId[] = [...CLASSIC_THEME_ORDER, ...LAB_THEME_ORDER];

export function getThemesForMode(mode: GameMode): ThemeId[] {
  return mode === 'lab' ? LAB_THEME_ORDER : CLASSIC_THEME_ORDER;
}

export function getModeForPack(packId: ThemeId): GameMode {
  return (LAB_THEME_ORDER as string[]).includes(packId) ? 'lab' : 'classic';
}

export const THEMES: Record<ThemeId, ThemeMeta> = {
  /* =========================================================================
     CLASSIC MODE PACKS (6 PACKS × 15 LEVELS)
     ========================================================================= */
  fridge: {
    id: 'fridge',
    mode: 'classic',
    visualBase: 'fridge',
    name: 'Kitchen Grid',
    shortName: 'Fridge',
    surfaceLabel: 'Ivory Bauhaus Grid',
    tagline: 'Primary color notes aligned on crisp ivory architectural stock',
    worldClass: 'world-fridge',
    boardClass: 'board-fridge',
    isDark: false,
    accentHex: '#d6302a',
    boardStamp: 'GRID 01 · FRIDGE',
    fastenerType: 'magnet',
  },
  cork: {
    id: 'cork',
    mode: 'classic',
    visualBase: 'cork',
    name: 'Ochre Bulletin',
    shortName: 'Cork Board',
    surfaceLabel: 'Mustard Ochre Grid',
    tagline: 'Warm ochre plates framed in heavy black studio rules',
    worldClass: 'world-cork',
    boardClass: 'board-cork',
    isDark: false,
    accentHex: '#e4b43c',
    boardStamp: 'GRID 02 · CORK',
    fastenerType: 'pushpin',
  },
  drafting: {
    id: 'drafting',
    mode: 'classic',
    visualBase: 'drafting',
    name: 'Drafting Matrix',
    shortName: 'Drafting',
    surfaceLabel: 'Teal Millimeter Grid',
    tagline: 'Measured architectural sheets laid over deep teal drafting rules',
    worldClass: 'world-drafting',
    boardClass: 'board-drafting',
    isDark: true,
    accentHex: '#1e6b64',
    boardStamp: 'GRID 03 · DRAFTING',
    fastenerType: 'tape',
  },
  midnight: {
    id: 'midnight',
    mode: 'classic',
    visualBase: 'midnight',
    name: 'Nocturne Studio',
    shortName: 'Midnight',
    surfaceLabel: 'Obsidian Ink Grid',
    tagline: 'High-contrast nocturnal grid with primary geometric accents',
    worldClass: 'world-midnight',
    boardClass: 'board-midnight',
    isDark: true,
    accentHex: '#e4b43c',
    boardStamp: 'GRID 04 · MIDNIGHT',
    fastenerType: 'clip',
  },
  atelier: {
    id: 'atelier',
    mode: 'classic',
    visualBase: 'atelier',
    name: 'Vermilion Atelier',
    shortName: 'Atelier',
    surfaceLabel: 'Vermilion Print Grid',
    tagline: 'Bold vermilion poster wall built for layered studio proofs',
    worldClass: 'world-atelier',
    boardClass: 'board-atelier',
    isDark: true,
    accentHex: '#d6302a',
    boardStamp: 'GRID 05 · ATELIER',
    fastenerType: 'rivet',
  },
  gallery: {
    id: 'gallery',
    mode: 'classic',
    visualBase: 'gallery',
    name: 'Cobalt Gallery',
    shortName: 'Gallery',
    surfaceLabel: 'Cobalt Exhibition Grid',
    tagline: 'Constructivist cobalt wall curated with master-grade interlocking grids',
    worldClass: 'world-gallery',
    boardClass: 'board-gallery',
    isDark: true,
    accentHex: '#2b56a3',
    boardStamp: 'GRID 06 · GALLERY',
    fastenerType: 'frame',
  },

  /* =========================================================================
     STUDIO LAB PACKS (6 PACKS × 15 LEVELS — TAPED, PIVOT & CHAIN-PEEL)
     ========================================================================= */
  'lab-tape': {
    id: 'lab-tape',
    mode: 'lab',
    visualBase: 'fridge',
    name: 'Tape Lock Lab',
    shortName: 'Tape Lock',
    surfaceLabel: 'Lab 01 · Key & Tape',
    tagline: 'Peel matching Key Notes first to snap Bauhaus tape locks open',
    mechanicBadge: 'Taped',
    worldClass: 'world-fridge',
    boardClass: 'board-fridge',
    isDark: false,
    accentHex: '#d6302a',
    boardStamp: 'LAB 01 · TAPE LOCK',
    fastenerType: 'magnet',
  },
  'lab-pivot': {
    id: 'lab-pivot',
    mode: 'lab',
    visualBase: 'cork',
    name: 'Pivot Grid Lab',
    shortName: 'Pivot Grid',
    surfaceLabel: 'Lab 02 · 90° Rotation',
    tagline: 'Corner-pinned notes rotate 90° clockwise after every valid peel',
    mechanicBadge: 'Pivot',
    worldClass: 'world-cork',
    boardClass: 'board-cork',
    isDark: false,
    accentHex: '#e4b43c',
    boardStamp: 'LAB 02 · PIVOT GRID',
    fastenerType: 'pushpin',
  },
  'lab-chain': {
    id: 'lab-chain',
    mode: 'lab',
    visualBase: 'drafting',
    name: 'Chain Link Lab',
    shortName: 'Chain Link',
    surfaceLabel: 'Lab 03 · Linked Pairs',
    tagline: 'Dashed ink pairs peel together when both exit lanes are clear',
    mechanicBadge: 'Chain',
    worldClass: 'world-drafting',
    boardClass: 'board-drafting',
    isDark: true,
    accentHex: '#1e6b64',
    boardStamp: 'LAB 03 · CHAIN LINK',
    fastenerType: 'tape',
  },
  'lab-sync': {
    id: 'lab-sync',
    mode: 'lab',
    visualBase: 'midnight',
    name: 'Key & Pivot Lab',
    shortName: 'Key & Pivot',
    surfaceLabel: 'Lab 04 · Tape + Pivot',
    tagline: 'Time rotating arrows while unlocking Bauhaus color tape strips',
    mechanicBadge: 'Tape + Pivot',
    worldClass: 'world-midnight',
    boardClass: 'board-midnight',
    isDark: true,
    accentHex: '#e4b43c',
    boardStamp: 'LAB 04 · KEY & PIVOT',
    fastenerType: 'clip',
  },
  'lab-matrix': {
    id: 'lab-matrix',
    mode: 'lab',
    visualBase: 'atelier',
    name: 'Pivot & Chain Lab',
    shortName: 'Pivot & Chain',
    surfaceLabel: 'Lab 05 · Pivot + Chain',
    tagline: 'Synchronize rotating pivots with simultaneous chain-peel pairs',
    mechanicBadge: 'Pivot + Chain',
    worldClass: 'world-atelier',
    boardClass: 'board-atelier',
    isDark: true,
    accentHex: '#d6302a',
    boardStamp: 'LAB 05 · PIVOT & CHAIN',
    fastenerType: 'rivet',
  },
  'lab-master': {
    id: 'lab-master',
    mode: 'lab',
    visualBase: 'gallery',
    name: 'Studio Lab Finale',
    shortName: 'Lab Finale',
    surfaceLabel: 'Lab 06 · All Mechanics',
    tagline: 'Masterwork exhibition combining Tape Locks, Pivots & Chain-Peels',
    mechanicBadge: 'All 3',
    worldClass: 'world-gallery',
    boardClass: 'board-gallery',
    isDark: true,
    accentHex: '#2b56a3',
    boardStamp: 'LAB 06 · MASTER LAB',
    fastenerType: 'frame',
  },
};

interface PackLevelBlueprint {
  title: string;
  difficulty: LevelDef['difficulty'];
  size: number;
  notes: number;
  obstacles: number;
  doubles: number;
  tapePairs?: number;
  pivotCount?: number;
  chainPairs?: number;
}

function buildPackLevels(
  mode: GameMode,
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
      mode,
      packId,
      indexInPack,
      title: bp.title,
      difficulty: bp.difficulty,
      rows: bp.size,
      cols: bp.size,
      targetNotes: bp.notes,
      obstacleCount: bp.obstacles,
      doubleCount: bp.doubles,
      tapePairs: bp.tapePairs,
      pivotCount: bp.pivotCount,
      chainPairs: bp.chainPairs,
    });
  });

  return [...handcraftedPrefix, ...generated];
}

/**
 * 180 curated levels across 2 modes:
 * - Classic Mode: 6 packs × 15 levels (90 levels)
 * - Studio Lab Mode: 6 packs × 15 levels (90 levels) featuring Taped, Pivot & Chain-Peel mechanics
 */
const RAW_PACK_LEVELS: Record<ThemeId, LevelDef[]> = {
  /* ---------------- CLASSIC MODE (6 × 15) ---------------- */
  fridge: buildPackLevels(
    'classic',
    'fridge',
    1000,
    [
      {
        id: 'fridge-1',
        mode: 'classic',
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
        mode: 'classic',
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
        mode: 'classic',
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
      { title: 'Brunch Prep', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 2 },
      { title: 'Clean Fridge', difficulty: 'Master', size: 6, notes: 27, obstacles: 3, doubles: 4 },
    ]
  ),

  cork: buildPackLevels('classic', 'cork', 2000, [], [
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
    { title: 'Drama Auditions', difficulty: 'Expert', size: 6, notes: 24, obstacles: 3, doubles: 2 },
    { title: 'Honor Roll', difficulty: 'Master', size: 6, notes: 26, obstacles: 3, doubles: 3 },
    { title: 'Graduation Day', difficulty: 'Master', size: 6, notes: 29, obstacles: 4, doubles: 4 },
  ]),

  drafting: buildPackLevels('classic', 'drafting', 3000, [], [
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
    { title: 'Roof Garden', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 4 },
    { title: 'Final Blueprint', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 5 },
  ]),

  midnight: buildPackLevels('classic', 'midnight', 4000, [], [
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
    { title: 'Soundcheck', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 5 },
    { title: 'Release Notes', difficulty: 'Master', size: 6, notes: 28, obstacles: 4, doubles: 5 },
    { title: 'Golden Master', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 5 },
    { title: 'Clean Slate', difficulty: 'Master', size: 6, notes: 31, obstacles: 4, doubles: 6 },
  ]),

  atelier: buildPackLevels('classic', 'atelier', 5000, [], [
    { title: 'Red Square', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 2 },
    { title: 'Woodblock Cut', difficulty: 'Clever', size: 4, notes: 14, obstacles: 2, doubles: 2 },
    { title: 'Linocut Press', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 3 },
    { title: 'Type Foundry', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 3 },
    { title: 'Poster Proof', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 3, doubles: 3 },
    { title: 'Weimar Loom', difficulty: 'Tricky', size: 5, notes: 20, obstacles: 3, doubles: 3 },
    { title: 'Ink Roller', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 4 },
    { title: 'Primary Study', difficulty: 'Expert', size: 5, notes: 22, obstacles: 3, doubles: 4 },
    { title: 'Silkscreen I', difficulty: 'Expert', size: 6, notes: 25, obstacles: 3, doubles: 4 },
    { title: 'Dessau Wing', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 4 },
    { title: 'Color Wheel', difficulty: 'Expert', size: 6, notes: 27, obstacles: 4, doubles: 4 },
    { title: 'Steel Tube', difficulty: 'Master', size: 6, notes: 29, obstacles: 4, doubles: 5 },
    { title: 'Axis Tension', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 6 },
    { title: 'Master Print', difficulty: 'Master', size: 6, notes: 31, obstacles: 4, doubles: 6 },
    { title: 'Atelier Finale', difficulty: 'Master', size: 6, notes: 32, obstacles: 4, doubles: 7 },
  ]),

  gallery: buildPackLevels('classic', 'gallery', 6000, [], [
    { title: 'Blue Plinth', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 3 },
    { title: 'White Cube', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 3 },
    { title: 'Mondrian IV', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 3, doubles: 3 },
    { title: 'De Stijl Plane', difficulty: 'Tricky', size: 5, notes: 20, obstacles: 3, doubles: 4 },
    { title: 'Curator Axis', difficulty: 'Expert', size: 5, notes: 21, obstacles: 3, doubles: 4 },
    { title: 'Grid Ratio', difficulty: 'Expert', size: 5, notes: 22, obstacles: 3, doubles: 4 },
    { title: 'Cobalt Frame', difficulty: 'Expert', size: 6, notes: 25, obstacles: 3, doubles: 4 },
    { title: 'North Alcove', difficulty: 'Expert', size: 6, notes: 26, obstacles: 3, doubles: 5 },
    { title: 'Kinetic Wall', difficulty: 'Expert', size: 6, notes: 27, obstacles: 4, doubles: 5 },
    { title: 'Triptych Grid', difficulty: 'Expert', size: 6, notes: 28, obstacles: 4, doubles: 5 },
    { title: 'Construct IX', difficulty: 'Master', size: 6, notes: 29, obstacles: 4, doubles: 5 },
    { title: 'Ochre Relief', difficulty: 'Master', size: 6, notes: 30, obstacles: 4, doubles: 6 },
    { title: 'Archive Vault', difficulty: 'Master', size: 6, notes: 31, obstacles: 4, doubles: 6 },
    { title: 'Centennial', difficulty: 'Master', size: 6, notes: 32, obstacles: 4, doubles: 7 },
    { title: 'Grand Gallery', difficulty: 'Master', size: 6, notes: 32, obstacles: 4, doubles: 8 },
  ]),

  /* ---------------- STUDIO LAB MODE (6 × 15) ---------------- */
  'lab-tape': buildPackLevels(
    'lab',
    'lab-tape',
    11000,
    [
      {
        id: 'lab-tape-1',
        mode: 'lab',
        packId: 'lab-tape',
        indexInPack: 0,
        title: 'Red Tape Seal',
        difficulty: 'Warmup',
        rows: 3,
        cols: 3,
        notes: [
          { r: 0, c: 0, dir: 'L', color: 'coral', keyColor: 'red' },
          { r: 0, c: 2, dir: 'U', color: 'canary' },
          { r: 1, c: 1, dir: 'U', color: 'sky', tapeColor: 'red' },
          { r: 1, c: 2, dir: 'R', color: 'mint' },
          { r: 2, c: 0, dir: 'U', color: 'canary' },
          { r: 2, c: 1, dir: 'U', color: 'coral' },
          { r: 2, c: 2, dir: 'L', color: 'sky' },
        ],
      },
    ],
    [
      { title: 'Key Unlock', difficulty: 'Warmup', size: 4, notes: 10, obstacles: 0, doubles: 0, tapePairs: 1 },
      { title: 'Double Strip', difficulty: 'Clever', size: 4, notes: 11, obstacles: 1, doubles: 0, tapePairs: 2 },
      { title: 'Sealed Corner', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0, tapePairs: 2 },
      { title: 'Color Match', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 0, tapePairs: 2 },
      { title: 'Tape Cascade', difficulty: 'Tricky', size: 5, notes: 15, obstacles: 1, doubles: 0, tapePairs: 2 },
      { title: 'Three Keys', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, tapePairs: 3 },
      { title: 'Lockstep Row', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 2, doubles: 0, tapePairs: 3 },
      { title: 'Vault Door', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 0, tapePairs: 3 },
      { title: 'Keyring Loop', difficulty: 'Expert', size: 5, notes: 19, obstacles: 2, doubles: 0, tapePairs: 3 },
      { title: 'Archive Tape', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 0, tapePairs: 3 },
      { title: 'Sealed Matrix', difficulty: 'Expert', size: 6, notes: 22, obstacles: 2, doubles: 0, tapePairs: 3 },
      { title: 'Triple Lock', difficulty: 'Expert', size: 6, notes: 24, obstacles: 3, doubles: 0, tapePairs: 3 },
      { title: 'Master Key', difficulty: 'Master', size: 6, notes: 25, obstacles: 3, doubles: 0, tapePairs: 3 },
      { title: 'Clean Unseal', difficulty: 'Master', size: 6, notes: 27, obstacles: 3, doubles: 0, tapePairs: 3 },
    ]
  ),

  'lab-pivot': buildPackLevels(
    'lab',
    'lab-pivot',
    12000,
    [
      {
        id: 'lab-pivot-1',
        mode: 'lab',
        packId: 'lab-pivot',
        indexInPack: 0,
        title: 'Quarter Turn',
        difficulty: 'Warmup',
        rows: 3,
        cols: 3,
        notes: [
          { r: 0, c: 1, dir: 'U', color: 'canary' },
          { r: 0, c: 2, dir: 'R', color: 'coral' },
          { r: 1, c: 1, dir: 'D', color: 'sky', pivot: true },
          { r: 1, c: 2, dir: 'R', color: 'apricot' },
          { r: 2, c: 1, dir: 'U', color: 'mint' },
          { r: 2, c: 2, dir: 'D', color: 'canary' },
        ],
      },
    ],
    [
      { title: 'Clockwise Pin', difficulty: 'Warmup', size: 4, notes: 10, obstacles: 0, doubles: 0, pivotCount: 1 },
      { title: 'Two Beats', difficulty: 'Clever', size: 4, notes: 11, obstacles: 0, doubles: 0, pivotCount: 2 },
      { title: 'Clockwork', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0, pivotCount: 2 },
      { title: 'Compass Dial', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 0, pivotCount: 2 },
      { title: 'Tempo Grid', difficulty: 'Tricky', size: 5, notes: 15, obstacles: 1, doubles: 0, pivotCount: 2 },
      { title: 'Three Dials', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, pivotCount: 3 },
      { title: 'Orbit Rhythm', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 1, doubles: 0, pivotCount: 3 },
      { title: 'Metronome', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 1, doubles: 0, pivotCount: 3 },
      { title: 'Gearbox', difficulty: 'Expert', size: 5, notes: 19, obstacles: 2, doubles: 0, pivotCount: 3 },
      { title: 'Phase Shift', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 0, pivotCount: 3 },
      { title: 'Turbine Row', difficulty: 'Expert', size: 6, notes: 22, obstacles: 2, doubles: 0, pivotCount: 4 },
      { title: 'Rotary Press', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 0, pivotCount: 4 },
      { title: 'Pendulum Wall', difficulty: 'Master', size: 6, notes: 25, obstacles: 2, doubles: 0, pivotCount: 4 },
      { title: 'Full Revolution', difficulty: 'Master', size: 6, notes: 26, obstacles: 2, doubles: 0, pivotCount: 4 },
    ]
  ),

  'lab-chain': buildPackLevels(
    'lab',
    'lab-chain',
    13000,
    [
      {
        id: 'lab-chain-1',
        mode: 'lab',
        packId: 'lab-chain',
        indexInPack: 0,
        title: 'Twin Peel',
        difficulty: 'Warmup',
        rows: 3,
        cols: 3,
        notes: [
          { r: 0, c: 0, dir: 'L', color: 'coral' },
          { r: 0, c: 1, dir: 'U', color: 'canary' },
          { r: 1, c: 0, dir: 'U', color: 'sky', linkId: 'A' },
          { r: 1, c: 2, dir: 'R', color: 'sky', linkId: 'A' },
          { r: 2, c: 0, dir: 'U', color: 'mint' },
          { r: 2, c: 2, dir: 'U', color: 'canary' },
        ],
      },
    ],
    [
      { title: 'Dashed Duo', difficulty: 'Warmup', size: 4, notes: 10, obstacles: 0, doubles: 0, chainPairs: 1 },
      { title: 'Paired Ink', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0, chainPairs: 2 },
      { title: 'Mirror Exit', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0, chainPairs: 2 },
      { title: 'Bridge Line', difficulty: 'Clever', size: 4, notes: 14, obstacles: 1, doubles: 0, chainPairs: 2 },
      { title: 'Dual Track', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, chainPairs: 2 },
      { title: 'Triple Tether', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 1, doubles: 0, chainPairs: 3 },
      { title: 'Sync Cable', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 2, doubles: 0, chainPairs: 3 },
      { title: 'Cross Stitch', difficulty: 'Tricky', size: 5, notes: 19, obstacles: 2, doubles: 0, chainPairs: 3 },
      { title: 'Tension Wire', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 0, chainPairs: 3 },
      { title: 'Double Snap', difficulty: 'Expert', size: 5, notes: 21, obstacles: 2, doubles: 0, chainPairs: 3 },
      { title: 'Circuit Loom', difficulty: 'Expert', size: 6, notes: 23, obstacles: 2, doubles: 0, chainPairs: 4 },
      { title: 'Tandem Grid', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 0, chainPairs: 4 },
      { title: 'Linked Folio', difficulty: 'Master', size: 6, notes: 26, obstacles: 3, doubles: 0, chainPairs: 4 },
      { title: 'Grand Chain', difficulty: 'Master', size: 6, notes: 28, obstacles: 3, doubles: 0, chainPairs: 4 },
    ]
  ),

  'lab-sync': buildPackLevels('lab', 'lab-sync', 14000, [], [
    { title: 'Key & Dial', difficulty: 'Clever', size: 4, notes: 11, obstacles: 0, doubles: 0, tapePairs: 1, pivotCount: 1 },
    { title: 'Timed Seal', difficulty: 'Clever', size: 4, notes: 12, obstacles: 1, doubles: 0, tapePairs: 1, pivotCount: 2 },
    { title: 'Latch & Turn', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 1 },
    { title: 'Nocturne Lock', difficulty: 'Tricky', size: 5, notes: 15, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 2 },
    { title: 'Spinning Key', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 2 },
    { title: 'Cipher Wheel', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 2 },
    { title: 'Vault Rotor', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 3 },
    { title: 'Dual Tumbler', difficulty: 'Expert', size: 5, notes: 19, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 3 },
    { title: 'Clock Lock', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 2 },
    { title: 'Chrono Tape', difficulty: 'Expert', size: 6, notes: 22, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 3 },
    { title: 'Night Watch', difficulty: 'Expert', size: 6, notes: 23, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3 },
    { title: 'Pin & Keyway', difficulty: 'Master', size: 6, notes: 24, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3 },
    { title: 'Safe Cracker', difficulty: 'Master', size: 6, notes: 25, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3 },
    { title: 'Midnight Dial', difficulty: 'Master', size: 6, notes: 26, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 4 },
    { title: 'Zero Sync', difficulty: 'Master', size: 6, notes: 27, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 4 },
  ]),

  'lab-matrix': buildPackLevels('lab', 'lab-matrix', 15000, [], [
    { title: 'Spinning Pair', difficulty: 'Clever', size: 4, notes: 12, obstacles: 0, doubles: 0, pivotCount: 1, chainPairs: 1 },
    { title: 'Tether Turn', difficulty: 'Clever', size: 4, notes: 13, obstacles: 1, doubles: 0, pivotCount: 1, chainPairs: 2 },
    { title: 'Synced Axle', difficulty: 'Tricky', size: 5, notes: 15, obstacles: 1, doubles: 0, pivotCount: 2, chainPairs: 1 },
    { title: 'Coupled Gear', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, pivotCount: 2, chainPairs: 2 },
    { title: 'Pulley System', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 1, doubles: 0, pivotCount: 2, chainPairs: 2 },
    { title: 'Drive Belt', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 1, doubles: 0, pivotCount: 2, chainPairs: 2 },
    { title: 'Camshaft', difficulty: 'Expert', size: 5, notes: 19, obstacles: 2, doubles: 0, pivotCount: 2, chainPairs: 3 },
    { title: 'Chain Rotor', difficulty: 'Expert', size: 5, notes: 20, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 2 },
    { title: 'Kinetic Loom', difficulty: 'Expert', size: 6, notes: 22, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 2 },
    { title: 'Press Crank', difficulty: 'Expert', size: 6, notes: 23, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 3 },
    { title: 'Twin Flywheel', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 3 },
    { title: 'Atelier Rig', difficulty: 'Master', size: 6, notes: 25, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 3 },
    { title: 'Red Pendulum', difficulty: 'Master', size: 6, notes: 26, obstacles: 2, doubles: 0, pivotCount: 3, chainPairs: 3 },
    { title: 'Vector Press', difficulty: 'Master', size: 6, notes: 27, obstacles: 2, doubles: 0, pivotCount: 4, chainPairs: 3 },
    { title: 'Matrix Prime', difficulty: 'Master', size: 6, notes: 28, obstacles: 2, doubles: 0, pivotCount: 4, chainPairs: 3 },
  ]),

  'lab-master': buildPackLevels('lab', 'lab-master', 16000, [], [
    { title: 'Lab Synthesis', difficulty: 'Tricky', size: 5, notes: 15, obstacles: 1, doubles: 0, tapePairs: 1, pivotCount: 1, chainPairs: 1 },
    { title: 'Threefold', difficulty: 'Tricky', size: 5, notes: 16, obstacles: 1, doubles: 0, tapePairs: 1, pivotCount: 1, chainPairs: 1 },
    { title: 'Bauhaus Lab I', difficulty: 'Tricky', size: 5, notes: 17, obstacles: 1, doubles: 0, tapePairs: 1, pivotCount: 2, chainPairs: 1 },
    { title: 'Triad Engine', difficulty: 'Tricky', size: 5, notes: 18, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 1, chainPairs: 2 },
    { title: 'Grand Relay', difficulty: 'Expert', size: 5, notes: 19, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 2, chainPairs: 1 },
    { title: 'Lock & Loom', difficulty: 'Expert', size: 5, notes: 20, obstacles: 1, doubles: 0, tapePairs: 2, pivotCount: 2, chainPairs: 2 },
    { title: 'Curator Test', difficulty: 'Expert', size: 6, notes: 22, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 2, chainPairs: 2 },
    { title: 'Cobalt Lab', difficulty: 'Expert', size: 6, notes: 23, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 2, chainPairs: 2 },
    { title: 'Triple Rhythm', difficulty: 'Expert', size: 6, notes: 24, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 2, chainPairs: 3 },
    { title: 'Master Draft', difficulty: 'Master', size: 6, notes: 25, obstacles: 2, doubles: 0, tapePairs: 2, pivotCount: 3, chainPairs: 2 },
    { title: 'Prism Engine', difficulty: 'Master', size: 6, notes: 26, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 2, chainPairs: 2 },
    { title: 'Dessau Clock', difficulty: 'Master', size: 6, notes: 26, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3, chainPairs: 2 },
    { title: 'Total Grid', difficulty: 'Master', size: 6, notes: 27, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3, chainPairs: 3 },
    { title: 'Opus Lab', difficulty: 'Master', size: 6, notes: 28, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3, chainPairs: 3 },
    { title: 'Studio Crown', difficulty: 'Master', size: 6, notes: 28, obstacles: 2, doubles: 0, tapePairs: 3, pivotCount: 3, chainPairs: 3 },
  ]),
};

// Verify every single curated level (Classic & Studio Lab) at module init — zero deadlocks guaranteed
export const PACK_LEVELS: Record<ThemeId, LevelDef[]> = Object.fromEntries(
  THEME_ORDER.map((packId) => [
    packId,
    RAW_PACK_LEVELS[packId].map((lvl, idx) => {
      if (verifyLevelSolvable(lvl)) return lvl;
      return generateSolvableLevel({
        seed: 9000 + idx * 77 + packId.charCodeAt(packId.length - 1) * 19,
        id: lvl.id,
        mode: lvl.mode,
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

export function createEndlessLevel(
  endlessNumber: number,
  themeId: ThemeId
): LevelDef {
  const mode = getModeForPack(themeId);
  const tier = Math.min(4, Math.floor((endlessNumber - 1) / 3));
  const size = tier === 0 ? 4 : tier <= 2 ? 5 : 6;
  const targetNotes =
    size === 4
      ? 12 + (endlessNumber % 3)
      : size === 5
        ? 17 + (endlessNumber % 4)
        : 24 + (endlessNumber % 5);
  const obstacleCount = tier === 0 ? 1 : tier <= 2 ? 2 : 3;
  const doubleCount = mode === 'classic' ? (tier === 0 ? 0 : Math.min(5, tier + 1)) : 0;
  const difficulties: LevelDef['difficulty'][] = ['Clever', 'Tricky', 'Expert', 'Master', 'Master'];

  return generateSolvableLevel({
    seed: 77001 + endlessNumber * 1319 + (mode === 'lab' ? 50000 : 0),
    id: `endless-${mode}-${endlessNumber}`,
    mode,
    packId: themeId,
    indexInPack: endlessNumber - 1,
    title: mode === 'lab' ? `Lab Endless #${endlessNumber}` : `Endless Wall #${endlessNumber}`,
    difficulty: difficulties[tier],
    rows: size,
    cols: size,
    targetNotes,
    obstacleCount,
    doubleCount,
    tapePairs: mode === 'lab' ? Math.min(3, 1 + Math.floor(tier / 2)) : 0,
    pivotCount: mode === 'lab' ? Math.min(3, 1 + Math.floor(tier / 2)) : 0,
    chainPairs: mode === 'lab' ? Math.min(3, 1 + Math.floor((tier + 1) / 2)) : 0,
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

  const packId = CLASSIC_THEME_ORDER[hash % CLASSIC_THEME_ORDER.length];
  const size = isWeekend ? 6 : 5;
  const targetNotes = isWeekend ? 25 + (hash % 4) : 18 + (hash % 4);
  const obstacleCount = isWeekend ? 3 : 2;
  const doubleCount = isWeekend ? 4 : 2 + (hash % 2);

  const generated = generateSolvableLevel({
    seed: hash,
    id: `daily-${dateKey}`,
    mode: 'classic',
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
   PROGRESSIVE PACK UNLOCK RULES:
   - Classic: Fridge -> Cork -> Drafting -> Midnight -> Atelier -> Gallery
   - Studio Lab: Tape Lock, Pivot Grid & Chain Link open right away so players
     can test all 3 mechanics immediately! Fusion packs unlock as you clear:
     Tape Lock -> Key & Pivot | Pivot Grid -> Pivot & Chain | Chain Link -> Lab Finale
   ========================================================================= */

const LAB_PREREQUISITE: Partial<Record<LabThemeId, LabThemeId>> = {
  'lab-sync': 'lab-tape',
  'lab-matrix': 'lab-pivot',
  'lab-master': 'lab-chain',
};

export function getPreviousPackId(packId: ThemeId): ThemeId | null {
  if (getModeForPack(packId) === 'lab') {
    return LAB_PREREQUISITE[packId as LabThemeId] ?? null;
  }
  const idx = CLASSIC_THEME_ORDER.indexOf(packId as ClassicThemeId);
  return idx > 0 ? CLASSIC_THEME_ORDER[idx - 1] : null;
}

export function getNextPackId(packId: ThemeId): ThemeId | null {
  const list = getThemesForMode(getModeForPack(packId));
  const idx = list.indexOf(packId);
  return idx >= 0 && idx + 1 < list.length ? list[idx + 1] : null;
}

/** Returns any pack whose prerequisite is `completedPackId` (for unlock celebration banners) */
export function getUnlockedPackAfterCompleting(completedPackId: ThemeId): ThemeId | null {
  if (getModeForPack(completedPackId) === 'lab') {
    const match = (Object.entries(LAB_PREREQUISITE) as [LabThemeId, LabThemeId][]).find(
      ([, prereq]) => prereq === completedPackId
    );
    return match ? match[0] : null;
  }
  return getNextPackId(completedPackId);
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
  if (getModeForPack(packId) === 'lab') {
    const prereq = LAB_PREREQUISITE[packId as LabThemeId];
    if (!prereq) return true;
    return isPackCompleted(prereq, records);
  }

  const idx = CLASSIC_THEME_ORDER.indexOf(packId as ClassicThemeId);
  if (idx <= 0) return true;
  for (let i = 0; i < idx; i++) {
    if (!isPackCompleted(CLASSIC_THEME_ORDER[i], records)) {
      return false;
    }
  }
  return true;
}

export function isProgressionPack(packId: ThemeId): boolean {
  if (getModeForPack(packId) === 'lab') {
    return Boolean(LAB_PREREQUISITE[packId as LabThemeId]);
  }
  return packId !== 'fridge';
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

export function getHighestUnlockedPack(
  records: Record<string, LevelRecord>,
  mode: GameMode = 'classic'
): ThemeId {
  const list = getThemesForMode(mode);
  let highest: ThemeId = list[0];
  for (const id of list) {
    if (isPackUnlocked(id, records)) {
      highest = id;
    }
  }
  return highest;
}
