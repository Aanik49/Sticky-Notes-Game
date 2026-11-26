import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Medal,
  Music,
  Pause,
  RotateCcw,
  Star,
  Target,
  Timer,
  Undo2,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { GameBoard, PeelingGhost } from './components/GameBoard';
import {
  BlitzResultModal,
  FailedModal,
  formatStopwatchMs,
  LevelPickerModal,
  PauseModal,
  VictoryModal,
} from './components/Modals';
import { ModeTutorialModal } from './components/ModeTutorialModal';
import { ParticleCanvas, ParticleCanvasHandle } from './components/ParticleCanvas';
import { SplashScreen } from './components/SplashScreen';
import { StudioArchiveModal, StudioArchiveTab } from './components/StudioArchiveModal';
import { TitleScreen } from './components/TitleScreen';
import { sound } from './game/audio';
import {
  createBlitzLevel,
  createDailyLevel,
  createEndlessLevel,
  createWeeklyExhibitionStages,
  formatWeekLabel,
  getCurrentWeekKey,
  getHighestUnlockedPack,
  getModeForPack,
  getNextPackId,
  getThemesForMode,
  getTodayDateKey,
  getUnlockedPackAfterCompleting,
  isPackUnlocked,
  PACK_LEVELS,
  THEMES,
} from './game/levels';
import {
  getCurrentlyUnlockedAchievementIds,
  getTotalEarnedStars,
  isPaperStyleUnlocked,
  PAPER_STYLE_ORDER,
  PAPER_STYLES,
} from './game/mastery';
import { evaluateNoteTap, findBestHintNote } from './game/solver';
import {
  applyDailyCompletion,
  loadProgress,
  mergeLevelRecord,
  recordBlitzRun,
  recordWeeklyCompletion,
  saveProgress,
} from './game/storage';
import {
  ActiveNote,
  BlitzRunRecord,
  BlockerFeedback,
  DailyMission,
  Direction,
  GameMode,
  GameScreen,
  HintState,
  LevelDef,
  MAX_BUMPS,
  PaperStyleId,
  SavedProgress,
  ThemeId,
  UndoEntry,
} from './game/types';

function evaluateDailyMission(
  mission: DailyMission,
  stats: { bumps: number; elapsedMs: number; hintsUsed: number; maxCombo: number }
): boolean {
  switch (mission.kind) {
    case 'max_bumps':
      return stats.bumps < mission.target;
    case 'max_time':
      return stats.elapsedMs < mission.target * 1000;
    case 'no_hints':
      return stats.hintsUsed === 0;
    case 'min_streak':
      return stats.maxCombo >= mission.target;
  }
}

function instantiateNotes(level: LevelDef): ActiveNote[] {
  return level.notes.map((spec, idx) => ({
    id: `${level.id}-n${idx}`,
    r: spec.r,
    c: spec.c,
    dir: spec.dir,
    color: spec.color,
    tilt: 0,
    under: spec.under ? { ...spec.under } : undefined,
    tapeColor: spec.tapeColor,
    keyColor: spec.keyColor,
    pivot: spec.pivot,
    linkId: spec.linkId,
  }));
}

function countTotalSheets(notes: ActiveNote[]): number {
  return notes.reduce((acc, n) => acc + (n.under ? 2 : 1), 0);
}

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => {
    const loaded = loadProgress();
    sound.muted = loaded.muted;
    sound.musicMuted = loaded.musicMuted;
    return loaded;
  });

  const [showSplash, setShowSplash] = useState(true);
  const [boardTransition, setBoardTransition] = useState<'idle' | 'out' | 'in'>('idle');
  const [screen, setScreen] = useState<GameScreen>('TITLE_MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>(progress.lastMode);
  const initialModeThemes = getThemesForMode(progress.lastMode);
  const initialSafeTheme: ThemeId =
    initialModeThemes.includes(progress.lastTheme) &&
    isPackUnlocked(progress.lastTheme, progress.records)
      ? progress.lastTheme
      : initialModeThemes[0];
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(initialSafeTheme);
  const [currentLevel, setCurrentLevel] = useState<LevelDef>(
    () => PACK_LEVELS[initialSafeTheme][0]
  );

  const [notes, setNotes] = useState<ActiveNote[]>(() =>
    instantiateNotes(PACK_LEVELS[initialSafeTheme][0])
  );
  const [peelingGhosts, setPeelingGhosts] = useState<PeelingGhost[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [bumps, setBumps] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState<HintState | null>(null);
  const [blockerFeedback, setBlockerFeedback] = useState<BlockerFeedback | null>(null);
  const [animateSpawn, setAnimateSpawn] = useState(true);
  const [levelInstanceKey, setLevelInstanceKey] = useState('init-0');
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [pickerInitialPack, setPickerInitialPack] = useState<ThemeId | undefined>(undefined);
  const [archiveTab, setArchiveTab] = useState<StudioArchiveTab | null>(null);
  const [activeTutorialMode, setActiveTutorialMode] = useState<GameMode | null>(null);
  const seenTutorialRef = useRef({
    classic: progress.seenClassicTutorial,
    lab: progress.seenLabTutorial,
  });

  // Combo & timing tracking
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const lastPeelTsRef = useRef<number>(0);
  const comboClearTimerRef = useRef<number | null>(null);
  const blockerTimerRef = useRef<number | null>(null);
  const endModalTimerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const levelStartMsRef = useRef<number>(Date.now());
  const accumulatedMsRef = useRef<number>(0);
  const runStartMsRef = useRef<number | null>(null);
  const [liveElapsedMs, setLiveElapsedMs] = useState(0);
  const [victoryStats, setVictoryStats] = useState<{
    stars: 1 | 2 | 3;
    elapsedSec: number;
    elapsedMs: number;
    bestTimeMs: number | null;
    isNewBestTime: boolean;
    sheets: number;
    maxCombo: number;
    dailyMissionCompleted: boolean;
    newlyUnlockedPack: ThemeId | null;
    newlyUnlockedAchievements: string[];
    newlyUnlockedStyles: PaperStyleId[];
  }>({
    stars: 3,
    elapsedSec: 0,
    elapsedMs: 0,
    bestTimeMs: null,
    isNewBestTime: false,
    sheets: 0,
    maxCombo: 1,
    dailyMissionCompleted: false,
    newlyUnlockedPack: null,
    newlyUnlockedAchievements: [],
    newlyUnlockedStyles: [],
  });
  const [failedElapsedSec, setFailedElapsedSec] = useState(0);

  // Keyboard navigation focus cursor
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [isCelebratingClear, setIsCelebratingClear] = useState(false);
  const [celebrationBanner, setCelebrationBanner] = useState('Wall Cleared!');

  // 60-Second Blitz state & refs
  const [blitzRunSeed, setBlitzRunSeed] = useState(0);
  const [blitzWallsCleared, setBlitzWallsCleared] = useState(0);
  const [blitzTimeLeftMs, setBlitzTimeLeftMs] = useState(60_000);
  const [blitzToast, setBlitzToast] = useState<{
    text: string;
    tone: 'good' | 'bad';
    key: number;
  } | null>(null);
  const [blitzResult, setBlitzResult] = useState<{
    run: BlitzRunRecord;
    isNewBest: boolean;
    newlyUnlockedAchievements: string[];
  } | null>(null);
  const blitzToastTimerRef = useRef<number | null>(null);
  const blitzEndFiredRef = useRef(false);
  const blitzStatsRef = useRef({
    wallsCleared: 0,
    sheetsPeeled: 0,
    spotlessWalls: 0,
    bonusSec: 0,
    maxStreak: 1,
  });

  // Weekly Bauhaus Exhibition (3-Stage Gauntlet with shared 5-bump pool)
  const [weeklyRun, setWeeklyRun] = useState<{
    weekKey: string;
    stages: [LevelDef, LevelDef, LevelDef];
    stageIndex: 0 | 1 | 2;
    sheetsClearedPrior: number;
    elapsedMsPrior: number;
    maxComboPrior: number;
  } | null>(null);

  const particleRef = useRef<ParticleCanvasHandle | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const activeTheme = THEMES[currentLevel.packId];
  const obstacles = currentLevel.obstacles ?? [];
  const sheetsRemaining = useMemo(() => countTotalSheets(notes), [notes]);
  const initialTotalSheets = useMemo(
    () => currentLevel.notes.reduce((sum, n) => sum + (n.under ? 2 : 1), 0),
    [currentLevel]
  );
  const sheetsPeeled = Math.max(0, initialTotalSheets - sheetsRemaining);
  const peelProgressRatio =
    initialTotalSheets > 0 ? Math.min(1, Math.max(0, sheetsPeeled / initialTotalSheets)) : 1;
  const liveStars: 1 | 2 | 3 = bumps === 0 ? 3 : bumps <= 2 ? 2 : 1;

  // Persist progress changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Automatically show the mode instruction panel on first entry into Classic or Studio Lab
  // before the player starts their first level.
  useEffect(() => {
    if (showSplash || screen !== 'TITLE_MENU') return;
    if (selectedMode === 'classic' && !seenTutorialRef.current.classic) {
      setActiveTutorialMode('classic');
    } else if (selectedMode === 'lab' && !seenTutorialRef.current.lab) {
      setActiveTutorialMode('lab');
    }
  }, [showSplash, screen, selectedMode]);

  // Switch background music track smoothly between Home & Gameplay
  useEffect(() => {
    sound.setMusicTrack(screen === 'TITLE_MENU' ? 'home' : 'gameplay');
  }, [screen]);

  // Unlock Web Audio music on first user gesture and pause when tab is hidden
  useEffect(() => {
    const unlockMusic = () => {
      if (!sound.musicMuted) {
        sound.startMusic();
      }
    };
    const onVisibility = () => {
      sound.setTabVisible(!document.hidden);
    };

    window.addEventListener('pointerdown', unlockMusic, { passive: true });
    window.addEventListener('keydown', unlockMusic, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointerdown', unlockMusic);
      window.removeEventListener('keydown', unlockMusic);
      document.removeEventListener('visibilitychange', onVisibility);
      sound.stopMusicLoop();
    };
  }, []);

  // Accurate pause-aware stopwatch for Time Attack mode and Daily Time Missions
  const isTimerRunning =
    screen === 'PLAYING' &&
    !showLevelPicker &&
    archiveTab === null &&
    activeTutorialMode === null &&
    boardTransition !== 'out' &&
    !isCelebratingClear;
  const needsLiveTimerTick =
    progress.timeAttackEnabled ||
    (Boolean(currentLevel.isDaily) && currentLevel.dailyMission?.kind === 'max_time');

  useEffect(() => {
    if (!isTimerRunning) {
      if (runStartMsRef.current !== null) {
        accumulatedMsRef.current += performance.now() - runStartMsRef.current;
        runStartMsRef.current = null;
        setLiveElapsedMs(accumulatedMsRef.current);
      }
      return;
    }

    runStartMsRef.current = performance.now();
    if (!needsLiveTimerTick) {
      return () => {
        if (runStartMsRef.current !== null) {
          accumulatedMsRef.current += performance.now() - runStartMsRef.current;
          runStartMsRef.current = null;
        }
      };
    }

    const interval = window.setInterval(() => {
      if (runStartMsRef.current !== null) {
        setLiveElapsedMs(accumulatedMsRef.current + (performance.now() - runStartMsRef.current));
      }
    }, 60);

    return () => {
      window.clearInterval(interval);
      if (runStartMsRef.current !== null) {
        accumulatedMsRef.current += performance.now() - runStartMsRef.current;
        runStartMsRef.current = null;
      }
    };
  }, [isTimerRunning, needsLiveTimerTick]);

  const getCurrentElapsedMs = useCallback(() => {
    const runningDelta =
      runStartMsRef.current !== null ? performance.now() - runStartMsRef.current : 0;
    return Math.max(100, Math.round(accumulatedMsRef.current + runningDelta));
  }, []);

  const applyLevelImmediate = useCallback(
    (level: LevelDef, opts?: { preserveBumps?: boolean; preserveWeekly?: boolean }) => {
      if (comboClearTimerRef.current) window.clearTimeout(comboClearTimerRef.current);
      if (blockerTimerRef.current) window.clearTimeout(blockerTimerRef.current);
      if (endModalTimerRef.current) window.clearTimeout(endModalTimerRef.current);

      setCurrentLevel(level);
      if (!level.isDaily && !level.isEndless && !level.isBlitz && !level.isWeekly) {
        setSelectedMode(getModeForPack(level.packId));
        setSelectedTheme(level.packId);
      }
      if (!opts?.preserveWeekly && !level.isWeekly) {
        setWeeklyRun(null);
      }
      setNotes(instantiateNotes(level));
      setPeelingGhosts([]);
      setUndoStack([]);
      if (!opts?.preserveBumps) {
        setBumps(0);
      }
      setHintsUsed(0);
      setHint(null);
      setBlockerFeedback(null);
      if (!level.isBlitz) {
        setCombo(0);
        setMaxCombo(1);
      }
      setFocusedCell(null);
      setAnimateSpawn(true);
      setLevelInstanceKey(`${level.id}-${Date.now()}`);
      levelStartMsRef.current = Date.now();
      accumulatedMsRef.current = 0;
      runStartMsRef.current = performance.now();
      setLiveElapsedMs(0);
      if (!level.isBlitz) {
        lastPeelTsRef.current = 0;
      }
      setIsCelebratingClear(false);
      setShowLevelPicker(false);
      setScreen('PLAYING');

      // First-play instruction panel for Classic Mode and Studio Lab Mode (skip mid-Blitz)
      if (!level.isBlitz) {
        if (level.mode === 'classic' && !seenTutorialRef.current.classic) {
          setActiveTutorialMode('classic');
        } else if (level.mode === 'lab' && !seenTutorialRef.current.lab) {
          setActiveTutorialMode('lab');
        }
      }

      setProgress((prev) => {
        const isCampaign =
          !level.isDaily && !level.isEndless && !level.isBlitz && !level.isWeekly;
        const clearNewBadge = isCampaign && prev.newlyUnlockedPacks.includes(level.packId);
        const nextLastTheme = isCampaign ? level.packId : prev.lastTheme;
        const nextLastMode = isCampaign ? getModeForPack(level.packId) : prev.lastMode;

        if (
          !clearNewBadge &&
          prev.lastTheme === nextLastTheme &&
          prev.lastMode === nextLastMode
        ) {
          return prev;
        }
        return {
          ...prev,
          lastMode: nextLastMode,
          lastTheme: nextLastTheme,
          newlyUnlockedPacks: clearNewBadge
            ? prev.newlyUnlockedPacks.filter((id) => id !== level.packId)
            : prev.newlyUnlockedPacks,
        };
      });
    },
    []
  );

  const startLevel = useCallback(
    (
      level: LevelDef,
      withSlideTransition = false,
      opts?: { preserveBumps?: boolean; preserveWeekly?: boolean }
    ) => {
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);

      if (!withSlideTransition) {
        applyLevelImmediate(level, opts);
        setBoardTransition('in');
        transitionTimerRef.current = window.setTimeout(() => setBoardTransition('idle'), 300);
        return;
      }

      // Slide outgoing wall out, then slide incoming wall smoothly into place
      setShowLevelPicker(false);
      setScreen('PLAYING');
      setBoardTransition('out');
      transitionTimerRef.current = window.setTimeout(() => {
        applyLevelImmediate(level, opts);
        setBoardTransition('in');
        transitionTimerRef.current = window.setTimeout(() => {
          setBoardTransition('idle');
        }, 240);
      }, level.isBlitz ? 110 : 190);
    },
    [applyLevelImmediate]
  );

  const showBlitzBonusToast = useCallback((text: string, tone: 'good' | 'bad' = 'good') => {
    if (blitzToastTimerRef.current) window.clearTimeout(blitzToastTimerRef.current);
    setBlitzToast({ text, tone, key: Date.now() + Math.random() });
    blitzToastTimerRef.current = window.setTimeout(() => {
      setBlitzToast(null);
    }, 1050);
  }, []);

  const finishBlitzRun = useCallback(() => {
    if (blitzEndFiredRef.current) return;
    blitzEndFiredRef.current = true;

    const snap = blitzStatsRef.current;
    const run: BlitzRunRecord = {
      id: `blitz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      wallsCleared: snap.wallsCleared,
      sheetsPeeled: snap.sheetsPeeled,
      spotlessWalls: snap.spotlessWalls,
      maxStreak: snap.maxStreak,
      bonusSecEarned: snap.bonusSec,
      dateKey: getTodayDateKey(),
    };

    const prevBestWalls = (progress.blitzLeaderboard ?? []).reduce(
      (max, r) => Math.max(max, r.wallsCleared),
      0
    );
    const isNewBest = run.wallsCleared > 0 && run.wallsCleared > prevBestWalls;

    const buildNext = (prev: SavedProgress): SavedProgress => {
      const withRun = recordBlitzRun(prev, run);
      const mergedUnlocked = Array.from(
        new Set([
          ...withRun.unlockedAchievements,
          ...getCurrentlyUnlockedAchievementIds(withRun),
        ])
      );
      return {
        ...withRun,
        unlockedAchievements: mergedUnlocked,
      };
    };

    const predicted = buildNext(progress);
    const prevUnlocked = new Set([
      ...progress.unlockedAchievements,
      ...getCurrentlyUnlockedAchievementIds(progress),
    ]);
    const newlyUnlockedAchievements = predicted.unlockedAchievements.filter(
      (id) => !prevUnlocked.has(id)
    );

    setBlitzResult({ run, isNewBest, newlyUnlockedAchievements });
    setProgress((prev) => buildNext(prev));
    sound.playVictory();
    particleRef.current?.emitVictory(window.innerWidth, window.innerHeight);
    setScreen('BLITZ_OVER');
  }, [progress]);

  // 60-Second Blitz high-precision countdown timer (pauses cleanly on modals/pause)
  const isBlitzClockRunning =
    Boolean(currentLevel.isBlitz) &&
    screen === 'PLAYING' &&
    !showLevelPicker &&
    archiveTab === null &&
    activeTutorialMode === null &&
    boardTransition !== 'out';

  useEffect(() => {
    if (!isBlitzClockRunning) return;
    let lastTick = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - lastTick;
      lastTick = now;
      setBlitzTimeLeftMs((prev) => {
        const next = Math.max(0, prev - delta);
        if (next <= 0 && !blitzEndFiredRef.current) {
          window.setTimeout(() => finishBlitzRun(), 0);
        }
        return next;
      });
    }, 50);
    return () => window.clearInterval(timer);
  }, [finishBlitzRun, isBlitzClockRunning]);

  const handleGoHome = useCallback(() => {
    if (endModalTimerRef.current) window.clearTimeout(endModalTimerRef.current);
    sound.playClick();
    setIsCelebratingClear(false);
    setShowLevelPicker(false);
    setActiveTutorialMode(null);
    setScreen('TITLE_MENU');
  }, []);

  const handleSelectMode = useCallback(
    (mode: GameMode) => {
      setSelectedMode(mode);
      const themes = getThemesForMode(mode);
      setSelectedTheme((prev) => {
        const next =
          themes.includes(prev) && isPackUnlocked(prev, progress.records)
            ? prev
            : themes[0];
        setProgress((p) => ({ ...p, lastMode: mode, lastTheme: next }));
        return next;
      });
    },
    [progress.records]
  );

  const handleDismissTutorial = useCallback(() => {
    setActiveTutorialMode((mode) => {
      if (mode === 'classic') {
        seenTutorialRef.current.classic = true;
        setProgress((prev) =>
          prev.seenClassicTutorial ? prev : { ...prev, seenClassicTutorial: true }
        );
      } else if (mode === 'lab') {
        seenTutorialRef.current.lab = true;
        setProgress((prev) =>
          prev.seenLabTutorial ? prev : { ...prev, seenLabTutorial: true }
        );
      }
      return null;
    });
  }, []);

  const handleOpenLevelPicker = useCallback((packOverride?: ThemeId) => {
    setPickerInitialPack(packOverride);
    setShowLevelPicker(true);
  }, []);

  const handleOpenArchive = useCallback((tab: StudioArchiveTab = 'gallery') => {
    setArchiveTab(tab);
  }, []);

  const handleSelectPaperStyle = useCallback((styleId: PaperStyleId) => {
    setProgress((prev) => ({
      ...prev,
      paperStyle: styleId,
    }));
  }, []);

  const handleStartPack = useCallback(
    (themeId: ThemeId) => {
      if (!isPackUnlocked(themeId, progress.records)) {
        sound.playClick();
        handleOpenLevelPicker(themeId);
        return;
      }
      sound.playClick();
      const packLevels = PACK_LEVELS[themeId];
      const firstUnfinished =
        packLevels.find((l) => !progress.records[l.id]) ?? packLevels[0];
      startLevel(firstUnfinished);
    },
    [handleOpenLevelPicker, progress.records, startLevel]
  );

  const handleStartDaily = useCallback(() => {
    sound.playClick();
    const dailyLvl = createDailyLevel(getTodayDateKey());
    startLevel(dailyLvl);
  }, [startLevel]);

  const handleStartWeekly = useCallback(() => {
    sound.playClick();
    const weekKey = getCurrentWeekKey();
    const stages = createWeeklyExhibitionStages(weekKey);
    setWeeklyRun({
      weekKey,
      stages,
      stageIndex: 0,
      sheetsClearedPrior: 0,
      elapsedMsPrior: 0,
      maxComboPrior: 1,
    });
    startLevel(stages[0], false, { preserveWeekly: true });
  }, [startLevel]);

  const handleStartBlitz = useCallback(() => {
    sound.playClick();
    const seed = (Date.now() % 900_000) + 101;
    setBlitzRunSeed(seed);
    setBlitzWallsCleared(0);
    setBlitzTimeLeftMs(60_000);
    setBlitzToast(null);
    setBlitzResult(null);
    setCombo(0);
    setMaxCombo(1);
    lastPeelTsRef.current = 0;
    blitzEndFiredRef.current = false;
    blitzStatsRef.current = {
      wallsCleared: 0,
      sheetsPeeled: 0,
      spotlessWalls: 0,
      bonusSec: 0,
      maxStreak: 1,
    };
    setWeeklyRun(null);
    startLevel(createBlitzLevel(1, seed));
  }, [startLevel]);

  const handleStartEndless = useCallback(
    (themeOverride?: ThemeId) => {
      sound.playClick();
      const candidate = themeOverride ?? selectedTheme;
      const modeForCandidate = getModeForPack(candidate);
      const targetTheme = isPackUnlocked(candidate, progress.records)
        ? candidate
        : getHighestUnlockedPack(progress.records, modeForCandidate);
      const lvl = createEndlessLevel(progress.endlessCurrentLevel, targetTheme);
      startLevel(lvl);
    },
    [progress.endlessCurrentLevel, progress.records, selectedTheme, startLevel]
  );

  const triggerVictory = useCallback(
    (
      finalBumps: number,
      finalMaxCombo: number,
      lastNotePos?: { x: number; y: number },
      peeledOnWinningTap = 1
    ) => {
      const stageElapsedMs = getCurrentElapsedMs();
      const isWeeklyFinale = Boolean(currentLevel.isWeekly && weeklyRun);
      const elapsedMs = isWeeklyFinale && weeklyRun
        ? weeklyRun.elapsedMsPrior + stageElapsedMs
        : stageElapsedMs;
      const elapsedSec = Math.max(1, Math.round(elapsedMs / 1000));
      const stars: 1 | 2 | 3 = finalBumps === 0 ? 3 : finalBumps <= 2 ? 2 : 1;
      const totalVictorySheets =
        isWeeklyFinale && weeklyRun
          ? weeklyRun.sheetsClearedPrior + initialTotalSheets
          : initialTotalSheets;
      const effectiveMaxCombo =
        isWeeklyFinale && weeklyRun
          ? Math.max(weeklyRun.maxComboPrior, finalMaxCombo)
          : finalMaxCombo;

      const existingRecord =
        currentLevel.isDaily && currentLevel.dailyDateKey
          ? progress.dailyRecords[currentLevel.dailyDateKey]
          : !currentLevel.isEndless && !currentLevel.isWeekly
            ? progress.records[currentLevel.id]
            : undefined;

      const prevBestMs = existingRecord?.bestTimeMs;
      const recordTimeMs = progress.timeAttackEnabled ? elapsedMs : undefined;
      const computedBestMs =
        recordTimeMs !== undefined
          ? prevBestMs !== undefined
            ? Math.min(prevBestMs, recordTimeMs)
            : recordTimeMs
          : (prevBestMs ?? null);
      const isNewBestTime =
        recordTimeMs !== undefined && (prevBestMs === undefined || recordTimeMs < prevBestMs);

      const missionPassedThisRun =
        Boolean(currentLevel.isDaily && currentLevel.dailyMission) &&
        evaluateDailyMission(currentLevel.dailyMission!, {
          bumps: finalBumps,
          elapsedMs,
          hintsUsed,
          maxCombo: effectiveMaxCombo,
        });
      const dailyMissionCompleted = Boolean(
        missionPassedThisRun || existingRecord?.dailyMissionCompleted
      );

      // Check whether completing this wall unlocks another category pack!
      let newlyUnlockedPack: ThemeId | null = null;
      if (!currentLevel.isDaily && !currentLevel.isEndless && !currentLevel.isWeekly) {
        const candidatePack = getUnlockedPackAfterCompleting(currentLevel.packId);
        if (candidatePack && !isPackUnlocked(candidatePack, progress.records)) {
          const nextRecords = {
            ...progress.records,
            [currentLevel.id]: mergeLevelRecord(
              progress.records[currentLevel.id],
              stars,
              finalBumps,
              elapsedSec,
              recordTimeMs
            ),
          };
          if (isPackUnlocked(candidatePack, nextRecords)) {
            newlyUnlockedPack = candidatePack;
          }
        }
      }

      // Deterministic post-victory progress builder (updates records, lifetime stats & unlocked achievements)
      const buildNextProgress = (prev: SavedProgress): SavedProgress => {
        let base: SavedProgress;
        const alreadyEarnedDailySeal = Boolean(
          currentLevel.isDaily &&
            currentLevel.dailyDateKey &&
            prev.dailyRecords[currentLevel.dailyDateKey]?.dailyMissionCompleted
        );

        if (currentLevel.isWeekly && currentLevel.weeklyKey) {
          base = recordWeeklyCompletion(
            prev,
            currentLevel.weeklyKey,
            stars,
            finalBumps,
            elapsedSec,
            getTodayDateKey()
          );
        } else if (currentLevel.isDaily && currentLevel.dailyDateKey) {
          base = applyDailyCompletion(
            prev,
            currentLevel.dailyDateKey,
            stars,
            finalBumps,
            elapsedSec,
            recordTimeMs,
            missionPassedThisRun
          );
        } else if (currentLevel.isEndless) {
          const clearedNum = currentLevel.endlessNumber ?? 1;
          base = {
            ...prev,
            endlessCurrentLevel: Math.max(prev.endlessCurrentLevel, clearedNum + 1),
            endlessBestStreak: Math.max(prev.endlessBestStreak, clearedNum),
          };
        } else {
          const nextRecords = {
            ...prev.records,
            [currentLevel.id]: mergeLevelRecord(
              prev.records[currentLevel.id],
              stars,
              finalBumps,
              elapsedSec,
              recordTimeMs
            ),
          };
          const nextNewlyUnlocked =
            newlyUnlockedPack && !prev.newlyUnlockedPacks.includes(newlyUnlockedPack)
              ? [...prev.newlyUnlockedPacks, newlyUnlockedPack]
              : prev.newlyUnlockedPacks;

          base = {
            ...prev,
            records: nextRecords,
            newlyUnlockedPacks: nextNewlyUnlocked,
          };
        }

        const nextPackClearsCount = { ...base.stats.packClearsCount };
        nextPackClearsCount[currentLevel.packId] =
          (nextPackClearsCount[currentLevel.packId] ?? 0) + 1;

        const withStats: SavedProgress = {
          ...base,
          stats: {
            totalSheetsPeeled: base.stats.totalSheetsPeeled + peeledOnWinningTap,
            totalWallsCleared: base.stats.totalWallsCleared + 1,
            spotlessClears: base.stats.spotlessClears + (finalBumps === 0 ? 1 : 0),
            longestCleanStreak: Math.max(base.stats.longestCleanStreak, effectiveMaxCombo),
            dailyMissionsCompleted:
              base.stats.dailyMissionsCompleted +
              (missionPassedThisRun && !alreadyEarnedDailySeal ? 1 : 0),
            packClearsCount: nextPackClearsCount,
          },
        };

        const mergedUnlocked = Array.from(
          new Set([
            ...withStats.unlockedAchievements,
            ...getCurrentlyUnlockedAchievementIds(withStats),
          ])
        );

        return {
          ...withStats,
          unlockedAchievements: mergedUnlocked,
        };
      };

      const predictedNext = buildNextProgress(progress);
      const prevTotalStars = getTotalEarnedStars(progress);
      const nextTotalStars = getTotalEarnedStars(predictedNext);
      const prevUnlockedSet = new Set([
        ...progress.unlockedAchievements,
        ...getCurrentlyUnlockedAchievementIds(progress),
      ]);
      const newlyUnlockedAchievements = predictedNext.unlockedAchievements.filter(
        (id) => !prevUnlockedSet.has(id)
      );
      const newlyUnlockedStyles = PAPER_STYLE_ORDER.filter(
        (id) => !isPaperStyleUnlocked(id, prevTotalStars) && isPaperStyleUnlocked(id, nextTotalStars)
      );

      setVictoryStats({
        stars,
        elapsedSec,
        elapsedMs,
        bestTimeMs: computedBestMs,
        isNewBestTime,
        sheets: totalVictorySheets,
        maxCombo: effectiveMaxCombo,
        dailyMissionCompleted,
        newlyUnlockedPack,
        newlyUnlockedAchievements,
        newlyUnlockedStyles,
      });

      setCelebrationBanner(isWeeklyFinale ? 'Exhibition Cleared!' : 'Wall Cleared!');
      setIsCelebratingClear(true);
      sound.playVictory();
      const boardEl = boardContainerRef.current;
      if (boardEl) {
        const bRect = boardEl.getBoundingClientRect();
        particleRef.current?.emitBoardConfetti(
          {
            left: bRect.left,
            top: bRect.top,
            width: bRect.width,
            height: bRect.height,
          },
          lastNotePos
        );
      } else {
        particleRef.current?.emitVictory(window.innerWidth, window.innerHeight);
      }

      setProgress((prev) => buildNextProgress(prev));

      endModalTimerRef.current = window.setTimeout(() => {
        setIsCelebratingClear(false);
        setScreen('VICTORY');
      }, 860);
    },
    [currentLevel, getCurrentElapsedMs, hintsUsed, initialTotalSheets, progress, weeklyRun]
  );

  const handleTapNote = useCallback(
    (note: ActiveNote, el: HTMLButtonElement | null) => {
      if (
        screen !== 'PLAYING' ||
        (!currentLevel.isBlitz && bumps >= MAX_BUMPS) ||
        isCelebratingClear ||
        activeTutorialMode !== null
      ) {
        return;
      }

      const ev = evaluateNoteTap(
        note,
        notes,
        obstacles,
        currentLevel.rows,
        currentLevel.cols
      );

      const rect = el?.getBoundingClientRect();
      const boardRect = boardContainerRef.current?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const activeStyle = PAPER_STYLES[progress.paperStyle] ?? PAPER_STYLES.primary;

      if (ev.canPeel) {
        const now = Date.now();
        const peeledCount = ev.peeledNotes.length;
        const nextCombo =
          now - lastPeelTsRef.current < 1450 ? combo + peeledCount : peeledCount;
        lastPeelTsRef.current = now;
        const nextMaxCombo = Math.max(maxCombo, nextCombo);

        setCombo(nextCombo);
        setMaxCombo(nextMaxCombo);
        setHint(null);
        setBlockerFeedback(null);
        setAnimateSpawn(false);

        if (comboClearTimerRef.current) window.clearTimeout(comboClearTimerRef.current);
        comboClearTimerRef.current = window.setTimeout(() => setCombo(0), 1550);

        sound.playPeel(nextCombo, currentLevel.packId, Boolean(note.under));
        if (ev.unlockedTapeColors.length > 0) {
          sound.playUnlockTape();
        }
        if (ev.rotatedPivotCount > 0) {
          sound.playPivotTick();
        }

        const newGhosts: PeelingGhost[] = [];
        for (const peeled of ev.peeledNotes) {
          let px = cx;
          let py = cy;
          if (peeled.id !== note.id && boardRect) {
            px = boardRect.left + ((peeled.c + 0.5) / currentLevel.cols) * boardRect.width;
            py = boardRect.top + ((peeled.r + 0.5) / currentLevel.rows) * boardRect.height;
          }
          particleRef.current?.emitPeel(px, py, peeled.dir, activeStyle.paperHex[peeled.color]);

          const ghostKey = `ghost-${peeled.id}-${now}-${Math.random().toString(36).slice(2, 6)}`;
          newGhosts.push({
            key: ghostKey,
            note: { ...peeled, under: undefined },
            dir: peeled.dir,
          });
        }

        const ghostKeys = new Set(newGhosts.map((g) => g.key));
        setPeelingGhosts((prev) => [...prev, ...newGhosts]);
        window.setTimeout(() => {
          setPeelingGhosts((prev) => prev.filter((g) => !ghostKeys.has(g.key)));
        }, 410);

        setUndoStack((prev) => [
          ...prev,
          {
            prevNotes: notes.map((n) => ({
              ...n,
              under: n.under ? { ...n.under } : undefined,
            })),
            peeledCount,
          },
        ]);

        setNotes(ev.nextNotes);

        // 60-Second Blitz fast-flow scoring & bonus time!
        if (currentLevel.isBlitz) {
          blitzStatsRef.current.sheetsPeeled += peeledCount;
          blitzStatsRef.current.maxStreak = Math.max(blitzStatsRef.current.maxStreak, nextCombo);

          // Streak milestone bonus (+1s every ×6 clean peels)
          if (nextCombo > 0 && nextCombo % 6 === 0 && ev.nextNotes.length > 0) {
            blitzStatsRef.current.bonusSec += 1;
            setBlitzTimeLeftMs((t) => Math.min(99_900, t + 1000));
            showBlitzBonusToast(`+1s STREAK ×${nextCombo}`, 'good');
          }

          setProgress((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalSheetsPeeled: prev.stats.totalSheetsPeeled + peeledCount,
              longestCleanStreak: Math.max(prev.stats.longestCleanStreak, nextCombo),
              ...(ev.nextNotes.length === 0
                ? {
                    totalWallsCleared: prev.stats.totalWallsCleared + 1,
                    spotlessClears: prev.stats.spotlessClears + (bumps === 0 ? 1 : 0),
                  }
                : {}),
            },
          }));

          if (ev.nextNotes.length === 0) {
            const isSpotless = bumps === 0;
            const bonusSec = isSpotless ? 4 : 2;
            const nextWalls = blitzStatsRef.current.wallsCleared + 1;
            blitzStatsRef.current.wallsCleared = nextWalls;
            if (isSpotless) blitzStatsRef.current.spotlessWalls += 1;
            blitzStatsRef.current.bonusSec += bonusSec;

            setBlitzWallsCleared(nextWalls);
            setBlitzTimeLeftMs((t) => Math.min(99_900, t + bonusSec * 1000));
            showBlitzBonusToast(
              isSpotless ? `+${bonusSec}s SPOTLESS!` : `+${bonusSec}s WALL #${nextWalls}`,
              'good'
            );
            sound.playVictory();
            if (boardRect) {
              particleRef.current?.emitBoardConfetti(
                {
                  left: boardRect.left,
                  top: boardRect.top,
                  width: boardRect.width,
                  height: boardRect.height,
                },
                { x: cx, y: cy }
              );
            }
            const nextBlitzWall = createBlitzLevel(nextWalls + 1, blitzRunSeed);
            startLevel(nextBlitzWall, true);
          }
          return;
        }

        // Weekly Bauhaus Exhibition intermediate stage transition (Stage 1 -> 2 -> 3)
        if (ev.nextNotes.length === 0 && currentLevel.isWeekly && weeklyRun && weeklyRun.stageIndex < 2) {
          const completedStageNum = weeklyRun.stageIndex + 1;
          const stageMs = getCurrentElapsedMs();
          const nextStageIndex = (weeklyRun.stageIndex + 1) as 1 | 2;
          const nextStageLevel = weeklyRun.stages[nextStageIndex];

          setProgress((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalSheetsPeeled: prev.stats.totalSheetsPeeled + peeledCount,
              totalWallsCleared: prev.stats.totalWallsCleared + 1,
              longestCleanStreak: Math.max(prev.stats.longestCleanStreak, nextCombo),
            },
          }));

          setCelebrationBanner(`Stage ${completedStageNum}/3 Cleared!`);
          setIsCelebratingClear(true);
          sound.playVictory();
          if (boardRect) {
            particleRef.current?.emitBoardConfetti(
              {
                left: boardRect.left,
                top: boardRect.top,
                width: boardRect.width,
                height: boardRect.height,
              },
              { x: cx, y: cy }
            );
          }

          setWeeklyRun((prev) =>
            prev
              ? {
                  ...prev,
                  stageIndex: nextStageIndex,
                  sheetsClearedPrior: prev.sheetsClearedPrior + initialTotalSheets,
                  elapsedMsPrior: prev.elapsedMsPrior + stageMs,
                  maxComboPrior: Math.max(prev.maxComboPrior, nextMaxCombo),
                }
              : prev
          );

          endModalTimerRef.current = window.setTimeout(() => {
            setIsCelebratingClear(false);
            startLevel(nextStageLevel, true, { preserveBumps: true, preserveWeekly: true });
          }, 760);
          return;
        }

        if (ev.nextNotes.length === 0) {
          triggerVictory(bumps, nextMaxCombo, { x: cx, y: cy }, peeledCount);
        } else {
          setProgress((prev) => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalSheetsPeeled: prev.stats.totalSheetsPeeled + peeledCount,
              longestCleanStreak: Math.max(prev.stats.longestCleanStreak, nextCombo),
            },
          }));
        }
      } else {
        // Blocked, taped-locked, or partner-blocked collision!
        const nextBumps = bumps + 1;
        sound.playBump(currentLevel.packId);
        particleRef.current?.emitBump(cx, cy, activeStyle.paperHex[note.color]);
        setCombo(0);
        setBumps(nextBumps);
        setAnimateSpawn(false);

        const fb: BlockerFeedback = {
          tappedId: ev.blameNote.id,
          tappedR: ev.blameNote.r,
          tappedC: ev.blameNote.c,
          dir: ev.blameNote.dir,
          blockerId: ev.blockerNote?.id ?? null,
          blockerR: ev.blockerR,
          blockerC: ev.blockerC,
          isObstacle: ev.blockerObstacle !== null,
          reason: ev.failureReason,
          tapeColor: ev.tapeColor,
          timestamp: Date.now(),
        };
        setBlockerFeedback(fb);

        if (blockerTimerRef.current) window.clearTimeout(blockerTimerRef.current);
        blockerTimerRef.current = window.setTimeout(() => {
          setBlockerFeedback(null);
        }, 560);

        if (currentLevel.isBlitz) {
          // In Blitz, bumps cost -2s off the clock rather than ending on 5 bumps
          showBlitzBonusToast('-2s BUMP', 'bad');
          setBlitzTimeLeftMs((t) => {
            const next = Math.max(0, t - 2000);
            if (next <= 0 && !blitzEndFiredRef.current) {
              window.setTimeout(() => finishBlitzRun(), 0);
            }
            return next;
          });
          return;
        }

        if (nextBumps >= MAX_BUMPS) {
          const elapsedSec = Math.max(
            1,
            Math.round((Date.now() - levelStartMsRef.current) / 1000)
          );
          setFailedElapsedSec(elapsedSec);
          endModalTimerRef.current = window.setTimeout(() => {
            sound.playFail();
            setScreen('FAILED');
          }, 340);
        }
      }
    },
    [
      activeTutorialMode,
      blitzRunSeed,
      bumps,
      combo,
      currentLevel,
      finishBlitzRun,
      getCurrentElapsedMs,
      initialTotalSheets,
      isCelebratingClear,
      maxCombo,
      notes,
      obstacles,
      progress.paperStyle,
      screen,
      showBlitzBonusToast,
      startLevel,
      triggerVictory,
      weeklyRun,
    ]
  );

  const handleUndo = useCallback(() => {
    if (screen !== 'PLAYING' || undoStack.length === 0 || isCelebratingClear) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setHint(null);
    setBlockerFeedback(null);
    setCombo(0);
    setAnimateSpawn(false);
    sound.playUndo();

    setProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalSheetsPeeled: Math.max(0, prev.stats.totalSheetsPeeled - last.peeledCount),
      },
    }));

    setNotes(last.prevNotes);
  }, [isCelebratingClear, screen, undoStack]);

  const handleRestart = useCallback(() => {
    if (currentLevel.isBlitz) {
      handleStartBlitz();
      return;
    }
    if (currentLevel.isWeekly) {
      handleStartWeekly();
      return;
    }
    sound.playClick();
    startLevel(currentLevel);
  }, [currentLevel, handleStartBlitz, handleStartWeekly, startLevel]);

  const handleHint = useCallback(() => {
    if (screen !== 'PLAYING' || notes.length === 0) return;

    if (hint && hint.tier === 1) {
      const existing = notes.find((n) => n.id === hint.noteId);
      if (
        existing &&
        evaluateNoteTap(existing, notes, obstacles, currentLevel.rows, currentLevel.cols).canPeel
      ) {
        sound.playHint();
        setHintsUsed((prev) => prev + 1);
        setHint({ noteId: existing.id, tier: 2 });
        return;
      }
    }

    const best = findBestHintNote(notes, obstacles, currentLevel.rows, currentLevel.cols);
    if (best) {
      sound.playHint();
      setHintsUsed((prev) => prev + 1);
      setHint({ noteId: best.id, tier: 1 });
    }
  }, [currentLevel.cols, currentLevel.rows, hint, notes, obstacles, screen]);

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const nextMuted = !prev.muted;
      sound.muted = nextMuted;
      if (!nextMuted) sound.playClick();
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    setProgress((prev) => {
      const nextMusicMuted = !prev.musicMuted;
      sound.setMusicMuted(nextMusicMuted);
      if (!sound.muted) sound.playClick();
      return { ...prev, musicMuted: nextMusicMuted };
    });
  }, []);

  const handleToggleTimeAttack = useCallback(() => {
    sound.playClick();
    setProgress((prev) => {
      const nextEnabled = !prev.timeAttackEnabled;
      if (nextEnabled) {
        // Fresh clean stopwatch start when toggling Time Attack on for the current level
        accumulatedMsRef.current = 0;
        runStartMsRef.current = performance.now();
        setLiveElapsedMs(0);
      }
      return { ...prev, timeAttackEnabled: nextEnabled };
    });
  }, []);

  const handleNextLevel = useCallback(() => {
    sound.playClick();
    if (victoryStats.newlyUnlockedPack) {
      startLevel(PACK_LEVELS[victoryStats.newlyUnlockedPack][0], true);
      return;
    }

    if (currentLevel.isWeekly) {
      handleStartBlitz();
      return;
    }

    if (currentLevel.isDaily) {
      const endlessTheme = getHighestUnlockedPack(progress.records, 'classic');
      startLevel(createEndlessLevel(progress.endlessCurrentLevel, endlessTheme), true);
      return;
    }

    if (currentLevel.isEndless) {
      const nextNum = (currentLevel.endlessNumber ?? 1) + 1;
      startLevel(createEndlessLevel(nextNum, currentLevel.packId), true);
      return;
    }

    const packLevels = PACK_LEVELS[currentLevel.packId];
    if (currentLevel.indexInPack + 1 < packLevels.length) {
      startLevel(packLevels[currentLevel.indexInPack + 1], true);
      return;
    }

    // Reached final level in pack: enter next pack if unlocked, else finish remaining walls in this pack
    const nextPack = getNextPackId(currentLevel.packId);
    if (nextPack && isPackUnlocked(nextPack, progress.records)) {
      startLevel(PACK_LEVELS[nextPack][0], true);
      return;
    }

    const firstUnfinishedInPack = packLevels.find((l) => !progress.records[l.id]);
    if (firstUnfinishedInPack) {
      startLevel(firstUnfinishedInPack, true);
    } else {
      const fallbackPack = getThemesForMode(currentLevel.mode)[0];
      startLevel(PACK_LEVELS[fallbackPack][0], true);
    }
  }, [
    currentLevel,
    handleStartBlitz,
    progress.endlessCurrentLevel,
    progress.records,
    startLevel,
    victoryStats.newlyUnlockedPack,
  ]);

  // Keyboard shortcuts across screens
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (activeTutorialMode !== null) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDismissTutorial();
        }
        return;
      }

      if (archiveTab !== null) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setArchiveTab(null);
        }
        return;
      }

      if (showLevelPicker) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowLevelPicker(false);
        }
        return;
      }

      if (screen === 'TITLE_MENU') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartPack(selectedTheme);
        }
        return;
      }

      if (screen === 'VICTORY') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextLevel();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          handleRestart();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleGoHome();
        }
        return;
      }

      if (screen === 'BLITZ_OVER') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartBlitz();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleGoHome();
        }
        return;
      }

      if (screen === 'FAILED') {
        if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
          e.preventDefault();
          handleRestart();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleGoHome();
        }
        return;
      }

      if (screen === 'PAUSED') {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setScreen('PLAYING');
        }
        return;
      }

      // Active PLAYING controls
      const lower = e.key.toLowerCase();
      if (e.key === 'Escape') {
        e.preventDefault();
        setScreen('PAUSED');
      } else if (lower === 'z' || e.key === 'Backspace') {
        e.preventDefault();
        handleUndo();
      } else if (lower === 'r') {
        e.preventDefault();
        handleRestart();
      } else if (lower === 'h') {
        e.preventDefault();
        handleHint();
      } else if (lower === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        setFocusedCell((prev) => {
          if (!prev) {
            const first = notes[0];
            return first ? { r: first.r, c: first.c } : { r: 0, c: 0 };
          }
          const nr = (prev.r + dr + currentLevel.rows) % currentLevel.rows;
          const nc = (prev.c + dc + currentLevel.cols) % currentLevel.cols;
          return { r: nr, c: nc };
        });
      } else if ((e.key === 'Enter' || e.key === ' ') && focusedCell) {
        e.preventDefault();
        const target = notes.find(
          (n) => n.r === focusedCell.r && n.c === focusedCell.c
        );
        if (target) {
          handleTapNote(target, null);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeTutorialMode,
    archiveTab,
    currentLevel.cols,
    currentLevel.rows,
    focusedCell,
    handleDismissTutorial,
    handleGoHome,
    handleHint,
    handleNextLevel,
    handleRestart,
    handleStartBlitz,
    handleStartPack,
    handleTapNote,
    handleToggleMute,
    handleUndo,
    notes,
    screen,
    selectedTheme,
    showLevelPicker,
  ]);

  const handleTitleParticlePeel = useCallback(
    (x: number, y: number, dir: Direction, colorHex: string) => {
      particleRef.current?.emitPeel(x, y, dir, colorHex);
    },
    []
  );

  const hasNextInPack =
    !currentLevel.isEndless &&
    !currentLevel.isDaily &&
    currentLevel.indexInPack + 1 < PACK_LEVELS[currentLevel.packId].length;

  const nextPackId = getNextPackId(currentLevel.packId);
  const nextPackUnlocked = Boolean(
    nextPackId && isPackUnlocked(nextPackId, progress.records)
  );

  // Live Daily Mission status (shown above board during Daily Puzzle)
  const dailyMissionLive = useMemo(() => {
    if (!currentLevel.isDaily || !currentLevel.dailyMission) return null;
    const m = currentLevel.dailyMission;
    if (m.kind === 'max_bumps') {
      const failed = bumps >= m.target;
      return {
        label: m.label,
        status: failed ? 'Missed' : `${bumps}/${m.target - 1} bumps`,
        state: failed ? ('missed' as const) : ('active' as const),
      };
    }
    if (m.kind === 'max_time') {
      const failed = liveElapsedMs >= m.target * 1000;
      const remSec = Math.max(0, (m.target * 1000 - liveElapsedMs) / 1000);
      return {
        label: m.label,
        status: failed ? 'Time up' : `${remSec.toFixed(1)}s left`,
        state: failed ? ('missed' as const) : ('active' as const),
      };
    }
    if (m.kind === 'no_hints') {
      const failed = hintsUsed > 0;
      return {
        label: m.label,
        status: failed ? 'Hint used' : '0 hints',
        state: failed ? ('missed' as const) : ('active' as const),
      };
    }
    const met = maxCombo >= m.target;
    return {
      label: m.label,
      status: met ? `×${maxCombo} Met` : `×${maxCombo}/×${m.target}`,
      state: met ? ('met' as const) : ('active' as const),
    };
  }, [bumps, currentLevel, hintsUsed, liveElapsedMs, maxCombo]);

  return (
    <>
      <ParticleCanvas ref={particleRef} />

      {showSplash && (
        <SplashScreen
          themeId={selectedTheme}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {screen === 'TITLE_MENU' ? (
        <TitleScreen
          selectedMode={selectedMode}
          selectedTheme={selectedTheme}
          progress={progress}
          muted={progress.muted}
          musicMuted={progress.musicMuted}
          onSelectMode={handleSelectMode}
          onSelectTheme={setSelectedTheme}
          onStartPack={handleStartPack}
          onOpenLevels={handleOpenLevelPicker}
          onOpenArchive={handleOpenArchive}
          onOpenGuide={() => setActiveTutorialMode(selectedMode)}
          onStartDaily={handleStartDaily}
          onStartWeekly={handleStartWeekly}
          onStartBlitz={handleStartBlitz}
          onStartEndless={() => handleStartEndless()}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onParticlePeel={handleTitleParticlePeel}
        />
      ) : (
        <div
          className={`${activeTheme.worldClass} relative flex h-dvh w-screen flex-col justify-between overflow-hidden transition-colors duration-500`}
        >
          {/* TOP BAUHAUS PERIMETER HUD */}
          <header className="z-20 flex w-full shrink-0 items-center justify-between gap-2.5 border-b-[3px] border-[#111111] px-4 py-2.5 sm:px-6 sm:py-3">
            {/* Left: Pause Button + Clean Level Name Picker Trigger (no subtitle) */}
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setScreen('PAUSED');
                }}
                aria-label="Pause game"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <Pause className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  handleOpenLevelPicker(currentLevel.packId);
                }}
                aria-label={`Current level: ${currentLevel.title}. Tap to switch wall`}
                className="group flex h-10 min-w-0 cursor-pointer items-center gap-1.5 border-2 border-[#111111] bg-[#f5f0e2] px-3 text-left text-[#111111] shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <span className="font-display truncate text-sm font-black tracking-tight uppercase leading-none sm:text-base">
                  {currentLevel.title}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>

            {/* Right: Clean Tabular Telemetry + Music & Sound */}
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
              <div className="flex items-center gap-2.5 text-xs font-bold sm:gap-3 sm:text-sm">
                <div className="flex items-baseline gap-1">
                  <span className="hidden uppercase opacity-75 sm:inline">Left</span>
                  <span className="font-mono-num text-sm font-extrabold sm:text-base">
                    {sheetsRemaining}
                  </span>
                </div>

                <span aria-hidden="true" className="opacity-40">
                  ·
                </span>

                <div className="flex items-baseline gap-1">
                  <span className="hidden uppercase opacity-75 sm:inline">Bumps</span>
                  <span
                    className={`font-mono-num text-sm font-extrabold sm:text-base ${
                      bumps >= MAX_BUMPS - 1
                        ? 'text-[#d6302a]'
                        : bumps > 0
                          ? activeTheme.isDark
                            ? 'text-[#e4b43c]'
                            : 'text-[#b45309]'
                          : ''
                    }`}
                  >
                    {bumps}/{MAX_BUMPS}
                  </span>
                </div>

                <span aria-hidden="true" className="hidden opacity-40 sm:inline">
                  ·
                </span>

                <div
                  aria-label={`Current rating: ${liveStars} out of 3 stars`}
                  className="hidden items-center gap-0.5 sm:flex"
                >
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= liveStars
                          ? 'fill-[#e4b43c] text-[#111111]'
                          : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  aria-label={progress.musicMuted ? 'Unmute background music' : 'Mute background music'}
                  title={progress.musicMuted ? 'Music Off' : 'Music On'}
                  className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <Music className={`h-4 w-4 ${progress.musicMuted ? 'text-[#d6302a]' : ''}`} />
                  {progress.musicMuted && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute h-[2.5px] w-5 rotate-45 bg-[#d6302a]"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={progress.muted ? 'Unmute sound effects' : 'Mute sound effects'}
                  title={progress.muted ? 'Sound Off' : 'Sound On'}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  {progress.muted ? (
                    <VolumeX className="h-4 w-4 text-[#d6302a]" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* BAUHAUS WALL COMPLETION PROGRESS BAR (fills smoothly as notes are peeled) */}
          <div
            role="progressbar"
            aria-label="Wall completion progress"
            aria-valuemin={0}
            aria-valuemax={initialTotalSheets}
            aria-valuenow={sheetsPeeled}
            className="relative z-20 h-2.5 w-full shrink-0 overflow-hidden border-b-[3px] border-[#111111] bg-[#f5f0e2]"
          >
            {/* Filled Bauhaus primary bar */}
            <div
              style={{
                transform: `scaleX(${peelProgressRatio})`,
                transformOrigin: 'left center',
              }}
              className={`h-full w-full transition-transform duration-300 ease-out ${
                peelProgressRatio >= 1
                  ? 'bg-[#10b981]'
                  : activeTheme.visualBase === 'cork'
                    ? 'bg-[#d6302a]'
                    : 'bg-[#e4b43c]'
              }`}
            />
            {/* Crisp leading ink marker along the progress edge */}
            {peelProgressRatio > 0 && peelProgressRatio < 1 && (
              <div
                aria-hidden="true"
                style={{ left: `${peelProgressRatio * 100}%` }}
                className="pointer-events-none absolute top-0 bottom-0 w-[2px] -translate-x-1/2 bg-[#111111] transition-[left] duration-300 ease-out"
              />
            )}
            {/* Subtle Bauhaus vertical grid subdivisions */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid grid-cols-10 divide-x divide-[#111111]/15"
            >
              {Array.from({ length: 10 }).map((_, idx) => (
                <span key={idx} />
              ))}
            </div>
          </div>

          {/* CENTER STAGE: BLITZ / WEEKLY / TIME ATTACK STRIP + UNOBSTRUCTED BAUHAUS BOARD */}
          <main className="relative flex flex-1 flex-col items-center justify-center gap-2 px-3 py-1">
            {currentLevel.isBlitz ? (
              /* 60-SECOND BLITZ LIVE COUNTDOWN HUD */
              <div className="z-20 flex w-full max-w-[532px] items-center justify-between gap-2 px-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`font-mono-num flex h-9 items-center gap-1.5 border-2 border-[#111111] px-3 text-base font-black shadow-[3px_3px_0_#111111] ${
                      blitzTimeLeftMs <= 10_000
                        ? 'bg-[#d6302a] text-[#faf6ea]'
                        : 'bg-[#e4b43c] text-[#111111]'
                    }`}
                  >
                    <Zap className="h-4 w-4 shrink-0 fill-current" />
                    <span>{(blitzTimeLeftMs / 1000).toFixed(1)}s</span>
                  </div>

                  <div className="font-mono-num flex h-9 items-center gap-1 border-2 border-[#111111] bg-[#f5f0e2] px-2.5 text-xs font-extrabold text-[#111111] shadow-[2px_2px_0_#111111]">
                    <span className="opacity-65 uppercase">Walls</span>
                    <span className="text-sm font-black">{blitzWallsCleared}</span>
                  </div>
                </div>

                {blitzToast ? (
                  <div
                    key={blitzToast.key}
                    className={`combo-pop font-mono-num border-2 border-[#111111] px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#111111] ${
                      blitzToast.tone === 'good'
                        ? 'bg-[#10b981] text-[#111111]'
                        : 'bg-[#d6302a] text-[#faf6ea]'
                    }`}
                  >
                    {blitzToast.text}
                  </div>
                ) : combo >= 2 ? (
                  <div
                    key={`combo-${combo}`}
                    className="combo-pop font-display text-sm font-black uppercase"
                  >
                    ×{combo} Streak
                  </div>
                ) : (
                  <div className="font-mono-num text-[11px] font-bold opacity-80">
                    Spotless +4s · Bump -2s
                  </div>
                )}
              </div>
            ) : currentLevel.isWeekly && weeklyRun ? (
              /* WEEKLY BAUHAUS EXHIBITION 3-STAGE GAUNTLET BAR */
              <div className="z-20 flex w-full max-w-[532px] flex-col gap-1.5 px-0.5">
                <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                  <div className="font-display flex items-center gap-1.5 uppercase">
                    <Medal className="h-4 w-4 text-[#e4b43c]" />
                    <span>
                      {formatWeekLabel(weeklyRun.weekKey)} Exhibition ·{' '}
                      {currentLevel.weeklyStageLabel}
                    </span>
                  </div>
                  <span className="font-mono-num text-[11px] font-black opacity-85">
                    Shared Bumps {bumps}/{MAX_BUMPS}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['1. Classic', '2. Mixed', '3. Lab Boss'] as const).map((label, idx) => {
                    const done = idx < weeklyRun.stageIndex;
                    const active = idx === weeklyRun.stageIndex;
                    return (
                      <div
                        key={label}
                        className={`font-mono-num flex items-center justify-center gap-1 border-2 border-[#111111] py-1 text-[10px] font-black uppercase ${
                          done
                            ? 'bg-[#10b981] text-[#111111]'
                            : active
                              ? 'bg-[#e4b43c] text-[#111111] shadow-[2px_2px_0_#111111]'
                              : 'bg-[#f5f0e2]/75 text-[#111111]/55'
                        }`}
                      >
                        {done && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* STANDARD TIME ATTACK STOPWATCH STRIP */
              <div className="z-20 flex w-full max-w-[532px] items-center justify-between gap-2 px-0.5">
                <button
                  type="button"
                  onClick={handleToggleTimeAttack}
                  aria-pressed={progress.timeAttackEnabled}
                  className={`font-display flex h-8 cursor-pointer items-center gap-1.5 border-2 border-[#111111] px-2.5 text-xs font-extrabold uppercase shadow-[2px_2px_0_#111111] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-none whitespace-nowrap ${
                    progress.timeAttackEnabled
                      ? 'bg-[#e4b43c] text-[#111111]'
                      : 'bg-[#f5f0e2] text-[#111111] hover:bg-white'
                  }`}
                >
                  <Timer className="h-3.5 w-3.5 shrink-0" />
                  <span>Time Attack</span>
                  <span className="opacity-70">{progress.timeAttackEnabled ? 'On' : 'Off'}</span>
                </button>

                {progress.timeAttackEnabled ? (
                  <div className="font-mono-num flex items-center gap-2.5 text-sm font-extrabold">
                    <span aria-live="off" className="flex items-center gap-1.5 tracking-tight">
                      <Timer className="h-4 w-4 text-[#e4b43c]" />
                      {formatStopwatchMs(liveElapsedMs)}
                    </span>
                    {(() => {
                      const rec =
                        currentLevel.isDaily && currentLevel.dailyDateKey
                          ? progress.dailyRecords[currentLevel.dailyDateKey]
                          : !currentLevel.isEndless
                            ? progress.records[currentLevel.id]
                            : undefined;
                      if (rec?.bestTimeMs === undefined) return null;
                      return (
                        <>
                          <span aria-hidden="true" className="opacity-40">
                            ·
                          </span>
                          <span className="text-xs font-bold opacity-80">
                            Best {formatStopwatchMs(rec.bestTimeMs)}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                ) : combo >= 2 ? (
                  <div
                    key={`combo-${combo}`}
                    aria-live="polite"
                    className="combo-pop font-display text-sm font-black tracking-tight uppercase sm:text-base"
                  >
                    ×{combo} Clean Streak
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            )}

            {/* Daily Mission Goal Strip (Daily Puzzle only, inline typography above board) */}
            {dailyMissionLive && (
              <div className="z-20 flex w-full max-w-[532px] items-center justify-between gap-2 px-0.5 text-xs font-bold">
                <div className="flex min-w-0 items-center gap-1.5">
                  {dailyMissionLive.state === 'met' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Target
                      className={`h-3.5 w-3.5 shrink-0 ${
                        dailyMissionLive.state === 'missed'
                          ? 'text-[#d6302a]'
                          : 'text-[#e4b43c]'
                      }`}
                    />
                  )}
                  <span className="truncate">
                    Daily Mission: {dailyMissionLive.label}
                  </span>
                </div>
                <span
                  className={`font-mono-num shrink-0 font-extrabold ${
                    dailyMissionLive.state === 'met'
                      ? 'text-emerald-500'
                      : dailyMissionLive.state === 'missed'
                        ? 'text-[#d6302a]'
                        : activeTheme.isDark
                          ? 'text-[#e4b43c]'
                          : 'text-[#2b56a3]'
                  }`}
                >
                  {dailyMissionLive.status}
                </span>
              </div>
            )}

            {progress.timeAttackEnabled && !currentLevel.isBlitz && !currentLevel.isWeekly && combo >= 2 && (
              <div
                key={`combo-${combo}`}
                aria-live="polite"
                className="combo-pop font-display pointer-events-none absolute top-9 left-1/2 z-30 -translate-x-1/2 text-sm font-black tracking-tight uppercase sm:text-base"
              >
                ×{combo} Clean Streak
              </div>
            )}

            <div
              ref={boardContainerRef}
              className={`relative ${
                boardTransition === 'out'
                  ? 'board-slide-out'
                  : boardTransition === 'in'
                    ? 'board-slide-in'
                    : ''
              }`}
            >
              <GameBoard
                rows={currentLevel.rows}
                cols={currentLevel.cols}
                notes={notes}
                peelingGhosts={peelingGhosts}
                obstacles={obstacles}
                theme={activeTheme}
                paperStyle={progress.paperStyle}
                animateSpawn={animateSpawn}
                levelKey={levelInstanceKey}
                blockerFeedback={blockerFeedback}
                hint={hint}
                focusedCell={focusedCell}
                onTapNote={handleTapNote}
              />

              {isCelebratingClear && (
                <div
                  aria-live="polite"
                  className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                >
                  <div className="combo-pop font-display border-[3px] border-[#111111] bg-[#e4b43c] px-5 py-2 text-lg font-black tracking-wider text-[#111111] uppercase shadow-[5px_5px_0_#111111] sm:text-xl">
                    {celebrationBanner}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* BOTTOM BAUHAUS ACTION BAR */}
          <footer className="z-20 flex w-full shrink-0 items-center justify-center border-t-[3px] border-[#111111] px-4 py-3 sm:py-4">
            <div className="flex w-full max-w-md items-center justify-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="font-display flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#f5f0e2] px-4 text-xs font-extrabold tracking-wide text-[#111111] uppercase shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 whitespace-nowrap sm:text-sm"
              >
                <Undo2 className="h-4 w-4 shrink-0" />
                <span>Undo</span>
                {undoStack.length > 0 && (
                  <span className="font-mono-num text-xs opacity-70">{undoStack.length}</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="font-display flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] bg-[#2b56a3] px-4 text-xs font-extrabold tracking-wide text-[#faf6ea] uppercase shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 hover:bg-[#244a8e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none whitespace-nowrap sm:text-sm"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={handleHint}
                disabled={notes.length === 0}
                className={`font-display flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] px-4 text-xs font-extrabold tracking-wide uppercase shadow-[3px_3px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-45 whitespace-nowrap sm:text-sm ${
                  hint
                    ? 'bg-[#10b981] text-[#111111]'
                    : 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]'
                }`}
              >
                <Lightbulb className="h-4 w-4 shrink-0" />
                <span>{hint?.tier === 1 ? 'Show Lane' : 'Hint'}</span>
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* MODALS */}
      {activeTutorialMode !== null && (
        <ModeTutorialModal
          mode={activeTutorialMode}
          context={screen === 'TITLE_MENU' ? 'lobby' : 'level'}
          onDismiss={handleDismissTutorial}
        />
      )}

      {archiveTab !== null && activeTutorialMode === null && (
        <StudioArchiveModal
          progress={progress}
          initialTab={archiveTab}
          onSelectPaperStyle={handleSelectPaperStyle}
          onClose={() => setArchiveTab(null)}
        />
      )}

      {showLevelPicker && archiveTab === null && activeTutorialMode === null && (
        <LevelPickerModal
          currentLevel={currentLevel}
          initialPack={pickerInitialPack}
          progress={progress}
          onSelectLevel={(lvl) => {
            if (!isPackUnlocked(lvl.packId, progress.records)) return;
            startLevel(lvl, true);
          }}
          onSelectDaily={handleStartDaily}
          onSelectWeekly={handleStartWeekly}
          onSelectBlitz={handleStartBlitz}
          onSelectEndless={(packId) => handleStartEndless(packId)}
          onClose={() => setShowLevelPicker(false)}
        />
      )}

      {screen === 'PAUSED' && !showLevelPicker && archiveTab === null && activeTutorialMode === null && (
        <PauseModal
          level={currentLevel}
          muted={progress.muted}
          musicMuted={progress.musicMuted}
          onResume={() => {
            sound.playClick();
            setScreen('PLAYING');
          }}
          onRestart={handleRestart}
          onOpenLevels={() => {
            sound.playClick();
            setScreen('PLAYING');
            handleOpenLevelPicker(currentLevel.packId);
          }}
          onOpenArchive={(tab) => {
            sound.playClick();
            handleOpenArchive(tab);
          }}
          onOpenTutorial={() => {
            sound.playClick();
            setScreen('PLAYING');
            setActiveTutorialMode(currentLevel.mode);
          }}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onTitleScreen={handleGoHome}
        />
      )}

      {screen === 'VICTORY' && !showLevelPicker && archiveTab === null && activeTutorialMode === null && (
        <VictoryModal
          level={currentLevel}
          starsEarned={victoryStats.stars}
          sheetsPeeled={victoryStats.sheets}
          bumps={bumps}
          elapsedSec={victoryStats.elapsedSec}
          elapsedMs={victoryStats.elapsedMs}
          timeAttackActive={progress.timeAttackEnabled}
          bestTimeMs={victoryStats.bestTimeMs}
          isNewBestTime={victoryStats.isNewBestTime}
          maxCombo={victoryStats.maxCombo}
          dailyStreak={progress.dailyStreak}
          dailyMissionCompleted={victoryStats.dailyMissionCompleted}
          newlyUnlockedPack={victoryStats.newlyUnlockedPack}
          newlyUnlockedAchievements={victoryStats.newlyUnlockedAchievements}
          newlyUnlockedStyles={victoryStats.newlyUnlockedStyles}
          hasNextLevelInPack={hasNextInPack}
          nextPackUnlocked={nextPackUnlocked}
          onReplay={handleRestart}
          onNext={handleNextLevel}
          onHome={handleGoHome}
          onOpenLevels={() => {
            sound.playClick();
            handleOpenLevelPicker(
              victoryStats.newlyUnlockedPack ?? currentLevel.packId
            );
          }}
          onOpenArchive={(tab) => handleOpenArchive(tab)}
        />
      )}

      {screen === 'FAILED' && !showLevelPicker && archiveTab === null && activeTutorialMode === null && (
        <FailedModal
          level={currentLevel}
          sheetsRemaining={sheetsRemaining}
          bumps={bumps}
          elapsedSec={failedElapsedSec}
          onRetry={handleRestart}
          onHome={handleGoHome}
          onOpenLevels={() => {
            sound.playClick();
            handleOpenLevelPicker(currentLevel.packId);
          }}
        />
      )}

      {screen === 'BLITZ_OVER' &&
        blitzResult &&
        !showLevelPicker &&
        archiveTab === null &&
        activeTutorialMode === null && (
          <BlitzResultModal
            run={blitzResult.run}
            leaderboard={progress.blitzLeaderboard}
            isNewBest={blitzResult.isNewBest}
            newlyUnlockedAchievements={blitzResult.newlyUnlockedAchievements}
            onPlayAgain={handleStartBlitz}
            onHome={handleGoHome}
            onOpenArchive={(tab) => handleOpenArchive(tab)}
          />
        )}
    </>
  );
}
