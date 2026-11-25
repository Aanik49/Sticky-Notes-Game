export type Direction = 'U' | 'D' | 'L' | 'R';

export type PaperColor = 'canary' | 'coral' | 'sky' | 'mint' | 'apricot' | 'lavender';

export type PaperStyleId = 'primary' | 'mono' | 'blueprint' | 'risograph' | 'goldfoil';

export type GameMode = 'classic' | 'lab';

export type TapeColor = 'red' | 'blue' | 'gold';

export type ClassicThemeId = 'fridge' | 'cork' | 'drafting' | 'midnight' | 'atelier' | 'gallery';

export type LabThemeId =
  | 'lab-tape'
  | 'lab-pivot'
  | 'lab-chain'
  | 'lab-sync'
  | 'lab-matrix'
  | 'lab-master';

export type ThemeId = ClassicThemeId | LabThemeId;

export type GameScreen = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'FAILED';

export const MAX_BUMPS = 5;

export interface NoteSpec {
  r: number;
  c: number;
  dir: Direction;
  color: PaperColor;
  /** Optional second note hidden underneath this note (peeled after the top layer) */
  under?: {
    dir: Direction;
    color: PaperColor;
  };
  /** Studio Lab: Locked by a Bauhaus tape strip until matching keyColor note is peeled */
  tapeColor?: TapeColor;
  /** Studio Lab: Key Note whose peel snaps off all matching tapeColor strips */
  keyColor?: TapeColor;
  /** Studio Lab: Corner-pinned note whose arrow rotates 90° clockwise after every valid peel */
  pivot?: boolean;
  /** Studio Lab: Chain-Peel pair ID ('A' | 'B' | 'C' | ...) — peels simultaneously with partner */
  linkId?: string;
}

export interface ActiveNote {
  id: string;
  r: number;
  c: number;
  dir: Direction;
  color: PaperColor;
  tilt: number;
  under?: {
    dir: Direction;
    color: PaperColor;
  };
  tapeColor?: TapeColor;
  keyColor?: TapeColor;
  pivot?: boolean;
  linkId?: string;
  /** Visual stamp micro-mark (optional subtle personality) */
  mark?: 'dot' | 'line' | 'check' | 'star';
}

export interface ObstacleSpec {
  r: number;
  c: number;
  variant: 0 | 1 | 2;
}

export type DailyMissionKind = 'max_bumps' | 'max_time' | 'no_hints' | 'min_streak';

export interface DailyMission {
  kind: DailyMissionKind;
  target: number;
  label: string;
  rewardTitle: string;
}

export interface LevelDef {
  id: string;
  mode: GameMode;
  packId: ThemeId;
  indexInPack: number;
  title: string;
  difficulty: 'Warmup' | 'Clever' | 'Tricky' | 'Expert' | 'Master';
  rows: number;
  cols: number;
  notes: NoteSpec[];
  obstacles?: ObstacleSpec[];
  isEndless?: boolean;
  endlessNumber?: number;
  isDaily?: boolean;
  dailyDateKey?: string;
  dailyMission?: DailyMission;
}

export interface ThemeMeta {
  id: ThemeId;
  mode: GameMode;
  visualBase: ClassicThemeId;
  name: string;
  shortName: string;
  surfaceLabel: string;
  tagline: string;
  mechanicBadge?: string;
  worldClass: string;
  boardClass: string;
  isDark: boolean;
  accentHex: string;
  /** Decorative label printed diegetically on the board frame */
  boardStamp: string;
  fastenerType: 'magnet' | 'pushpin' | 'tape' | 'clip' | 'rivet' | 'frame';
}

export interface UndoEntry {
  /** Exact board note snapshot prior to the peel (restores pivots, chain pairs, stacks & keys cleanly) */
  prevNotes: ActiveNote[];
  /** Number of sheets peeled in that step (1 for normal, 2 for chain-peel) */
  peeledCount: number;
}

export interface BlockerFeedback {
  tappedId: string;
  tappedR: number;
  tappedC: number;
  dir: Direction;
  blockerId: string | null;
  blockerR: number;
  blockerC: number;
  isObstacle: boolean;
  reason?: 'blocked' | 'taped' | 'partner_blocked';
  tapeColor?: TapeColor;
  timestamp: number;
}

export interface HintState {
  noteId: string;
  tier: 1 | 2;
}

export interface LevelRecord {
  stars: 1 | 2 | 3;
  bestBumps: number;
  bestTimeSec: number;
  bestTimeMs?: number;
  dailyMissionCompleted?: boolean;
}

export interface LifetimeStats {
  totalSheetsPeeled: number;
  totalWallsCleared: number;
  spotlessClears: number;
  longestCleanStreak: number;
  dailyMissionsCompleted: number;
  packClearsCount: Record<ThemeId, number>;
}

export interface SavedProgress {
  records: Record<string, LevelRecord>;
  dailyRecords: Record<string, LevelRecord>;
  dailyStreak: number;
  lastDailyCompletedDate: string | null;
  muted: boolean;
  musicMuted: boolean;
  timeAttackEnabled: boolean;
  lastMode: GameMode;
  lastTheme: ThemeId;
  paperStyle: PaperStyleId;
  endlessBestStreak: number;
  endlessCurrentLevel: number;
  newlyUnlockedPacks: ThemeId[];
  stats: LifetimeStats;
  unlockedAchievements: string[];
  seenClassicTutorial: boolean;
  seenLabTutorial: boolean;
}

export interface ParticleBurstRequest {
  type: 'peel' | 'bump' | 'victory';
  x: number;
  y: number;
  dir?: Direction;
  colorHex?: string;
}
