import { MAX_BUMPS, ThemeMeta } from './types';

export interface VictoryPosterPayload {
  kind: 'wall' | 'weekly' | 'blitz';
  headline: string;
  subtitle: string;
  levelTitle: string;
  packStamp: string;
  accentHex: string;
  stars?: 1 | 2 | 3;
  sheetsPeeled: number;
  bumps?: number;
  timeLabel: string;
  maxCombo: number;
  badgeText?: string;
  /** For Blitz runs */
  wallsCleared?: number;
  spotlessWalls?: number;
  bonusSecEarned?: number;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
}

function drawBauhausStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  filled: boolean
) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#e4b43c' : '#e5decb';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#111111';
  ctx.stroke();
}

function drawArrowGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  dir: 'R' | 'U' | 'L' | 'D',
  fill: string
) {
  ctx.save();
  ctx.translate(x, y);
  const angle = dir === 'R' ? 0 : dir === 'D' ? Math.PI / 2 : dir === 'L' ? Math.PI : -Math.PI / 2;
  ctx.rotate(angle);
  const s = size / 44;
  ctx.beginPath();
  ctx.moveTo(-14 * s, -5.5 * s);
  ctx.lineTo(2 * s, -5.5 * s);
  ctx.lineTo(2 * s, -13 * s);
  ctx.lineTo(16 * s, 0);
  ctx.lineTo(2 * s, 13 * s);
  ctx.lineTo(2 * s, 5.5 * s);
  ctx.lineTo(-14 * s, 5.5 * s);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#111111';
  ctx.stroke();
  ctx.restore();
}

function formatPosterDate(): string {
  const d = new Date();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
}

/**
 * Renders a crisp framed 1080x1350 Bauhaus exhibition art print PNG of the player's
 * victory stats and triggers an immediate download.
 */
export function downloadVictoryPoster(payload: VictoryPosterPayload): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const W = 1080;
      const H = 1350;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(false);
        return;
      }

      const ink = '#111111';
      const cream = '#f5f0e2';
      const paperLight = '#faf6ea';
      const red = '#d6302a';
      const ochre = '#e4b43c';
      const blue = '#2b56a3';

      // 1. Archival Cream Paper Background + Subtle Grid Lines
      ctx.fillStyle = cream;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(17, 17, 17, 0.08)';
      ctx.lineWidth = 2;
      for (let x = 60; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 60; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 2. Heavy Bauhaus Outer Exhibition Frame
      const pad = 54;
      const fw = W - pad * 2;
      const fh = H - pad * 2;

      // Hard offset drop shadow
      ctx.fillStyle = ink;
      ctx.fillRect(pad + 14, pad + 14, fw, fh);

      ctx.fillStyle = paperLight;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 8;
      drawRoundedRect(ctx, pad, pad, fw, fh);

      // 3. Top Mondrian Tri-Color Band
      const bandH = 34;
      const colW = fw / 3;
      ctx.lineWidth = 6;
      ctx.fillStyle = ochre;
      drawRoundedRect(ctx, pad, pad, colW, bandH);
      ctx.fillStyle = red;
      drawRoundedRect(ctx, pad + colW, pad, colW, bandH);
      ctx.fillStyle = blue;
      drawRoundedRect(ctx, pad + colW * 2, pad, colW, bandH);

      // 4. Header Lockup Bar (STICKY [NOTES] + Pack Stamp)
      const headerY = pad + bandH;
      const headerH = 128;
      ctx.fillStyle = cream;
      drawRoundedRect(ctx, pad, headerY, fw, headerH);

      // STICKY text
      ctx.fillStyle = ink;
      ctx.font = '900 54px Outfit, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('STICKY', pad + 42, headerY + headerH / 2 + 2);

      // [NOTES] red block
      const notesX = pad + 246;
      const notesY = headerY + 28;
      ctx.fillStyle = ink;
      ctx.fillRect(notesX + 5, notesY + 5, 204, 70);
      ctx.fillStyle = red;
      ctx.lineWidth = 5;
      drawRoundedRect(ctx, notesX, notesY, 204, 70);
      ctx.fillStyle = paperLight;
      ctx.font = '900 50px Outfit, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOTES', notesX + 102, notesY + 37);

      // Pack Stamp Box (top right)
      ctx.fillStyle = ink;
      ctx.font = '800 22px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(payload.packStamp.toUpperCase(), pad + fw - 38, headerY + headerH / 2 - 14);
      ctx.fillStyle = 'rgba(17,17,17,0.6)';
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.fillText(formatPosterDate(), pad + fw - 38, headerY + headerH / 2 + 20);

      // 5. Geometric Bauhaus Art Strip (Left Accent Block + Right Hero Title)
      const heroY = headerY + headerH;
      const heroH = 388;
      const leftArtW = 290;

      // Left Constructivist Artwork Panel
      ctx.fillStyle = payload.accentHex || blue;
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, pad, heroY, leftArtW, heroH);

      // Bauhaus geometric composition inside left art panel
      ctx.fillStyle = ochre;
      ctx.beginPath();
      ctx.arc(pad + leftArtW / 2, heroY + 130, 82, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = ink;
      ctx.stroke();

      // Mini Sticky Note Tile overlapping circle
      ctx.fillStyle = ink;
      ctx.fillRect(pad + 64, heroY + 188, 124, 124);
      ctx.fillStyle = paperLight;
      drawRoundedRect(ctx, pad + 56, heroY + 180, 124, 124);
      drawArrowGlyph(ctx, pad + 118, heroY + 242, 68, 'R', red);

      // Small primary square accent
      ctx.fillStyle = red;
      drawRoundedRect(ctx, pad + 196, heroY + 256, 56, 56);

      // Right Hero Headline Panel
      const rightX = pad + leftArtW;
      const rightW = fw - leftArtW;
      ctx.fillStyle = paperLight;
      drawRoundedRect(ctx, rightX, heroY, rightW, heroH);

      // Subtitle / Level Label
      ctx.fillStyle = 'rgba(17, 17, 17, 0.65)';
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(payload.levelTitle.toUpperCase(), rightX + 44, heroY + 66);

      // Main Headline (supports wrapping into 2 lines cleanly)
      ctx.fillStyle = ink;
      ctx.font = '900 66px Outfit, system-ui, sans-serif';
      const words = payload.headline.toUpperCase().split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > rightW - 84 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);

      lines.slice(0, 2).forEach((ln, idx) => {
        ctx.fillText(ln, rightX + 44, heroY + 148 + idx * 72);
      });

      // Badge Pill / Seal Strip
      const badgeY = heroY + (lines.length > 1 ? 268 : 228);
      if (payload.badgeText) {
        const badgeFill = payload.kind === 'blitz' ? red : payload.kind === 'weekly' ? blue : ochre;
        const badgeTextCol = payload.kind === 'wall' ? ink : paperLight;
        ctx.font = '800 22px "JetBrains Mono", monospace';
        const bw = Math.min(rightW - 88, ctx.measureText(payload.badgeText.toUpperCase()).width + 44);
        ctx.fillStyle = ink;
        ctx.fillRect(rightX + 48, badgeY + 5, bw, 48);
        ctx.fillStyle = badgeFill;
        ctx.lineWidth = 4;
        drawRoundedRect(ctx, rightX + 44, badgeY, bw, 48);
        ctx.fillStyle = badgeTextCol;
        ctx.fillText(payload.badgeText.toUpperCase(), rightX + 64, badgeY + 25);
      } else {
        ctx.fillStyle = 'rgba(17, 17, 17, 0.72)';
        ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
        const trimmedSub =
          payload.subtitle.length > 46 ? `${payload.subtitle.slice(0, 45)}…` : payload.subtitle;
        ctx.fillText(trimmedSub, rightX + 44, badgeY + 18);
      }

      // 6. Centerpiece Rating Band (3 Bauhaus Stars OR Blitz Hero Wall Counter)
      const midY = heroY + heroH;
      const midH = 228;
      ctx.fillStyle = cream;
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, pad, midY, fw, midH);

      if (payload.kind === 'blitz') {
        ctx.fillStyle = red;
        ctx.font = '900 108px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${payload.wallsCleared ?? 0}`, pad + fw / 2, midY + 96);
        ctx.fillStyle = ink;
        ctx.font = '900 30px Outfit, system-ui, sans-serif';
        ctx.fillText('WALLS CLEARED IN 60-SECOND BLITZ', pad + fw / 2, midY + 178);
      } else {
        const stars = payload.stars ?? 3;
        const starSpacing = 148;
        const startX = pad + fw / 2 - starSpacing;
        for (let i = 0; i < 3; i++) {
          drawBauhausStar(ctx, startX + i * starSpacing, midY + 96, 54, 24, i < stars);
        }
        ctx.fillStyle = ink;
        ctx.font = '800 24px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          stars === 3
            ? '★★★  SPOTLESS ARCHIVAL CLEAR  ★★★'
            : stars === 2
              ? '★★  CLEAN STUDIO CLEAR  ★★'
              : '★  WALL COMPLETED  ★',
          pad + fw / 2,
          midY + 186
        );
      }

      // 7. 4-Column Bauhaus Tabular Stats Grid
      const statsY = midY + midH;
      const statsH = 216;
      const statCols =
        payload.kind === 'blitz'
          ? [
              { label: 'SHEETS', value: `${payload.sheetsPeeled}`, bg: paperLight },
              { label: 'SPOTLESS', value: `${payload.spotlessWalls ?? 0}`, bg: '#e4b43c44' },
              { label: 'BONUS TIME', value: `+${payload.bonusSecEarned ?? 0}s`, bg: paperLight },
              { label: 'MAX STREAK', value: `×${payload.maxCombo}`, bg: paperLight },
            ]
          : [
              { label: 'SHEETS', value: `${payload.sheetsPeeled}`, bg: paperLight },
              {
                label: 'BUMPS',
                value: `${payload.bumps ?? 0}/${MAX_BUMPS}`,
                bg: (payload.bumps ?? 0) === 0 ? '#e4b43c44' : paperLight,
              },
              { label: 'TIME', value: payload.timeLabel, bg: paperLight },
              { label: 'STREAK', value: `×${payload.maxCombo}`, bg: paperLight },
            ];

      const statW = fw / 4;
      statCols.forEach((cell, idx) => {
        const cx = pad + idx * statW;
        ctx.fillStyle = cell.bg;
        ctx.lineWidth = 6;
        drawRoundedRect(ctx, cx, statsY, statW, statsH);

        ctx.fillStyle = 'rgba(17,17,17,0.6)';
        ctx.font = '800 21px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cell.label, cx + statW / 2, statsY + 64);

        ctx.fillStyle = ink;
        ctx.font = '900 50px "JetBrains Mono", monospace';
        ctx.fillText(cell.value, cx + statW / 2, statsY + 140);
      });

      // 8. Bottom Bauhaus Archival Strip
      const footY = statsY + statsH;
      const footH = pad + fh - footY;
      ctx.fillStyle = ink;
      drawRoundedRect(ctx, pad, footY, fw, footH);

      // Decorative mini arrow tiles in footer
      const tileColors = [ochre, red, blue];
      const dirs: ('U' | 'R' | 'D')[] = ['U', 'R', 'D'];
      tileColors.forEach((col, i) => {
        const tx = pad + 40 + i * 68;
        const ty = footY + (footH - 54) / 2;
        ctx.fillStyle = col;
        ctx.lineWidth = 3;
        ctx.strokeStyle = paperLight;
        drawRoundedRect(ctx, tx, ty, 54, 54);
        drawArrowGlyph(ctx, tx + 27, ty + 27, 28, dirs[i], i === 0 ? ink : paperLight);
      });

      ctx.fillStyle = cream;
      ctx.font = '800 24px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('BAUHAUS GRID PUZZLE · STUDIO ARCHIVE PRINT', pad + fw - 42, footY + footH / 2 + 2);

      // Export PNG and trigger download
      const slug = payload.levelTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const filename = `sticky-notes-poster-${slug || 'victory'}.png`;

      const triggerDownload = (url: string, revokeAfter: boolean) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (revokeAfter) {
          window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        }
        resolve(true);
      };

      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((blob) => {
          if (blob) {
            triggerDownload(URL.createObjectURL(blob), true);
          } else {
            triggerDownload(canvas.toDataURL('image/png'), false);
          }
        }, 'image/png');
      } else {
        triggerDownload(canvas.toDataURL('image/png'), false);
      }
    } catch {
      resolve(false);
    }
  });
}

export function getThemePosterAccent(theme: ThemeMeta): string {
  return theme.accentHex || '#2b56a3';
}
