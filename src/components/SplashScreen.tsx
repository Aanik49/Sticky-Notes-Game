import React, { useEffect, useState } from 'react';
import { THEMES } from '../game/levels';
import { ThemeId } from '../game/types';
import { GameIcon } from './GameIcon';

interface SplashScreenProps {
  themeId: ThemeId;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ themeId, onFinish }) => {
  const [fadingOut, setFadingOut] = useState(false);
  const theme = THEMES[themeId];

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, 1650);

    const doneTimer = window.setTimeout(() => {
      onFinish();
    }, 2000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const handleSkip = () => {
    if (fadingOut) return;
    setFadingOut(true);
    window.setTimeout(onFinish, 220);
  };

  return (
    <div
      onClick={handleSkip}
      role="status"
      aria-label="Loading Sticky Notes Puzzle"
      className={`${theme.worldClass} fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center px-6 text-center transition-opacity duration-300 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="splash-icon-anim mb-5">
          <GameIcon className="h-24 w-24 drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)] sm:h-28 sm:w-28" />
        </div>

        <div className="splash-text-anim flex flex-col items-center">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sticky Notes Puzzle
          </h1>
          <p className="mt-2 text-sm font-medium opacity-75 sm:text-base">
            A Simple and Challenging Puzzle Game
          </p>

          <div
            aria-hidden="true"
            className={`mt-7 h-1 w-36 overflow-hidden rounded-full ${
              theme.isDark ? 'bg-white/15' : 'bg-black/10'
            }`}
          >
            <div className="splash-bar-anim h-full w-full rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
