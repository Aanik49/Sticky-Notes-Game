import { LevelRecord, SavedProgress, ThemeId } from './types';

const STORAGE_KEY = 'sticky_notes_puzzle_save_v1';

const DEFAULT_PROGRESS: SavedProgress = {
  records: {},
  dailyRecords: {},
  dailyStreak: 0,
  lastDailyCompletedDate: null,
  muted: false,
  musicMuted: false,
  timeAttackEnabled: false,
  lastTheme: 'fridge',
  endlessBestStreak: 0,
  endlessCurrentLevel: 1,
  newlyUnlockedPacks: [],
};

export function loadProgress(): SavedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      records: parsed.records ?? {},
      dailyRecords: parsed.dailyRecords ?? {},
      dailyStreak: parsed.dailyStreak ?? 0,
      lastDailyCompletedDate: parsed.lastDailyCompletedDate ?? null,
      muted: Boolean(parsed.muted),
      musicMuted: Boolean(parsed.musicMuted),
      timeAttackEnabled: Boolean(parsed.timeAttackEnabled),
      lastTheme: (parsed.lastTheme as ThemeId) ?? 'fridge',
      endlessBestStreak: parsed.endlessBestStreak ?? 0,
      endlessCurrentLevel: Math.max(1, parsed.endlessCurrentLevel ?? 1),
      newlyUnlockedPacks: Array.isArray(parsed.newlyUnlockedPacks)
        ? (parsed.newlyUnlockedPacks as ThemeId[])
        : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: SavedProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors in sandboxed iframes
  }
}

export function mergeLevelRecord(
  existing: LevelRecord | undefined,
  stars: 1 | 2 | 3,
  bumps: number,
  timeSec: number,
  timeMs?: number,
  dailyMissionCompleted?: boolean
): LevelRecord {
  const missionDone = Boolean(existing?.dailyMissionCompleted || dailyMissionCompleted);
  if (!existing) {
    return {
      stars,
      bestBumps: bumps,
      bestTimeSec: timeSec,
      ...(timeMs !== undefined ? { bestTimeMs: timeMs } : {}),
      ...(missionDone ? { dailyMissionCompleted: true } : {}),
    };
  }
  const prevMs = existing.bestTimeMs;
  const nextBestMs =
    timeMs !== undefined
      ? prevMs !== undefined
        ? Math.min(prevMs, timeMs)
        : timeMs
      : prevMs;

  return {
    stars: Math.max(existing.stars, stars) as 1 | 2 | 3,
    bestBumps: Math.min(existing.bestBumps, bumps),
    bestTimeSec: Math.min(existing.bestTimeSec, timeSec),
    ...(nextBestMs !== undefined ? { bestTimeMs: nextBestMs } : {}),
    ...(missionDone ? { dailyMissionCompleted: true } : {}),
  };
}

function isYesterday(prevDateKey: string, currentDateKey: string): boolean {
  const [py, pm, pd] = prevDateKey.split('-').map(Number);
  const [cy, cm, cd] = currentDateKey.split('-').map(Number);
  if (!py || !pm || !pd || !cy || !cm || !cd) return false;
  const prevUtc = Date.UTC(py, pm - 1, pd);
  const currUtc = Date.UTC(cy, cm - 1, cd);
  return currUtc - prevUtc === 86_400_000;
}

export function applyDailyCompletion(
  prev: SavedProgress,
  dateKey: string,
  stars: 1 | 2 | 3,
  bumps: number,
  timeSec: number,
  timeMs?: number,
  dailyMissionCompleted?: boolean
): SavedProgress {
  const alreadyCompletedToday = Boolean(prev.dailyRecords[dateKey]);
  let nextStreak = prev.dailyStreak;
  let nextLastDate = prev.lastDailyCompletedDate;

  if (!alreadyCompletedToday) {
    if (prev.lastDailyCompletedDate && isYesterday(prev.lastDailyCompletedDate, dateKey)) {
      nextStreak = prev.dailyStreak + 1;
    } else if (prev.lastDailyCompletedDate !== dateKey) {
      nextStreak = 1;
    }
    nextLastDate = dateKey;
  }

  return {
    ...prev,
    dailyRecords: {
      ...prev.dailyRecords,
      [dateKey]: mergeLevelRecord(
        prev.dailyRecords[dateKey],
        stars,
        bumps,
        timeSec,
        timeMs,
        dailyMissionCompleted
      ),
    },
    dailyStreak: nextStreak,
    lastDailyCompletedDate: nextLastDate,
  };
}
