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
      className={`${theme.worldClass} fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-center transition-opacity duration-300 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Bauhaus Mondrian Architectural Perimeter Frame Lines */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-10 h-[3px] bg-[#111111]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-10 h-[3px] bg-[#111111]" />
      <div aria-hidden="true" className="pointer-events-none absolute top-0 left-8 h-10 w-14 border-x-[3px] border-[#111111] bg-[#d6302a]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-8 bottom-0 h-10 w-16 border-x-[3px] border-[#111111] bg-[#2b56a3]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-24 bottom-0 h-10 w-10 border-l-[3px] border-[#111111] bg-[#e4b43c]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="splash-icon-anim mb-6">
          <GameIcon className="h-24 w-24 shadow-[6px_6px_0_#111111] sm:h-28 sm:w-28" />
        </div>

        <div className="splash-text-anim flex flex-col items-center">
          {/* Reference-faithful Bauhaus STICKY [NOTES] lockup */}
          <h1 className="font-display flex items-center gap-2 text-3xl font-black tracking-tight uppercase sm:text-4xl">
            <span>STICKY</span>
            <span className="border-2 border-[#111111] bg-[#d6302a] px-2.5 py-0.5 text-[#f5f0e2] shadow-[3px_3px_0_#111111]">
              NOTES
            </span>
          </h1>
          <p className="mt-3 text-sm font-bold tracking-wide opacity-85 sm:text-base">
            A Simple and Challenging Puzzle Game
          </p>

          <div
            aria-hidden="true"
            className="mt-7 h-2.5 w-44 overflow-hidden border-2 border-[#111111] bg-[#f5f0e2]"
          >
            <div className="splash-bar-anim h-full w-full bg-[#e4b43c]" />
          </div>
        </div>
      </div>
    </div>
  );
};
