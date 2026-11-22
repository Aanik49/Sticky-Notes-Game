export type Direction = 'U' | 'D' | 'L' | 'R';

export type PaperColor = 'canary' | 'coral' | 'sky' | 'mint' | 'apricot' | 'lavender';

export type ThemeId = 'fridge' | 'cork' | 'drafting' | 'midnight';

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
  name: string;
  shortName: string;
  surfaceLabel: string;
  tagline: string;
  worldClass: string;
  boardClass: string;
  isDark: boolean;
  accentHex: string;
  /** Decorative label printed diegetically on the board frame */
  boardStamp: string;
  fastenerType: 'magnet' | 'pushpin' | 'tape' | 'clip';
}

export interface UndoEntry {
  /** Snapshot of the note before peel */
  note: ActiveNote;
  /** If true, peeling revealed an under-layer; undo puts top layer back on top */
  wasStackedTop: boolean;
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

export interface SavedProgress {
  records: Record<string, LevelRecord>;
  dailyRecords: Record<string, LevelRecord>;
  dailyStreak: number;
  lastDailyCompletedDate: string | null;
  muted: boolean;
  musicMuted: boolean;
  timeAttackEnabled: boolean;
  lastTheme: ThemeId;
  endlessBestStreak: number;
  endlessCurrentLevel: number;
  newlyUnlockedPacks: ThemeId[];
}

export interface ParticleBurstRequest {
  type: 'peel' | 'bump' | 'victory';
  x: number;
  y: number;
  dir?: Direction;
  colorHex?: string;
}
