import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Direction } from '../game/types';

export interface ParticleCanvasHandle {
  emitPeel: (x: number, y: number, dir: Direction, colorHex: string) => void;
  emitBump: (x: number, y: number, colorHex: string) => void;
  emitVictory: (width: number, height: number) => void;
}

interface Particle {
  kind: 'mote' | 'paper' | 'ring';
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  wobblePhase: number;
}

const VICTORY_COLORS = ['#fde047', '#fb7185', '#38bdf8', '#4ade80', '#fb923c', '#c084fc'];

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>(function ParticleCanvas(
  _props,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const ensureLoop = () => {
    if (rafRef.current !== null) return;
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      const list = particlesRef.current;
      if (!canvas) {
        rafRef.current = null;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = null;
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          list.splice(i, 1);
          continue;
        }

        const t = p.life / p.maxLife;
        const alpha = p.kind === 'ring' ? (1 - t) * 0.75 : 1 - t * t;

        if (p.kind === 'ring') {
          const radius = p.size * (0.4 + t * 1.45);
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = Math.max(1, 3.5 * (1 - t));
          ctx.stroke();
          continue;
        }

        p.vy += p.gravity * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt + (p.kind === 'paper' ? Math.sin(p.life * 6 + p.wobblePhase) * 28 * dt : 0);
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;

        if (p.kind === 'paper') {
          const scaleY = 0.45 + 0.55 * Math.abs(Math.cos(p.life * 7 + p.wobblePhase));
          ctx.scale(1, scaleY);
          const half = p.size / 2;
          ctx.beginPath();
          ctx.roundRect(-half, -half, p.size, p.size, [2, 2, 5, 2]);
          ctx.fill();
          // Subtle fold highlight on victory confetti squares
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(-half, -half, p.size, p.size * 0.24);
        } else {
          ctx.beginPath();
          ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7, 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();

      if (list.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const syncSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };

    syncSize();
    window.addEventListener('resize', syncSize);
    return () => {
      window.removeEventListener('resize', syncSize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    emitPeel(x, y, dir, colorHex) {
      const dirVec =
        dir === 'U'
          ? { vx: 0, vy: -210 }
          : dir === 'D'
            ? { vx: 0, vy: 210 }
            : dir === 'L'
              ? { vx: -210, vy: 0 }
              : { vx: 210, vy: 0 };

      const list = particlesRef.current;
      // Subtle paper peel dust & directional trail scraps
      for (let i = 0; i < 12; i++) {
        const spread = (Math.random() - 0.5) * 180;
        const speedMul = 0.45 + Math.random() * 0.9;
        list.push({
          kind: i < 4 ? 'paper' : 'mote',
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 24,
          vx: dirVec.vx * speedMul + (dir === 'U' || dir === 'D' ? spread : (Math.random() - 0.5) * 60),
          vy: dirVec.vy * speedMul + (dir === 'L' || dir === 'R' ? spread : (Math.random() - 0.5) * 60),
          size: i < 4 ? 7 + Math.random() * 5 : 4 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 10,
          color: i % 3 === 0 ? '#ffffff' : colorHex,
          life: 0,
          maxLife: 0.42 + Math.random() * 0.28,
          gravity: 220,
          wobblePhase: Math.random() * Math.PI * 2,
        });
      }
      ensureLoop();
    },

    emitBump(x, y, colorHex) {
      const list = particlesRef.current;
      list.push({
        kind: 'ring',
        x,
        y,
        vx: 0,
        vy: 0,
        size: 28,
        rot: 0,
        vrot: 0,
        color: '#ef4444',
        life: 0,
        maxLife: 0.34,
        gravity: 0,
        wobblePhase: 0,
      });

      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
        const speed = 70 + Math.random() * 90;
        list.push({
          kind: 'mote',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 3,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 12,
          color: i % 2 === 0 ? '#ef4444' : colorHex,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.15,
          gravity: 160,
          wobblePhase: 0,
        });
      }
      ensureLoop();
    },

    emitVictory(width, height) {
      const list = particlesRef.current;
      const spawnWave = (count: number, originYRatio: number) => {
        for (let i = 0; i < count; i++) {
          const side = i % 3;
          const x =
            side === 0
              ? width * (0.08 + Math.random() * 0.25)
              : side === 1
                ? width * (0.67 + Math.random() * 0.25)
                : width * (0.3 + Math.random() * 0.4);
          const vx =
            side === 0
              ? 120 + Math.random() * 260
              : side === 1
                ? -(120 + Math.random() * 260)
                : (Math.random() - 0.5) * 320;
          list.push({
            kind: i % 5 === 0 ? 'mote' : 'paper',
            x,
            y: height * originYRatio + (Math.random() - 0.5) * 60,
            vx,
            vy: -240 - Math.random() * 340,
            size: i % 5 === 0 ? 6 + Math.random() * 4 : 11 + Math.random() * 9,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 10,
            color: VICTORY_COLORS[i % VICTORY_COLORS.length],
            life: 0,
            maxLife: 1.7 + Math.random() * 1.2,
            gravity: 340,
            wobblePhase: Math.random() * Math.PI * 2,
          });
        }
      };

      // Wave 1: Instant celebration pop from both sides + center
      spawnWave(64, 0.58);
      ensureLoop();

      // Wave 2: Secondary festive shower as the victory panel settles in
      window.setTimeout(() => {
        spawnWave(40, 0.35);
        ensureLoop();
      }, 260);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
});
