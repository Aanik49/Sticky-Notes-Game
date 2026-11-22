import {
  ActiveNote,
  Direction,
  LevelDef,
  NoteSpec,
  ObstacleSpec,
  PaperColor,
  ThemeId,
} from './types';

export const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  U: { dr: -1, dc: 0 },
  D: { dr: 1, dc: 0 },
  L: { dr: 0, dc: -1 },
  R: { dr: 0, dc: 1 },
};

export const ALL_DIRS: Direction[] = ['U', 'D', 'L', 'R'];

export const PAPER_COLORS: PaperColor[] = [
  'canary',
  'coral',
  'sky',
  'mint',
  'apricot',
  'lavender',
];

export const PAPER_HEX: Record<PaperColor, string> = {
  canary: '#fde047',
  coral: '#fb7185',
  sky: '#38bdf8',
  mint: '#4ade80',
  apricot: '#fb923c',
  lavender: '#c084fc',
};

export interface PathCheckResult {
  clear: boolean;
  blockerNote: ActiveNote | null;
  blockerObstacle: ObstacleSpec | null;
  blockerR: number;
  blockerC: number;
}

/**
 * Checks whether `note` has an unobstructed ray along its arrow direction
 * to the edge of the board.
 */
export function checkNotePath(
  note: Pick<ActiveNote, 'r' | 'c' | 'dir'>,
  allNotes: ActiveNote[],
  obstacles: ObstacleSpec[],
  rows: number,
  cols: number
): PathCheckResult {
  const { dr, dc } = DIR_DELTA[note.dir];
  let r = note.r + dr;
  let c = note.c + dc;

  while (r >= 0 && r < rows && c >= 0 && c < cols) {
    const obs = obstacles.find((o) => o.r === r && o.c === c);
    if (obs) {
      return {
        clear: false,
        blockerNote: null,
        blockerObstacle: obs,
        blockerR: r,
        blockerC: c,
      };
    }

    const blocker = allNotes.find((n) => n.r === r && n.c === c);
    if (blocker) {
      return {
        clear: false,
        blockerNote: blocker,
        blockerObstacle: null,
        blockerR: r,
        blockerC: c,
      };
    }

    r += dr;
    c += dc;
  }

  return {
    clear: true,
    blockerNote: null,
    blockerObstacle: null,
    blockerR: r,
    blockerC: c,
  };
}

/**
 * Verifies a level (including stacked under-notes and static obstacles) is 100% solvable.
 * Because peeling an unblocked note strictly removes a blocker (or exposes its under-note
 * in the same cell without adding blockers), any greedy sequence of valid peels is
 * confluent — if ANY peel sequence clears the board, EVERY greedy sequence does!
 */
export function verifyLevelSolvable(level: LevelDef): boolean {
  const sim: ActiveNote[] = level.notes.map((n, idx) => ({
    id: `sim-${idx}`,
    r: n.r,
    c: n.c,
    dir: n.dir,
    color: n.color,
    tilt: 0,
    under: n.under ? { ...n.under } : undefined,
  }));
  const obstacles = level.obstacles ?? [];

  let progressed = true;
  while (sim.length > 0 && progressed) {
    progressed = false;
    for (let i = 0; i < sim.length; i++) {
      const note = sim[i];
      if (checkNotePath(note, sim, obstacles, level.rows, level.cols).clear) {
        if (note.under) {
          sim[i] = {
            ...note,
            dir: note.under.dir,
            color: note.under.color,
            under: undefined,
          };
        } else {
          sim.splice(i, 1);
        }
        progressed = true;
        break;
      }
    }
  }

  return sim.length === 0;
}

/**
 * Picks the most helpful peelable note for a hint — prefers notes that unblock
 * the highest number of other notes on the board!
 */
export function findBestHintNote(
  notes: ActiveNote[],
  obstacles: ObstacleSpec[],
  rows: number,
  cols: number
): ActiveNote | null {
  const peelable = notes.filter(
    (n) => checkNotePath(n, notes, obstacles, rows, cols).clear
  );
  if (peelable.length === 0) return null;

  let best = peelable[0];
  let bestScore = -1;

  for (const candidate of peelable) {
    const nextNotes = candidate.under
      ? notes.map((n) =>
          n.id === candidate.id
            ? { ...n, dir: candidate.under!.dir, color: candidate.under!.color, under: undefined }
            : n
        )
      : notes.filter((n) => n.id !== candidate.id);

    let unlockedCount = 0;
    for (const other of nextNotes) {
      if (checkNotePath(other, nextNotes, obstacles, rows, cols).clear) {
        unlockedCount++;
      }
    }

    if (unlockedCount > bestScore) {
      bestScore = unlockedCount;
      best = candidate;
    }
  }

  return best;
}

/**
 * Deterministic PRNG (Mulberry32) so curated generated levels & endless seeds
 * are reproducible and consistent across reloads.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GeneratorOptions {
  seed: number;
  id: string;
  packId: ThemeId;
  indexInPack: number;
  title: string;
  difficulty: LevelDef['difficulty'];
  rows: number;
  cols: number;
  targetNotes: number;
  obstacleCount?: number;
  doubleCount?: number;
  isEndless?: boolean;
  endlessNumber?: number;
  isDaily?: boolean;
  dailyDateKey?: string;
}

/**
 * Reverse-Peel Procedural Generator:
 * Places static obstacles first, then places notes in REVERSE peel order!
 * When placing a note, we pick an empty cell and choose a direction that has
 * NO obstacles and NO previously-placed (later-peeled) notes in its ray —
 * actually wait: in reverse peel order, the note we place FIRST will be peeled LAST.
 * So when the player solves the puzzle, the LAST-placed note is peeled FIRST!
 * Therefore, a newly placed note (peeled EARLIER) must have a clear path past
 * ALL currently placed notes (which are still on the board when this note peels),
 * AND we strongly prefer directions that POINT ACROSS empty cells where future
 * earlier-peeled notes can sit, or that BLOCK already-placed notes!
 *
 * Wait — let's double-check that invariant!
 * Suppose at step k, set S_k is the set of notes ALREADY placed (they will remain
 * on the board AFTER the new note x is peeled).
 * When the player peels x, all notes in S_k are STILL on the board!
 * So x MUST have a clear path past all notes in S_k AND all obstacles!
 * Meanwhile, x itself CAN block notes in S_k — because x will be peeled BEFORE S_k!
 * That guarantees 100% solvability AND creates deep, rewarding dependency chains!
 */
export function generateSolvableLevel(opts: GeneratorOptions): LevelDef {
  const rng = mulberry32(opts.seed);
  const { rows, cols, targetNotes } = opts;
  const obstacleCount = opts.obstacleCount ?? 0;
  const doubleCount = opts.doubleCount ?? 0;

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // 1. Place obstacles in interior/varied spots (never trapping all 4 edges)
  const obstacles: ObstacleSpec[] = [];
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  let obsAttempts = 0;
  while (obstacles.length < obstacleCount && obsAttempts < 80) {
    obsAttempts++;
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (occupied.has(key(r, c))) continue;
    // Keep obstacles spaced out so they look intentional and sculptural
    const tooClose = obstacles.some(
      (o) => Math.abs(o.r - r) + Math.abs(o.c - c) <= 1
    );
    if (tooClose && obsAttempts < 40) continue;

    occupied.add(key(r, c));
    obstacles.push({
      r,
      c,
      variant: (obstacles.length % 3) as 0 | 1 | 2,
    });
  }

  // Helper: check if ray from (r,c) in dir hits any obstacle or currently placed note
  const rayClearOf = (
    r: number,
    c: number,
    dir: Direction,
    placed: ActiveNote[]
  ): boolean => {
    const { dr, dc } = DIR_DELTA[dir];
    let cr = r + dr;
    let cc = c + dc;
    while (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
      if (obstacles.some((o) => o.r === cr && o.c === cc)) return false;
      if (placed.some((n) => n.r === cr && n.c === cc)) return false;
      cr += dr;
      cc += dc;
    }
    return true;
  };

  // Helper: count how many ALREADY-placed notes would be blocked by placing a note at (r,c)
  const countBlockedExisting = (
    r: number,
    c: number,
    placed: ActiveNote[]
  ): number => {
    let count = 0;
    for (const n of placed) {
      const { dr, dc } = DIR_DELTA[n.dir];
      if (dr !== 0 && n.c === c && (r - n.r) * dr > 0) count++;
      if (dc !== 0 && n.r === r && (c - n.c) * dc > 0) count++;
    }
    return count;
  };

  // 2. Build notes in reverse peel order (placed[0] peeled last, placed[last] peeled first)
  const placed: ActiveNote[] = [];
  const palette: PaperColor[] = [...PAPER_COLORS];

  for (let step = 0; step < targetNotes; step++) {
    interface Candidate {
      r: number;
      c: number;
      dir: Direction;
      score: number;
    }
    const candidates: Candidate[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (occupied.has(key(r, c))) continue;
        const blocksCount = countBlockedExisting(r, c, placed);

        for (const dir of ALL_DIRS) {
          if (!rayClearOf(r, c, dir, placed)) continue;

          // Score favors creating real interlocking dependencies & inward-facing arrows
          // (arrows that travel across more cells before hitting the edge create richer chains)
          const { dr, dc } = DIR_DELTA[dir];
          let rayLen = 0;
          let rr = r + dr;
          let cc = c + dc;
          while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
            rayLen++;
            rr += dr;
            cc += dc;
          }

          // Early placed notes (peeled last) should point INWARD so later notes can block them!
          // Late placed notes (peeled first) should block existing notes!
          const inwardBonus = step < targetNotes * 0.65 ? rayLen * 2.2 : rayLen * 0.6;
          const chainBonus = blocksCount * 4.5;
          const jitter = rng() * 2.8;

          candidates.push({
            r,
            c,
            dir,
            score: inwardBonus + chainBonus + jitter,
          });
        }
      }
    }

    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.score - a.score);
    // Pick from top few candidates for natural variety
    const topSlice = candidates.slice(0, Math.min(4, candidates.length));
    const chosen = pick(topSlice);

    // Choose a paper color avoiding identical adjacent neighbors where possible
    const neighborColors = new Set(
      placed
        .filter((n) => Math.abs(n.r - chosen.r) + Math.abs(n.c - chosen.c) === 1)
        .map((n) => n.color)
    );
    const availableColors = palette.filter((col) => !neighborColors.has(col));
    const color = pick(availableColors.length > 0 ? availableColors : palette);

    occupied.add(key(chosen.r, chosen.c));
    placed.push({
      id: `gen-${step}`,
      r: chosen.r,
      c: chosen.c,
      dir: chosen.dir,
      color,
      tilt: 0,
    });
  }

  // 3. Optionally upgrade some notes into 2-layer stacked notes!
  // For a stacked note at (r,c), its TOP layer peels earlier (so must clear all notes
  // remaining when it peels), and its UNDER layer peels at the note's original step.
  // Specifically: if we assign the existing `note.dir` as `under.dir`, and pick a new `top.dir`
  // that is clear of ALL notes currently on the board (or all notes peeled after it), it stays 100% solvable!
  let doublesAdded = 0;
  if (doubleCount > 0 && placed.length >= 4) {
    // Try upgrading notes starting from earlier-peeled ones (higher indices in `placed`)
    for (let idx = placed.length - 1; idx >= 0 && doublesAdded < doubleCount; idx--) {
      const target = placed[idx];
      const remainingWhenPeeled = placed.slice(0, idx);
      const otherDirs = ALL_DIRS.filter(
        (d) => d !== target.dir && rayClearOf(target.r, target.c, d, remainingWhenPeeled)
      );
      if (otherDirs.length > 0) {
        const topDir = pick(otherDirs);
        const topColor = pick(palette.filter((c) => c !== target.color));
        const underDir = target.dir;
        const underColor = target.color;
        target.dir = topDir;
        target.color = topColor;
        target.under = { dir: underDir, color: underColor };
        doublesAdded++;
      }
    }
  }

  const notes: NoteSpec[] = placed.map((n) => ({
    r: n.r,
    c: n.c,
    dir: n.dir,
    color: n.color,
    ...(n.under ? { under: n.under } : {}),
  }));

  const level: LevelDef = {
    id: opts.id,
    packId: opts.packId,
    indexInPack: opts.indexInPack,
    title: opts.title,
    difficulty: opts.difficulty,
    rows,
    cols,
    notes,
    obstacles: obstacles.length > 0 ? obstacles : undefined,
    isEndless: opts.isEndless,
    endlessNumber: opts.endlessNumber,
    isDaily: opts.isDaily,
    dailyDateKey: opts.dailyDateKey,
  };

  return level;
}
