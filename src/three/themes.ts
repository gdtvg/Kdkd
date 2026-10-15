import * as THREE from 'three';
import { ThemeColors, VisualTheme } from '../types';

export const THEMES: Record<VisualTheme, ThemeColors> = {
  cyberpunk: {
    name: 'cyberpunk',
    label: 'Cyberpunk Neon',
    background: 0x0a0a14,
    bgCss: 'bg-[#0a0a14]',
    boardBase: 0x16162a,
    boardRim: 0x2d1b4e,
    cellSlot: 0x0f0f20,
    ambientLight: 0x4d3875,
    keyLight: 0x00f0ff,
    tilePalette: {
      2: { bg: '#1e293b', text: '#38bdf8', emissive: '#0ea5e9' },
      4: { bg: '#1e1b4b', text: '#818cf8', emissive: '#6366f1' },
      8: { bg: '#4c1d95', text: '#c084fc', emissive: '#a855f7' },
      16: { bg: '#701a75', text: '#f472b6', emissive: '#ec4899' },
      32: { bg: '#831843', text: '#fb7185', emissive: '#f43f5e' },
      64: { bg: '#9f1239', text: '#fda4af', emissive: '#ff0055' },
      128: { bg: '#042f2e', text: '#2dd4bf', emissive: '#14b8a6' },
      256: { bg: '#064e3b', text: '#34d399', emissive: '#10b981' },
      512: { bg: '#78350f', text: '#fbbf24', emissive: '#f59e0b' },
      1024: { bg: '#7c2d12', text: '#fb923c', emissive: '#ea580c' },
      2048: { bg: '#ffd700', text: '#0a0a14', emissive: '#ffea00', metalness: 0.8, roughness: 0.2 },
      4096: { bg: '#00f0ff', text: '#000000', emissive: '#00ffff', metalness: 0.9, roughness: 0.1 },
      8192: { bg: '#ff007f', text: '#ffffff', emissive: '#ff007f', metalness: 0.9, roughness: 0.1 },
      16384: { bg: '#a855f7', text: '#ffffff', emissive: '#d946ef', metalness: 0.95, roughness: 0.1 },
    },
  },
  classic: {
    name: 'classic',
    label: 'Klassisch Matt',
    background: 0xfaf8ef,
    bgCss: 'bg-[#faf8ef]',
    boardBase: 0xbbada0,
    boardRim: 0xa09183,
    cellSlot: 0xcdc1b4,
    ambientLight: 0xffeedd,
    keyLight: 0xfffaf0,
    tilePalette: {
      2: { bg: '#eee4da', text: '#776e65' },
      4: { bg: '#ede0c8', text: '#776e65' },
      8: { bg: '#f2b179', text: '#f9f6f2' },
      16: { bg: '#f59563', text: '#f9f6f2' },
      32: { bg: '#f67c5f', text: '#f9f6f2' },
      64: { bg: '#f65e3b', text: '#f9f6f2' },
      128: { bg: '#edcf72', text: '#f9f6f2' },
      256: { bg: '#edcc61', text: '#f9f6f2' },
      512: { bg: '#edc850', text: '#f9f6f2' },
      1024: { bg: '#edc53f', text: '#f9f6f2' },
      2048: { bg: '#edc22e', text: '#f9f6f2', metalness: 0.4, roughness: 0.3 },
      4096: { bg: '#3c3a32', text: '#f9f6f2' },
      8192: { bg: '#2b2923', text: '#f9f6f2' },
      16384: { bg: '#1c1b18', text: '#f9f6f2' },
    },
  },
  midnight: {
    name: 'midnight',
    label: 'Obsidian & Gold',
    background: 0x0f1115,
    bgCss: 'bg-[#0f1115]',
    boardBase: 0x1a1e24,
    boardRim: 0x282e38,
    cellSlot: 0x12151a,
    ambientLight: 0x222a38,
    keyLight: 0xffe8ba,
    tilePalette: {
      2: { bg: '#222831', text: '#94a3b8' },
      4: { bg: '#2c3440', text: '#cbd5e1' },
      8: { bg: '#394867', text: '#f1f5f9' },
      16: { bg: '#475569', text: '#ffffff' },
      32: { bg: '#584968', text: '#fce7f3' },
      64: { bg: '#713f63', text: '#fdf2f8' },
      128: { bg: '#7c5234', text: '#ffedd5' },
      256: { bg: '#9a6735', text: '#fffbeb' },
      512: { bg: '#b87d28', text: '#ffffff' },
      1024: { bg: '#d49b28', text: '#ffffff' },
      2048: { bg: '#ffd700', text: '#1a1a1a', emissive: '#b39200', metalness: 0.85, roughness: 0.2 },
      4096: { bg: '#e0e7ff', text: '#1e1b4b', emissive: '#818cf8', metalness: 0.9, roughness: 0.15 },
      8192: { bg: '#f43f5e', text: '#ffffff', emissive: '#9f1239', metalness: 0.8, roughness: 0.2 },
      16384: { bg: '#06b6d4', text: '#ffffff', emissive: '#0891b2', metalness: 0.9, roughness: 0.1 },
    },
  },
  frost: {
    name: 'frost',
    label: 'Frost & Sapphire',
    background: 0x081b29,
    bgCss: 'bg-[#081b29]',
    boardBase: 0x0f2f4a,
    boardRim: 0x17466e,
    cellSlot: 0x0a2238,
    ambientLight: 0x38bdf8,
    keyLight: 0xe0f2fe,
    tilePalette: {
      2: { bg: '#164e63', text: '#a5f3fc' },
      4: { bg: '#155e75', text: '#cffafe' },
      8: { bg: '#0e7490', text: '#ecfeff' },
      16: { bg: '#0891b2', text: '#ffffff' },
      32: { bg: '#0284c7', text: '#ffffff' },
      64: { bg: '#2563eb', text: '#ffffff' },
      128: { bg: '#1d4ed8', text: '#ffffff' },
      256: { bg: '#1e40af', text: '#ffffff' },
      512: { bg: '#312e81', text: '#e0e7ff' },
      1024: { bg: '#4338ca', text: '#e0e7ff' },
      2048: { bg: '#38bdf8', text: '#082f49', emissive: '#0284c7', metalness: 0.7, roughness: 0.15 },
      4096: { bg: '#f0fdf4', text: '#064e3b', emissive: '#4ade80', metalness: 0.6, roughness: 0.2 },
      8192: { bg: '#fdf4ff', text: '#701a75', emissive: '#e879f9', metalness: 0.7, roughness: 0.15 },
      16384: { bg: '#ffffff', text: '#0f172a', emissive: '#38bdf8', metalness: 0.95, roughness: 0.1 },
    },
  },
};

/**
 * Procedural canvas texture generator for tile faces.
 * In 8K Ultra mode, generates razor-sharp 1024x1024 canvas textures with sub-pixel rendering.
 */
const textureCache = new Map<string, THREE.CanvasTexture>();

export function getTileCanvasTexture(
  value: number,
  theme: VisualTheme,
  maxAnisotropy: number = 16,
  is8K: boolean = false
): THREE.CanvasTexture {
  const cacheKey = `${theme}_${value}_${is8K ? '8k' : 'standard'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const themeConfig = THEMES[theme];
  const palette = themeConfig.tilePalette[value] || {
    bg: '#ffffff',
    text: '#000000',
    emissive: '#ffffff',
  };

  const canvas = document.createElement('canvas');
  const size = is8K ? 1024 : 512;
  const scale = size / 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Background fill
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, size, size);

  // 2. Subtle inset vignette and rim highlights
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.15, size / 2, size / 2, size * 0.7);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 3. Delicate rounded border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 14 * scale;
  ctx.strokeRect(10 * scale, 10 * scale, size - 20 * scale, size - 20 * scale);

  // 4. Subtle inner corner marks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const cornerSize = 24 * scale;
  const cornerThick = 6 * scale;
  ctx.fillRect(20 * scale, 20 * scale, cornerSize, cornerThick);
  ctx.fillRect(20 * scale, 20 * scale, cornerThick, cornerSize);
  ctx.fillRect(size - 20 * scale - cornerSize, 20 * scale, cornerSize, cornerThick);
  ctx.fillRect(size - 26 * scale, 20 * scale, cornerThick, cornerSize);

  // 5. Draw big central number
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const valStr = value.toString();
  let baseFontSize = 210;
  if (valStr.length === 3) baseFontSize = 170;
  if (valStr.length === 4) baseFontSize = 135;
  if (valStr.length === 5) baseFontSize = 105;
  if (valStr.length >= 6) baseFontSize = 85;

  const fontSize = baseFontSize * scale;
  ctx.font = `900 ${fontSize}px "Inter", "Segoe UI", system-ui, -apple-system, sans-serif`;

  if (value >= 128) {
    ctx.shadowColor = palette.emissive || 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = (value >= 1024 ? 32 : 18) * scale;
  }

  ctx.fillText(valStr, size / 2, size / 2 + (fontSize * 0.05));

  // Small milestone badge for 2048+
  if (value >= 2048) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.text;
    ctx.font = `700 ${32 * scale}px "Inter", sans-serif`;
    ctx.fillText('★ LEGEND ★', size / 2, size - 55 * scale);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}
