import Phaser from 'phaser';
import type { BubbleColor } from '../config/constants';

// Neon color palette for each bubble color
const NEON_COLORS: Record<BubbleColor, { core: string; rim: string; glow: string; highlight: string }> = {
  blue:   { core: '#0088ff', rim: '#00bbff', glow: '#0066dd', highlight: '#88ddff' },
  orange: { core: '#ff8800', rim: '#ffaa33', glow: '#dd6600', highlight: '#ffcc88' },
  green:  { core: '#00dd44', rim: '#44ff88', glow: '#00aa33', highlight: '#88ffbb' },
  purple: { core: '#aa44ff', rim: '#cc66ff', glow: '#8833dd', highlight: '#ddaaff' },
  red:    { core: '#ff2244', rim: '#ff5566', glow: '#dd1133', highlight: '#ff99aa' },
  yellow: { core: '#ffdd00', rim: '#ffee44', glow: '#ddbb00', highlight: '#ffff88' },
};

export const NEON_HEX: Record<BubbleColor, number> = {
  blue:   0x00bbff,
  orange: 0xffaa33,
  green:  0x44ff88,
  purple: 0xcc66ff,
  red:    0xff5566,
  yellow: 0xffee44,
};

const TEX_SIZE = 64;

export function generateNeonBubbleTextures(scene: Phaser.Scene): void {
  const colors = Object.keys(NEON_COLORS) as BubbleColor[];
  for (const color of colors) {
    const key = `neon_${color}`;
    if (scene.textures.exists(key)) continue;

    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d')!;
    const cx = TEX_SIZE / 2;
    const cy = TEX_SIZE / 2;
    const r = TEX_SIZE / 2 - 4; // leave room for glow
    const palette = NEON_COLORS[color];

    // Outer glow
    const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r + 3);
    outerGlow.addColorStop(0, 'transparent');
    outerGlow.addColorStop(0.7, palette.glow + '44');
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

    // Main body gradient
    const bodyGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
    bodyGrad.addColorStop(0, palette.highlight);
    bodyGrad.addColorStop(0.35, palette.core);
    bodyGrad.addColorStop(0.85, palette.glow);
    bodyGrad.addColorStop(1, palette.rim);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Glowing rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = 2;
    ctx.shadowColor = palette.rim;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glossy highlight (top-left)
    const highlightGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx - r * 0.3, cy - r * 0.35, r * 0.55);
    highlightGrad.addColorStop(0, 'rgba(255,255,255,0.65)');
    highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = highlightGrad;
    ctx.fill();

    // Inner glow at bottom
    const innerGlow = ctx.createRadialGradient(cx, cy + r * 0.3, 0, cx, cy + r * 0.3, r * 0.6);
    innerGlow.addColorStop(0, palette.core + '55');
    innerGlow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.fill();

    scene.textures.addCanvas(key, canvas);
  }

  // Also generate a glow particle
  if (!scene.textures.exists('neon_particle')) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255,255,255,1)');
    pGrad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    pGrad.addColorStop(1, 'rgba(255,255,255,0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 16, 16);
    scene.textures.addCanvas('neon_particle', pCanvas);
  }

  // Generate a star texture
  if (!scene.textures.exists('neon_star')) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 64;
    sCanvas.height = 64;
    const sCtx = sCanvas.getContext('2d')!;
    const sCx = 32, sCy = 32;
    // Draw a 5-pointed star
    sCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
      const ox = sCx + Math.cos(outerAngle) * 28;
      const oy = sCy + Math.sin(outerAngle) * 28;
      const ix = sCx + Math.cos(innerAngle) * 12;
      const iy = sCy + Math.sin(innerAngle) * 12;
      if (i === 0) sCtx.moveTo(ox, oy);
      else sCtx.lineTo(ox, oy);
      sCtx.lineTo(ix, iy);
    }
    sCtx.closePath();
    const starGrad = sCtx.createRadialGradient(sCx, sCy - 4, 0, sCx, sCy, 30);
    starGrad.addColorStop(0, '#ffffcc');
    starGrad.addColorStop(0.5, '#ffdd44');
    starGrad.addColorStop(1, '#ffaa00');
    sCtx.fillStyle = starGrad;
    sCtx.fill();
    sCtx.strokeStyle = '#ffee88';
    sCtx.lineWidth = 1.5;
    sCtx.shadowColor = '#ffdd44';
    sCtx.shadowBlur = 10;
    sCtx.stroke();
    sCtx.shadowBlur = 0;
    scene.textures.addCanvas('neon_star', sCanvas);
  }

  // Generate an empty star texture
  if (!scene.textures.exists('neon_star_empty')) {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 64;
    sCanvas.height = 64;
    const sCtx = sCanvas.getContext('2d')!;
    const sCx = 32, sCy = 32;
    sCtx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180;
      const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
      const ox = sCx + Math.cos(outerAngle) * 28;
      const oy = sCy + Math.sin(outerAngle) * 28;
      const ix = sCx + Math.cos(innerAngle) * 12;
      const iy = sCy + Math.sin(innerAngle) * 12;
      if (i === 0) sCtx.moveTo(ox, oy);
      else sCtx.lineTo(ox, oy);
      sCtx.lineTo(ix, iy);
    }
    sCtx.closePath();
    sCtx.strokeStyle = '#556688';
    sCtx.lineWidth = 2;
    sCtx.stroke();
    sCtx.fillStyle = 'rgba(30,40,80,0.5)';
    sCtx.fill();
    scene.textures.addCanvas('neon_star_empty', sCanvas);
  }
}
