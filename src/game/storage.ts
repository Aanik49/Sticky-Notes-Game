import {
  LevelRecord,
  LifetimeStats,
  PaperStyleId,
  SavedProgress,
  ThemeId,
} from './types';

const STORAGE_KEY = 'sticky_notes_puzzle_save_v1';

const VALID_PAPER_STYLES: PaperStyleId[] = [
  'primary',
  'mono',
  'blueprint',
  'risograph',
  'goldfoil',
];

const DEFAULT_PACK_CLEARS: Record<ThemeId, number> = {
  fridge: 0,
  cork: 0,
  drafting: 0,
  midnight: 0,
  atelier: 0,
  gallery: 0,
};

const DEFAULT_STATS: LifetimeStats = {
  totalSheetsPeeled: 0,
  totalWallsCleared: 0,
  spotlessClears: 0,
  longestCleanStreak: 0,
  dailyMissionsCompleted: 0,
  packClearsCount: { ...DEFAULT_PACK_CLEARS },
};

const DEFAULT_PROGRESS: SavedProgress = {
  records: {},
  dailyRecords: {},
  dailyStreak: 0,
  lastDailyCompletedDate: null,
  muted: false,
  musicMuted: false,
  timeAttackEnabled: false,
  lastTheme: 'fridge',
  paperStyle: 'primary',
  endlessBestStreak: 0,
  endlessCurrentLevel: 1,
  newlyUnlockedPacks: [],
  stats: { ...DEFAULT_STATS, packClearsCount: { ...DEFAULT_PACK_CLEARS } },
  unlockedAchievements: [],
};

function sanitizeStats(
  raw: Partial<LifetimeStats> | undefined,
  records: Record<string, LevelRecord>,
  dailyRecords: Record<string, LevelRecord>
): LifetimeStats {
  const packClears: Record<ThemeId, number> = {
    fridge: raw?.packClearsCount?.fridge ?? 0,
    cork: raw?.packClearsCount?.cork ?? 0,
    drafting: raw?.packClearsCount?.drafting ?? 0,
    midnight: raw?.packClearsCount?.midnight ?? 0,
    atelier: raw?.packClearsCount?.atelier ?? 0,
    gallery: raw?.packClearsCount?.gallery ?? 0,
  };

  // Backfill from existing records when upgrading from earlier saves
  const recEntries = Object.entries(records);
  const dailyVals = Object.values(dailyRecords);
  if (!raw) {
    for (const [id] of recEntries) {
      const prefix = id.split('-')[0] as ThemeId;
      if (prefix in packClears) {
        packClears[prefix] += 1;
      }
    }
  }

  const inferredCleared = recEntries.length + dailyVals.length;
  const inferredSpotless =
    recEntries.filter(([, r]) => r.stars === 3).length +
    dailyVals.filter((r) => r.stars === 3).length;
  const inferredDailyMissions = dailyVals.filter((r) => r.dailyMissionCompleted).length;

  return {
    totalSheetsPeeled: Math.max(0, raw?.totalSheetsPeeled ?? inferredCleared * 14),
    totalWallsCleared: Math.max(inferredCleared, raw?.totalWallsCleared ?? 0),
    spotlessClears: Math.max(inferredSpotless, raw?.spotlessClears ?? 0),
    longestCleanStreak: Math.max(0, raw?.longestCleanStreak ?? 0),
    dailyMissionsCompleted: Math.max(inferredDailyMissions, raw?.dailyMissionsCompleted ?? 0),
    packClearsCount: packClears,
  };
}

export function loadProgress(): SavedProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PROGRESS,
        stats: { ...DEFAULT_STATS, packClearsCount: { ...DEFAULT_PACK_CLEARS } },
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    const records = parsed.records ?? {};
    const dailyRecords = parsed.dailyRecords ?? {};
    const candidateStyle = parsed.paperStyle as PaperStyleId | undefined;
    const paperStyle: PaperStyleId =
      candidateStyle && VALID_PAPER_STYLES.includes(candidateStyle) ? candidateStyle : 'primary';

    return {
      records,
      dailyRecords,
      dailyStreak: parsed.dailyStreak ?? 0,
      lastDailyCompletedDate: parsed.lastDailyCompletedDate ?? null,
      muted: Boolean(parsed.muted),
      musicMuted: Boolean(parsed.musicMuted),
      timeAttackEnabled: Boolean(parsed.timeAttackEnabled),
      lastTheme: (parsed.lastTheme as ThemeId) ?? 'fridge',
      paperStyle,
      endlessBestStreak: parsed.endlessBestStreak ?? 0,
      endlessCurrentLevel: Math.max(1, parsed.endlessCurrentLevel ?? 1),
      newlyUnlockedPacks: Array.isArray(parsed.newlyUnlockedPacks)
        ? (parsed.newlyUnlockedPacks as ThemeId[])
        : [],
      stats: sanitizeStats(parsed.stats, records, dailyRecords),
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return {
      ...DEFAULT_PROGRESS,
      stats: { ...DEFAULT_STATS, packClearsCount: { ...DEFAULT_PACK_CLEARS } },
    };
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
