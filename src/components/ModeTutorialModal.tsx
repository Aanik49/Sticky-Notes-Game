import React from 'react';
import { ArrowRight, FlaskConical, Layers, Sparkles, X } from 'lucide-react';
import { sound } from '../game/audio';
import { GameMode } from '../game/types';

interface ModeTutorialModalProps {
  mode: GameMode;
  context?: 'lobby' | 'level';
  onDismiss: () => void;
}

/**
 * Bauhaus mode instruction panel shown automatically when a player first enters
 * Classic Mode or Studio Lab (before starting their first level), and reopenable
 * anytime from the Title Screen or Pause Menu.
 */
export const ModeTutorialModal: React.FC<ModeTutorialModalProps> = ({
  mode,
  context = 'lobby',
  onDismiss,
}) => {
  const isLab = mode === 'lab';

  const handleClose = () => {
    sound.playClick();
    onDismiss();
  };

  const ctaLabel = isLab
    ? context === 'level'
      ? 'Start Lab Wall'
      : 'Enter Studio Lab'
    : context === 'level'
      ? 'Start Peeling'
      : 'Got It — Play Classic';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isLab ? 'Studio Lab core mechanics guide' : 'Classic Mode core mechanics guide'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5"
      onClick={handleClose}
    >
      <div
        className="combo-pop flex max-h-[calc(100dvh-24px)] w-full max-w-md flex-col overflow-hidden border-[3px] border-[#111111] bg-[#f5f0e2] text-[#111111] shadow-[8px_8px_0_#111111]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bauhaus Primary Tri-Band */}
        <div
          aria-hidden="true"
          className="grid h-2.5 shrink-0 grid-cols-3 border-b-2 border-[#111111]"
        >
          <div className="border-r-2 border-[#111111] bg-[#d6302a]" />
          <div className="border-r-2 border-[#111111] bg-[#e4b43c]" />
          <div className="bg-[#2b56a3]" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-[#111111] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#111111] shadow-[2px_2px_0_#111111] ${
                isLab ? 'bg-[#2b56a3] text-[#faf6ea]' : 'bg-[#e4b43c] text-[#111111]'
              }`}
            >
              {isLab ? <FlaskConical className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
            </div>
            <div>
              <div className="font-mono-num text-[10px] font-extrabold tracking-widest uppercase opacity-65">
                {isLab ? 'Welcome to Studio Lab · 3 Special Mechanics' : 'Welcome to Classic Mode · Core Rules'}
              </div>
              <h2 className="font-display text-lg font-black tracking-tight uppercase leading-tight sm:text-xl">
                {isLab ? 'Studio Lab Guide' : 'How to Play Classic'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close instructions"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-[#111111] bg-[#faf6ea] text-[#111111] shadow-[2px_2px_0_#111111] transition hover:bg-[#d6302a] hover:text-[#faf6ea]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Visual Rules */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {!isLab ? (
            <div className="flex flex-col gap-3">
              {/* Rule 1: Peel Along the Arrow */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="4"
                    y="4"
                    width="44"
                    height="44"
                    fill="#e4b43c"
                    stroke="#111111"
                    strokeWidth="3"
                  />
                  <path
                    d="M15 22.5H28.5V16L40 26L28.5 36V29.5H15V22.5Z"
                    fill="#d6302a"
                    stroke="#111111"
                    strokeWidth="2.4"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    1. Peel Along the Arrow
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    Tap any note whose arrow points cleanly to the edge of the board to peel it off the wall.
                  </p>
                </div>
              </div>

              {/* Rule 2: Clear Blockers First */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="3"
                    y="14"
                    width="22"
                    height="28"
                    fill="#2b56a3"
                    stroke="#111111"
                    strokeWidth="2.6"
                  />
                  <path
                    d="M8 25.5H15V21.5L21 28L15 34.5V30.5H8Z"
                    fill="#f5f0e2"
                    stroke="#111111"
                    strokeWidth="1.6"
                  />
                  <rect
                    x="31"
                    y="14"
                    width="22"
                    height="28"
                    fill="#d6302a"
                    stroke="#111111"
                    strokeWidth="2.6"
                  />
                  <line x1="36" y1="20" x2="48" y2="36" stroke="#faf6ea" strokeWidth="3" />
                  <line x1="48" y1="20" x2="36" y2="36" stroke="#faf6ea" strokeWidth="3" />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    2. Unblock Paths First
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    If another note or fixed block sits ahead of the arrow, tapping counts as a bump (5 bumps max). Peel blockers first!
                  </p>
                </div>
              </div>

              {/* Rule 3: Stacks & 3-Star Mastery */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="11"
                    y="11"
                    width="38"
                    height="38"
                    fill="#2b56a3"
                    stroke="#111111"
                    strokeWidth="2.8"
                  />
                  <rect
                    x="5"
                    y="5"
                    width="38"
                    height="38"
                    fill="#f3eee0"
                    stroke="#111111"
                    strokeWidth="2.8"
                  />
                  <rect x="7" y="7" width="16" height="11" fill="#111111" />
                  <text
                    x="15"
                    y="15.5"
                    textAnchor="middle"
                    fill="#f5f0e2"
                    fontSize="8.5"
                    fontWeight="900"
                  >
                    ×2
                  </text>
                  <polygon
                    points="24,20 27,26 34,27 29,32 30,39 24,35.5 18,39 19,32 14,27 21,26"
                    fill="#e4b43c"
                    stroke="#111111"
                    strokeWidth="1.6"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    3. Double Stacks & 3-Star Clears
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    Notes marked <span className="font-mono-num font-extrabold">×2</span> reveal a second note underneath. Clear with 0 bumps for 3 stars to unlock all 6 packs &amp; paper styles.
                  </p>
                </div>
              </div>

              {/* Quick Tip Bar */}
              <div className="flex items-center gap-2 border-2 border-[#111111] bg-[#ece5d2] px-3 py-2 text-[11px] font-bold text-[#111111]/85">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#d6302a]" />
                <span>
                  Stuck? Use <span className="font-extrabold">Undo</span> or tap{' '}
                  <span className="font-extrabold">Hint</span> anytime. Clear all 15 walls in a pack to unlock the next!
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Lab Mechanic 1: Taped / Locked Notes */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="6"
                    y="6"
                    width="44"
                    height="44"
                    fill="#2b56a3"
                    stroke="#111111"
                    strokeWidth="2.8"
                  />
                  <polygon
                    points="6,24 24,6 37,6 6,37"
                    fill="#d6302a"
                    stroke="#111111"
                    strokeWidth="2.2"
                  />
                  <rect
                    x="11"
                    y="16"
                    width="8"
                    height="6"
                    fill="#faf6ea"
                    stroke="#111111"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M13 16V14a2 2 0 0 1 4 0v2"
                    fill="none"
                    stroke="#faf6ea"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M27 36V26H22L30 18L38 26H33V36Z"
                    fill="#f5f0e2"
                    stroke="#111111"
                    strokeWidth="2"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    1. Taped Notes &amp; Color Keys
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    Notes taped down by a diagonal Bauhaus color strip stay locked until you peel the matching-color <span className="font-extrabold">Key Note</span> elsewhere on the wall.
                  </p>
                </div>
              </div>

              {/* Lab Mechanic 2: Rotating Pivot Notes */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="6"
                    y="6"
                    width="44"
                    height="44"
                    fill="#e4b43c"
                    stroke="#111111"
                    strokeWidth="2.8"
                  />
                  <circle cx="13" cy="13" r="4.5" fill="#e4b43c" stroke="#111111" strokeWidth="2" />
                  <circle cx="13" cy="13" r="1.4" fill="#111111" />
                  <path
                    d="M28 13 A15 15 0 1 1 15 36"
                    fill="none"
                    stroke="#111111"
                    strokeWidth="1.8"
                    strokeDasharray="3 2.5"
                  />
                  <polygon points="28,10 33,13 28,16" fill="#111111" />
                  <path
                    d="M19 25H30V20.5L39 28L30 35.5V31H19Z"
                    fill="#d6302a"
                    stroke="#111111"
                    strokeWidth="2"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    2. Rotating Pivot Notes
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    Corner-pinned notes rotate <span className="font-extrabold">90° clockwise</span> after every valid peel on the board. Time your peel order so their arrow faces an open exit!
                  </p>
                </div>
              </div>

              {/* Lab Mechanic 3: Chain-Peel Linked Notes */}
              <div className="flex items-start gap-3 border-2 border-[#111111] bg-[#faf6ea] p-3 shadow-[3px_3px_0_#111111]">
                <svg viewBox="0 0 56 56" className="h-13 w-13 shrink-0" aria-hidden="true">
                  <rect
                    x="3"
                    y="14"
                    width="21"
                    height="28"
                    fill="#2b56a3"
                    stroke="#111111"
                    strokeWidth="2.4"
                  />
                  <rect
                    x="32"
                    y="14"
                    width="21"
                    height="28"
                    fill="#f3eee0"
                    stroke="#111111"
                    strokeWidth="2.4"
                  />
                  <line
                    x1="14"
                    y1="28"
                    x2="42"
                    y2="28"
                    stroke="#111111"
                    strokeWidth="2.6"
                    strokeDasharray="3.5 2.5"
                  />
                  <rect
                    x="24"
                    y="24"
                    width="8"
                    height="8"
                    fill="#e4b43c"
                    stroke="#111111"
                    strokeWidth="2"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-sm font-black uppercase">
                    3. Chain-Peel Linked Pairs
                  </h3>
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#111111]/80">
                    Two notes linked by a dashed ink line peel <span className="font-extrabold">simultaneously</span> when tapped—just ensure both partners have clear, unlocked paths!
                  </p>
                </div>
              </div>

              {/* Lab Tip Bar */}
              <div className="flex items-center gap-2 border-2 border-[#111111] bg-[#ece5d2] px-3 py-2 text-[11px] font-bold text-[#111111]/85">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#2b56a3]" />
                <span>
                  Start with <span className="font-extrabold">Tape Lock</span>,{' '}
                  <span className="font-extrabold">Pivot Grid</span>, or{' '}
                  <span className="font-extrabold">Chain Link</span>—clear them to unlock 3 fusion packs!
                </span>
              </div>
            </div>
          )}

          {/* Primary Dismiss CTA */}
          <button
            type="button"
            onClick={handleClose}
            className={`font-display mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 border-2 border-[#111111] px-4 text-base font-black tracking-wider uppercase shadow-[4px_4px_0_#111111] transition hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] ${
              isLab
                ? 'bg-[#2b56a3] text-[#faf6ea] hover:bg-[#244a8e]'
                : 'bg-[#e4b43c] text-[#111111] hover:bg-[#ecc252]'
            }`}
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
