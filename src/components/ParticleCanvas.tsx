import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Direction } from '../game/types';

export interface BoardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ParticleCanvasHandle {
  emitPeel: (x: number, y: number, dir: Direction, colorHex: string) => void;
  emitBump: (x: number, y: number, colorHex: string) => void;
  emitBoardConfetti: (rect: BoardRect, lastNotePos?: { x: number; y: number }) => void;
  emitVictory: (width: number, height: number) => void;
}

type ConfettiShape = 'square' | 'ribbon' | 'circle' | 'triangle';

interface Particle {
  kind: 'mote' | 'paper' | 'ring';
  shape?: ConfettiShape;
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
  drag?: number;
  wobblePhase: number;
}

const VICTORY_COLORS = ['#e4b43c', '#d6302a', '#2b56a3', '#f5f0e2', '#dc6b2f', '#10b981'];
const CONFETTI_SHAPES: ConfettiShape[] = ['square', 'ribbon', 'circle', 'triangle'];

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>(function ParticleCanvas(
  _props,
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timersRef = useRef<number[]>([]);

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
        const alpha = p.kind === 'ring' ? (1 - t) * 0.8 : 1 - t * t;

        if (p.kind === 'ring') {
          const radius = p.size * (0.35 + t * 1.65);
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.lineWidth = Math.max(1.5, 4 * (1 - t));
          ctx.stroke();
          continue;
        }

        const drag = p.drag ?? 0.985;
        p.vy += p.gravity * dt;
        p.vx *= drag;
        p.x += p.vx * dt + (p.kind === 'paper' ? Math.sin(p.life * 7.5 + p.wobblePhase) * 34 * dt : 0);
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#111111';

        if (p.kind === 'paper') {
          const scaleY = 0.4 + 0.6 * Math.abs(Math.cos(p.life * 8.5 + p.wobblePhase));
          ctx.scale(1, scaleY);
          const half = p.size / 2;
          const shape = p.shape ?? 'square';
          ctx.lineWidth = 1.3;

          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, half * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(0, -half);
            ctx.lineTo(half, half * 0.85);
            ctx.lineTo(-half, half * 0.85);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          } else if (shape === 'ribbon') {
            ctx.fillRect(-half * 1.25, -half * 0.48, p.size * 1.25, p.size * 0.48);
            ctx.strokeRect(-half * 1.25, -half * 0.48, p.size * 1.25, p.size * 0.48);
          } else {
            ctx.fillRect(-half, -half, p.size, p.size);
            ctx.strokeRect(-half, -half, p.size, p.size);
          }
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
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
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
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
      for (let i = 0; i < 12; i++) {
        const spread = (Math.random() - 0.5) * 180;
        const speedMul = 0.45 + Math.random() * 0.9;
        list.push({
          kind: i < 4 ? 'paper' : 'mote',
          shape: 'square',
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 24,
          vx: dirVec.vx * speedMul + (dir === 'U' || dir === 'D' ? spread : (Math.random() - 0.5) * 60),
          vy: dirVec.vy * speedMul + (dir === 'L' || dir === 'R' ? spread : (Math.random() - 0.5) * 60),
          size: i < 4 ? 7 + Math.random() * 5 : 4 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 10,
          color: i % 3 === 0 ? '#f5f0e2' : colorHex,
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
        color: '#d6302a',
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
          color: i % 2 === 0 ? '#d6302a' : colorHex,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.15,
          gravity: 160,
          wobblePhase: 0,
        });
      }
      ensureLoop();
    },

    emitBoardConfetti(rect, lastNotePos) {
      const list = particlesRef.current;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const originX = lastNotePos?.x ?? cx;
      const originY = lastNotePos?.y ?? cy;

      // Crisp geometric celebration rings radiating across the cleared board
      list.push(
        {
          kind: 'ring',
          x: originX,
          y: originY,
          vx: 0,
          vy: 0,
          size: Math.min(rect.width, rect.height) * 0.32,
          rot: 0,
          vrot: 0,
          color: '#e4b43c',
          life: 0,
          maxLife: 0.48,
          gravity: 0,
          wobblePhase: 0,
        },
        {
          kind: 'ring',
          x: cx,
          y: cy,
          vx: 0,
          vy: 0,
          size: Math.min(rect.width, rect.height) * 0.44,
          rot: 0,
          vrot: 0,
          color: '#d6302a',
          life: 0,
          maxLife: 0.56,
          gravity: 0,
          wobblePhase: 0,
        }
      );

      // Wave 1: Radial burst from last peeled note + 4 board corners converging over the grid
      const radialCount = 46;
      for (let i = 0; i < radialCount; i++) {
        const angle = (Math.PI * 2 * i) / radialCount + (Math.random() - 0.5) * 0.25;
        const speed = 130 + Math.random() * 250;
        list.push({
          kind: 'paper',
          shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
          x: originX + (Math.random() - 0.5) * 28,
          y: originY + (Math.random() - 0.5) * 28,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 95,
          size: 8 + Math.random() * 7,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 14,
          color: VICTORY_COLORS[i % VICTORY_COLORS.length],
          life: 0,
          maxLife: 0.95 + Math.random() * 0.55,
          gravity: 390,
          drag: 0.975,
          wobblePhase: Math.random() * Math.PI * 2,
        });
      }

      const corners = [
        { x: rect.left + 12, y: rect.top + rect.height - 12, vxDir: 1, vyBase: -310 },
        { x: rect.left + rect.width - 12, y: rect.top + rect.height - 12, vxDir: -1, vyBase: -310 },
        { x: rect.left + 12, y: rect.top + 18, vxDir: 1, vyBase: -140 },
        { x: rect.left + rect.width - 12, y: rect.top + 18, vxDir: -1, vyBase: -140 },
      ];
      corners.forEach((corner, cIdx) => {
        for (let i = 0; i < 8; i++) {
          list.push({
            kind: 'paper',
            shape: CONFETTI_SHAPES[(i + cIdx) % CONFETTI_SHAPES.length],
            x: corner.x,
            y: corner.y,
            vx: corner.vxDir * (75 + Math.random() * 195),
            vy: corner.vyBase - Math.random() * 170,
            size: 8 + Math.random() * 6,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 13,
            color: VICTORY_COLORS[(i + cIdx * 2) % VICTORY_COLORS.length],
            life: 0,
            maxLife: 1.05 + Math.random() * 0.55,
            gravity: 380,
            drag: 0.98,
            wobblePhase: Math.random() * Math.PI * 2,
          });
        }
      });

      ensureLoop();

      // Wave 2: Short celebratory fountain across the cleared board right before the Victory modal
      const waveTimer = window.setTimeout(() => {
        const listNow = particlesRef.current;
        for (let i = 0; i < 36; i++) {
          const x = rect.left + rect.width * (0.1 + Math.random() * 0.8);
          const y = rect.top + rect.height * (0.25 + Math.random() * 0.45);
          listNow.push({
            kind: 'paper',
            shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
            x,
            y,
            vx: (Math.random() - 0.5) * 230,
            vy: -170 - Math.random() * 210,
            size: 9 + Math.random() * 7,
            rot: Math.random() * Math.PI * 2,
            vrot: (Math.random() - 0.5) * 12,
            color: VICTORY_COLORS[i % VICTORY_COLORS.length],
            life: 0,
            maxLife: 1.15 + Math.random() * 0.6,
            gravity: 340,
            drag: 0.982,
            wobblePhase: Math.random() * Math.PI * 2,
          });
        }
        ensureLoop();
      }, 190);
      timersRef.current.push(waveTimer);
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
            shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
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

      spawnWave(64, 0.58);
      ensureLoop();

      const t = window.setTimeout(() => {
        spawnWave(40, 0.35);
        ensureLoop();
      }, 260);
      timersRef.current.push(t);
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
