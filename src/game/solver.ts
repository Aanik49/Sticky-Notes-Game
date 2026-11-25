import {
  ActiveNote,
  Direction,
  GameMode,
  LevelDef,
  NoteSpec,
  ObstacleSpec,
  PaperColor,
  TapeColor,
  ThemeId,
} from './types';

export const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  U: { dr: -1, dc: 0 },
  D: { dr: 1, dc: 0 },
  L: { dr: 0, dc: -1 },
  R: { dr: 0, dc: 1 },
};

export const ALL_DIRS: Direction[] = ['U', 'D', 'L', 'R'];

const CW_ORDER: Direction[] = ['U', 'R', 'D', 'L'];

export function rotateDirCW(dir: Direction, steps = 1): Direction {
  const idx = CW_ORDER.indexOf(dir);
  return CW_ORDER[(idx + ((steps % 4) + 4)) % 4];
}

export function rotateDirCCW(dir: Direction, steps = 1): Direction {
  return rotateDirCW(dir, -steps);
}

export const PAPER_COLORS: PaperColor[] = [
  'canary',
  'coral',
  'sky',
  'mint',
  'apricot',
  'lavender',
];

export const PAPER_HEX: Record<PaperColor, string> = {
  canary: '#e4b43c',
  coral: '#d6302a',
  sky: '#2b56a3',
  mint: '#f3eee0',
  apricot: '#dc6b2f',
  lavender: '#1e6b64',
};

export const TAPE_COLOR_META: Record<
  TapeColor,
  { hex: string; border: string; text: string; label: string }
> = {
  red: { hex: '#d6302a', border: '#111111', text: '#faf6ea', label: 'Red' },
  blue: { hex: '#2b56a3', border: '#111111', text: '#faf6ea', label: 'Blue' },
  gold: { hex: '#e4b43c', border: '#111111', text: '#111111', label: 'Gold' },
};

const TAPE_COLOR_ORDER: TapeColor[] = ['red', 'blue', 'gold'];
const LINK_IDS = ['A', 'B', 'C', 'D'];

export interface PathCheckResult {
  clear: boolean;
  blockerNote: ActiveNote | null;
  blockerObstacle: ObstacleSpec | null;
  blockerR: number;
  blockerC: number;
}

/** Returns true if a Taped Note's matching Key Note is still present on the board */
export function isNoteTapedLocked(
  note: Pick<ActiveNote, 'tapeColor'>,
  allNotes: ActiveNote[]
): boolean {
  if (!note.tapeColor) return false;
  return allNotes.some((other) => other.keyColor === note.tapeColor);
}

export function getKeyNoteForTape(
  tapeColor: TapeColor,
  allNotes: ActiveNote[]
): ActiveNote | null {
  return allNotes.find((other) => other.keyColor === tapeColor) ?? null;
}

export function getLinkedPartner(
  note: ActiveNote,
  allNotes: ActiveNote[]
): ActiveNote | null {
  if (!note.linkId) return null;
  return allNotes.find((other) => other.id !== note.id && other.linkId === note.linkId) ?? null;
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
  cols: number,
  ignoreIds?: Set<string>
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

    const blocker = allNotes.find(
      (n) => n.r === r && n.c === c && (!ignoreIds || !ignoreIds.has(n.id))
    );
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

export interface TapEvaluation {
  canPeel: boolean;
  peeledNotes: ActiveNote[];
  nextNotes: ActiveNote[];
  unlockedTapeColors: TapeColor[];
  rotatedPivotCount: number;
  failureReason?: 'blocked' | 'taped' | 'partner_blocked';
  /** The note whose bump animation should play (normally tapped note, or partner if partner blocked chain) */
  blameNote: ActiveNote;
  blockerNote: ActiveNote | null;
  blockerObstacle: ObstacleSpec | null;
  blockerR: number;
  blockerC: number;
  tapeColor?: TapeColor;
}

/**
 * Full rule evaluator for tapping a note (supports Classic + all 3 Studio Lab mechanics):
 * 1. Taped / Locked Notes: cannot peel while matching Key Note exists.
 * 2. Chain-Peel (Linked) Notes: both linked partners peel simultaneously if BOTH are unlocked & clear.
 * 3. Rotating / Pivot Notes: every remaining pivot note rotates 90° clockwise after a valid peel.
 */
export function evaluateNoteTap(
  note: ActiveNote,
  allNotes: ActiveNote[],
  obstacles: ObstacleSpec[],
  rows: number,
  cols: number
): TapEvaluation {
  // 1. Check if tapped note itself is taped-locked
  if (note.tapeColor && isNoteTapedLocked(note, allNotes)) {
    const keyNote = getKeyNoteForTape(note.tapeColor, allNotes);
    return {
      canPeel: false,
      peeledNotes: [],
      nextNotes: allNotes,
      unlockedTapeColors: [],
      rotatedPivotCount: 0,
      failureReason: 'taped',
      blameNote: note,
      blockerNote: keyNote,
      blockerObstacle: null,
      blockerR: keyNote ? keyNote.r : note.r,
      blockerC: keyNote ? keyNote.c : note.c,
      tapeColor: note.tapeColor,
    };
  }

  // 2. Check tapped note's exit ray
  const ownCheck = checkNotePath(note, allNotes, obstacles, rows, cols);
  if (!ownCheck.clear) {
    return {
      canPeel: false,
      peeledNotes: [],
      nextNotes: allNotes,
      unlockedTapeColors: [],
      rotatedPivotCount: 0,
      failureReason: 'blocked',
      blameNote: note,
      blockerNote: ownCheck.blockerNote,
      blockerObstacle: ownCheck.blockerObstacle,
      blockerR: ownCheck.blockerR,
      blockerC: ownCheck.blockerC,
    };
  }

  // 3. If this note has a Chain-Peel partner, partner must ALSO be unlocked & clear!
  const partner = getLinkedPartner(note, allNotes);
  if (partner) {
    if (partner.tapeColor && isNoteTapedLocked(partner, allNotes)) {
      const keyNote = getKeyNoteForTape(partner.tapeColor, allNotes);
      return {
        canPeel: false,
        peeledNotes: [],
        nextNotes: allNotes,
        unlockedTapeColors: [],
        rotatedPivotCount: 0,
        failureReason: 'taped',
        blameNote: partner,
        blockerNote: keyNote,
        blockerObstacle: null,
        blockerR: keyNote ? keyNote.r : partner.r,
        blockerC: keyNote ? keyNote.c : partner.c,
        tapeColor: partner.tapeColor,
      };
    }

    const partnerCheck = checkNotePath(partner, allNotes, obstacles, rows, cols);
    if (!partnerCheck.clear) {
      return {
        canPeel: false,
        peeledNotes: [],
        nextNotes: allNotes,
        unlockedTapeColors: [],
        rotatedPivotCount: 0,
        failureReason: 'partner_blocked',
        blameNote: partner,
        blockerNote: partnerCheck.blockerNote,
        blockerObstacle: partnerCheck.blockerObstacle,
        blockerR: partnerCheck.blockerR,
        blockerC: partnerCheck.blockerC,
      };
    }
  }

  // 4. Valid Peel! Apply removal/under-layer reveal for tapped note (+ linked partner if any)
  const peeledNotes = partner ? [note, partner] : [note];
  const peeledIds = new Set(peeledNotes.map((n) => n.id));

  let rotatedPivotCount = 0;
  const nextNotes: ActiveNote[] = [];

  for (const current of allNotes) {
    if (peeledIds.has(current.id)) {
      if (current.under) {
        nextNotes.push({
          ...current,
          dir: current.under.dir,
          color: current.under.color,
          under: undefined,
          keyColor: undefined,
          tapeColor: undefined,
          linkId: undefined,
        });
      }
      continue;
    }

    if (current.pivot) {
      rotatedPivotCount++;
      nextNotes.push({
        ...current,
        dir: rotateDirCW(current.dir, 1),
      });
    } else {
      nextNotes.push(current);
    }
  }

  // Detect any tape colors unlocked by peeling a Key Note on this step
  const unlockedTapeColors: TapeColor[] = [];
  for (const p of peeledNotes) {
    if (
      p.keyColor &&
      !nextNotes.some((n) => n.keyColor === p.keyColor) &&
      nextNotes.some((n) => n.tapeColor === p.keyColor)
    ) {
      if (!unlockedTapeColors.includes(p.keyColor)) {
        unlockedTapeColors.push(p.keyColor);
      }
    }
  }

  return {
    canPeel: true,
    peeledNotes,
    nextNotes,
    unlockedTapeColors,
    rotatedPivotCount,
    blameNote: note,
    blockerNote: null,
    blockerObstacle: null,
    blockerR: note.r,
    blockerC: note.c,
  };
}

function serializeBoardState(notes: ActiveNote[]): string {
  return notes
    .map((n) => `${n.id}:${n.dir}${n.under ? '2' : '1'}`)
    .sort()
    .join('|');
}

/**
 * Bounded state-space solver supporting Classic & all 3 Studio Lab mechanics.
 * Returns the ID of a guaranteed winning first note, or null if unsolvable within budget.
 */
function findWinningFirstMoveId(
  initialNotes: ActiveNote[],
  obstacles: ObstacleSpec[],
  rows: number,
  cols: number,
  maxStates = 2400
): string | null {
  if (initialNotes.length === 0) return null;

  const hasPivot = initialNotes.some((n) => n.pivot);

  // Fast path when no Pivot Notes exist: peeling never adds blockers, so greedy is confluent!
  if (!hasPivot) {
    const sim = initialNotes.map((n) => ({ ...n, under: n.under ? { ...n.under } : undefined }));
    let firstWinId: string | null = null;
    let progressed = true;
    let current: ActiveNote[] = sim;

    while (current.length > 0 && progressed) {
      progressed = false;
      const seenLinks = new Set<string>();
      for (const note of current) {
        if (note.linkId) {
          if (seenLinks.has(note.linkId)) continue;
          seenLinks.add(note.linkId);
        }
        const ev = evaluateNoteTap(note, current, obstacles, rows, cols);
        if (ev.canPeel) {
          if (!firstWinId) firstWinId = note.id;
          current = ev.nextNotes;
          progressed = true;
          break;
        }
      }
    }
    return current.length === 0 ? firstWinId : null;
  }

  // With Pivot Notes: order matters! Run fast memoized DFS prioritizing pivots & keys.
  const visited = new Set<string>();
  let expanded = 0;

  const dfs = (current: ActiveNote[]): string | null => {
    if (current.length === 0) return '__DONE__';
    if (expanded >= maxStates) return null;

    const stateKey = serializeBoardState(current);
    if (visited.has(stateKey)) return null;
    visited.add(stateKey);
    expanded++;

    // Collect deduplicated legal moves
    const seenLinks = new Set<string>();
    const legalMoves: { note: ActiveNote; next: ActiveNote[]; priority: number }[] = [];

    for (const note of current) {
      if (note.linkId) {
        if (seenLinks.has(note.linkId)) continue;
        seenLinks.add(note.linkId);
      }
      const ev = evaluateNoteTap(note, current, obstacles, rows, cols);
      if (ev.canPeel) {
        // Prioritize: (1) Key Notes that unlock tapes, (2) Pivot Notes when open, (3) Chain pairs
        let priority = 0;
        if (ev.unlockedTapeColors.length > 0) priority += 30;
        if (note.pivot) priority += 20;
        if (ev.peeledNotes.length > 1) priority += 10;
        legalMoves.push({ note, next: ev.nextNotes, priority });
      }
    }

    legalMoves.sort((a, b) => b.priority - a.priority);

    for (const move of legalMoves) {
      const res = dfs(move.next);
      if (res !== null) {
        return move.note.id;
      }
    }

    return null;
  };

  const firstId = dfs(initialNotes);
  return firstId && firstId !== '__DONE__' ? firstId : null;
}

/**
 * Verifies a level (Classic OR Studio Lab with Taped/Pivot/Chain mechanics) is 100% solvable.
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
    tapeColor: n.tapeColor,
    keyColor: n.keyColor,
    pivot: n.pivot,
    linkId: n.linkId,
  }));
  if (sim.length === 0) return true;
  return findWinningFirstMoveId(sim, level.obstacles ?? [], level.rows, level.cols, 4000) !== null;
}

/**
 * Picks the most helpful peelable note for a hint — fully aware of Taped Keys,
 * Rotating Pivot timing, and Chain-Peel pairs!
 */
export function findBestHintNote(
  notes: ActiveNote[],
  obstacles: ObstacleSpec[],
  rows: number,
  cols: number
): ActiveNote | null {
  if (notes.length === 0) return null;

  // For Studio Lab boards with pivots, verify the hint leads to a full clear!
  if (notes.some((n) => n.pivot)) {
    const winningId = findWinningFirstMoveId(notes, obstacles, rows, cols, 2200);
    if (winningId) {
      const found = notes.find((n) => n.id === winningId);
      if (found) return found;
    }
  }

  const peelable: { note: ActiveNote; ev: TapEvaluation }[] = [];
  for (const n of notes) {
    const ev = evaluateNoteTap(n, notes, obstacles, rows, cols);
    if (ev.canPeel) {
      peelable.push({ note: n, ev });
    }
  }
  if (peelable.length === 0) return null;

  let best = peelable[0].note;
  let bestScore = -1;

  for (const { note, ev } of peelable) {
    let score = 0;
    // Strongly prioritize peeling Key Notes that unlock Taped Notes
    if (ev.unlockedTapeColors.length > 0) score += 25;
    if (ev.peeledNotes.length > 1) score += 5;

    for (const other of ev.nextNotes) {
      if (evaluateNoteTap(other, ev.nextNotes, obstacles, rows, cols).canPeel) {
        score++;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = note;
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
  mode?: GameMode;
  packId: ThemeId;
  indexInPack: number;
  title: string;
  difficulty: LevelDef['difficulty'];
  rows: number;
  cols: number;
  targetNotes: number;
  obstacleCount?: number;
  doubleCount?: number;
  /** Studio Lab: number of Taped + Key pairs (up to 3 colors: red, blue, gold) */
  tapePairs?: number;
  /** Studio Lab: number of Rotating Pivot notes */
  pivotCount?: number;
  /** Studio Lab: number of Chain-Peel Linked pairs */
  chainPairs?: number;
  isEndless?: boolean;
  endlessNumber?: number;
  isDaily?: boolean;
  dailyDateKey?: string;
}

/**
 * Reverse-Peel Procedural Generator (Classic + Studio Lab):
 * Places static obstacles first, builds moves (single notes or linked chain pairs) in REVERSE peel order,
 * then assigns Pivot initial angles (CCW by exact turn index) and Key->Tape lock pairs (Key at earlier turn).
 * Guarantees 100% solvability across all combinations of mechanics!
 */
export function generateSolvableLevel(opts: GeneratorOptions): LevelDef {
  const rng = mulberry32(opts.seed);
  const { rows, cols, targetNotes } = opts;
  const obstacleCount = opts.obstacleCount ?? 0;
  const doubleCount = opts.doubleCount ?? 0;
  const tapePairs = opts.tapePairs ?? 0;
  const pivotCount = opts.pivotCount ?? 0;
  const chainPairs = opts.chainPairs ?? 0;
  const mode: GameMode =
    opts.mode ?? (tapePairs > 0 || pivotCount > 0 || chainPairs > 0 ? 'lab' : 'classic');

  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // 1. Place static obstacles
  const obstacles: ObstacleSpec[] = [];
  const occupied = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;

  let obsAttempts = 0;
  while (obstacles.length < obstacleCount && obsAttempts < 80) {
    obsAttempts++;
    const r = Math.floor(rng() * rows);
    const c = Math.floor(rng() * cols);
    if (occupied.has(key(r, c))) continue;
    const tooClose = obstacles.some((o) => Math.abs(o.r - r) + Math.abs(o.c - c) <= 1);
    if (tooClose && obsAttempts < 40) continue;

    occupied.add(key(r, c));
    obstacles.push({
      r,
      c,
      variant: (obstacles.length % 3) as 0 | 1 | 2,
    });
  }

  const rayClearOf = (
    r: number,
    c: number,
    dir: Direction,
    placed: ActiveNote[],
    extraBlocker?: { r: number; c: number }
  ): boolean => {
    const { dr, dc } = DIR_DELTA[dir];
    let cr = r + dr;
    let cc = c + dc;
    while (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
      if (extraBlocker && extraBlocker.r === cr && extraBlocker.c === cc) return false;
      if (obstacles.some((o) => o.r === cr && o.c === cc)) return false;
      if (placed.some((n) => n.r === cr && n.c === cc)) return false;
      cr += dr;
      cc += dc;
    }
    return true;
  };

  const countBlockedExisting = (r: number, c: number, placed: ActiveNote[]): number => {
    let count = 0;
    for (const n of placed) {
      const { dr, dc } = DIR_DELTA[n.dir];
      if (dr !== 0 && n.c === c && (r - n.r) * dr > 0) count++;
      if (dc !== 0 && n.r === r && (c - n.c) * dc > 0) count++;
    }
    return count;
  };

  const pickColorForCell = (r: number, c: number, placed: ActiveNote[]): PaperColor => {
    const neighborColors = new Set(
      placed
        .filter((n) => Math.abs(n.r - r) + Math.abs(n.c - c) === 1)
        .map((n) => n.color)
    );
    const available = PAPER_COLORS.filter((col) => !neighborColors.has(col));
    return pick(available.length > 0 ? available : PAPER_COLORS);
  };

  // 2. Build reverse-order move list (moves[0] peels LAST, moves[last] peels FIRST)
  const placed: ActiveNote[] = [];
  interface ReverseMove {
    notes: ActiveNote[];
  }
  const reverseMoves: ReverseMove[] = [];
  let chainsAdded = 0;

  // Spread chain-peel pairs evenly across middle & early gameplay turns
  const chainSlots = new Set<number>();
  if (chainPairs > 0) {
    for (let k = 0; k < chainPairs; k++) {
      const targetStep = Math.max(
        1,
        Math.min(
          targetNotes - 2,
          Math.floor(((k + 1) / (chainPairs + 1)) * (targetNotes - chainPairs))
        )
      );
      chainSlots.add(targetStep);
    }
  }

  let stepIdx = 0;
  while (placed.length < targetNotes) {
    interface Candidate {
      r: number;
      c: number;
      dir: Direction;
      score: number;
    }

    const gatherCandidates = (extraBlocker?: { r: number; c: number }): Candidate[] => {
      const list: Candidate[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (occupied.has(key(r, c))) continue;
          if (extraBlocker && extraBlocker.r === r && extraBlocker.c === c) continue;
          const blocksCount = countBlockedExisting(r, c, placed);

          for (const dir of ALL_DIRS) {
            if (!rayClearOf(r, c, dir, placed, extraBlocker)) continue;
            const { dr, dc } = DIR_DELTA[dir];
            let rayLen = 0;
            let rr = r + dr;
            let cc = c + dc;
            while (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
              rayLen++;
              rr += dr;
              cc += dc;
            }
            const inwardBonus =
              placed.length < targetNotes * 0.65 ? rayLen * 2.2 : rayLen * 0.6;
            const chainBonus = blocksCount * 4.5;
            const jitter = rng() * 2.8;
            list.push({ r, c, dir, score: inwardBonus + chainBonus + jitter });
          }
        }
      }
      list.sort((a, b) => b.score - a.score);
      return list;
    };

    const wantsChain =
      chainsAdded < chainPairs &&
      placed.length + 2 <= targetNotes &&
      (chainSlots.has(stepIdx) || placed.length + 2 * (chainPairs - chainsAdded) >= targetNotes);

    const primaryCandidates = gatherCandidates();
    if (primaryCandidates.length === 0) break;

    if (wantsChain) {
      let pairCreated = false;
      const topFirst = primaryCandidates.slice(0, Math.min(8, primaryCandidates.length));
      for (const first of topFirst) {
        const secondCandidates = gatherCandidates({ r: first.r, c: first.c }).filter((cand) => {
          // Neither partner may block the other's exit ray!
          if (!rayClearOf(first.r, first.c, first.dir, placed, { r: cand.r, c: cand.c })) {
            return false;
          }
          const dist = Math.abs(cand.r - first.r) + Math.abs(cand.c - first.c);
          return dist >= 1 && dist <= 4;
        });

        if (secondCandidates.length > 0) {
          const second = pick(secondCandidates.slice(0, Math.min(4, secondCandidates.length)));
          const linkId = LINK_IDS[chainsAdded % LINK_IDS.length];
          const colorA = pickColorForCell(first.r, first.c, placed);
          const noteA: ActiveNote = {
            id: `gen-${placed.length}`,
            r: first.r,
            c: first.c,
            dir: first.dir,
            color: colorA,
            tilt: 0,
            linkId,
          };
          occupied.add(key(first.r, first.c));
          placed.push(noteA);

          const colorB = pickColorForCell(second.r, second.c, placed);
          const noteB: ActiveNote = {
            id: `gen-${placed.length}`,
            r: second.r,
            c: second.c,
            dir: second.dir,
            color: colorB,
            tilt: 0,
            linkId,
          };
          occupied.add(key(second.r, second.c));
          placed.push(noteB);

          reverseMoves.push({ notes: [noteA, noteB] });
          chainsAdded++;
          pairCreated = true;
          break;
        }
      }

      if (pairCreated) {
        stepIdx++;
        continue;
      }
    }

    const chosen = pick(primaryCandidates.slice(0, Math.min(4, primaryCandidates.length)));
    const color = pickColorForCell(chosen.r, chosen.c, placed);
    const note: ActiveNote = {
      id: `gen-${placed.length}`,
      r: chosen.r,
      c: chosen.c,
      dir: chosen.dir,
      color,
      tilt: 0,
    };
    occupied.add(key(chosen.r, chosen.c));
    placed.push(note);
    reverseMoves.push({ notes: [note] });
    stepIdx++;
  }

  // 3. Optionally upgrade some classic single notes into 2-layer stacked notes
  let doublesAdded = 0;
  if (doubleCount > 0 && placed.length >= 4 && pivotCount === 0 && chainPairs === 0) {
    for (let idx = placed.length - 1; idx >= 0 && doublesAdded < doubleCount; idx--) {
      const target = placed[idx];
      if (target.linkId) continue;
      const remainingWhenPeeled = placed.slice(0, idx);
      const otherDirs = ALL_DIRS.filter(
        (d) => d !== target.dir && rayClearOf(target.r, target.c, d, remainingWhenPeeled)
      );
      if (otherDirs.length > 0) {
        const topDir = pick(otherDirs);
        const topColor = pick(PAPER_COLORS.filter((c) => c !== target.color));
        const underDir = target.dir;
        const underColor = target.color;
        target.dir = topDir;
        target.color = topColor;
        target.under = { dir: underDir, color: underColor };
        doublesAdded++;
      }
    }
  }

  // 4. Reverse moves into forward gameplay order: forwardMoves[t] peels on Turn t (0 .. M-1)
  const forwardMoves = [...reverseMoves].reverse();
  const totalTurns = forwardMoves.length;

  // 4a. Assign Studio Lab Rotating / Pivot Notes (exact turn-count CCW pre-rotation)
  if (pivotCount > 0 && totalTurns >= 3) {
    const usedPivotRows = new Set<number>();
    const usedPivotCols = new Set<number>();
    const obstacleRows = new Set(obstacles.map((o) => o.r));
    const obstacleCols = new Set(obstacles.map((o) => o.c));

    // Candidate turns: prefer turns where t >= 1 and t % 4 !== 0 so the player sees meaningful rotation
    const candidateTurns: number[] = [];
    for (let t = 1; t < totalTurns; t++) {
      const move = forwardMoves[t];
      if (move.notes.length !== 1) continue;
      const n = move.notes[0];
      if (n.under || n.linkId) continue;
      // Guarantee zero obstacle in same row or column so pivot can never be permanently trapped!
      if (obstacleRows.has(n.r) || obstacleCols.has(n.c)) continue;
      candidateTurns.push(t);
    }

    // Sort preferring turns where t % 4 !== 0 and spread across mid-game
    candidateTurns.sort((a, b) => {
      const aNonZero = a % 4 !== 0 ? 1 : 0;
      const bNonZero = b % 4 !== 0 ? 1 : 0;
      if (aNonZero !== bNonZero) return bNonZero - aNonZero;
      return rng() - 0.5;
    });

    let pivotsAdded = 0;
    for (const t of candidateTurns) {
      if (pivotsAdded >= pivotCount) break;
      const note = forwardMoves[t].notes[0];
      // Also avoid putting two Pivot Notes on the same row or column so they can't mutually deadlock
      if (usedPivotRows.has(note.r) || usedPivotCols.has(note.c)) continue;

      note.pivot = true;
      note.dir = rotateDirCCW(note.dir, t);
      usedPivotRows.add(note.r);
      usedPivotCols.add(note.c);
      pivotsAdded++;
    }
  }

  // 4b. Assign Studio Lab Taped / Locked Notes + Key Notes (Key strictly at earlier turn t_key < t_taped)
  if (tapePairs > 0 && totalTurns >= 4) {
    const usedNoteIds = new Set<string>();
    const maxColors = Math.min(tapePairs, TAPE_COLOR_ORDER.length);
    let pairsAdded = 0;

    for (let cIdx = 0; cIdx < maxColors; cIdx++) {
      const tapeColor = TAPE_COLOR_ORDER[cIdx];

      // Pick a Taped Note from middle/late turns (single non-pivot, non-linked note)
      const tapedCandidates: number[] = [];
      for (let t = Math.max(2, Math.floor(totalTurns * 0.35)); t < totalTurns; t++) {
        const move = forwardMoves[t];
        if (move.notes.length !== 1) continue;
        const n = move.notes[0];
        if (usedNoteIds.has(n.id) || n.under || n.linkId) continue;
        tapedCandidates.push(t);
      }
      if (tapedCandidates.length === 0) break;

      const tapedTurn = pick(tapedCandidates);
      const tapedNote = forwardMoves[tapedTurn].notes[0];

      // Pick a Key Note from an EARLIER turn (0 .. tapedTurn - 1)
      const keyCandidates: number[] = [];
      for (let t = 0; t < tapedTurn; t++) {
        const move = forwardMoves[t];
        if (move.notes.length !== 1) continue;
        const n = move.notes[0];
        if (usedNoteIds.has(n.id) || n.under || n.linkId) continue;
        keyCandidates.push(t);
      }
      if (keyCandidates.length === 0) continue;

      const keyTurn = pick(keyCandidates);
      const keyNote = forwardMoves[keyTurn].notes[0];

      tapedNote.tapeColor = tapeColor;
      keyNote.keyColor = tapeColor;
      usedNoteIds.add(tapedNote.id);
      usedNoteIds.add(keyNote.id);
      pairsAdded++;
    }
    void pairsAdded;
  }

  const notes: NoteSpec[] = placed.map((n) => ({
    r: n.r,
    c: n.c,
    dir: n.dir,
    color: n.color,
    ...(n.under ? { under: n.under } : {}),
    ...(n.tapeColor ? { tapeColor: n.tapeColor } : {}),
    ...(n.keyColor ? { keyColor: n.keyColor } : {}),
    ...(n.pivot ? { pivot: true } : {}),
    ...(n.linkId ? { linkId: n.linkId } : {}),
  }));

  return {
    id: opts.id,
    mode,
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
}
