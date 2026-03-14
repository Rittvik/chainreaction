// ─── Player colour palettes (defaults) ─────────────────────────
export const PLAYER_COLORS = [
  { color: '#ff4f6d', glow: '#ff4f6d55', name: 'Crimson' },
  { color: '#4fa8ff', glow: '#4fa8ff55', name: 'Azure'   },
  { color: '#3fffa0', glow: '#3fffa055', name: 'Emerald' },
  { color: '#ffcc4f', glow: '#ffcc4f55', name: 'Amber'   },
  { color: '#cc77ff', glow: '#cc77ff55', name: 'Violet'  },
  { color: '#ff8c4f', glow: '#ff8c4f55', name: 'Coral'   },
];

// ─── Orb colour palette (12 curated colours) ───────────────────
export const ORB_COLORS = [
  { color: '#ff4f6d', glow: '#ff4f6d55' }, // Crimson
  { color: '#ff8c4f', glow: '#ff8c4f55' }, // Coral
  { color: '#ffcc4f', glow: '#ffcc4f55' }, // Amber
  { color: '#f5ff4f', glow: '#f5ff4f55' }, // Yellow
  { color: '#3fffa0', glow: '#3fffa055' }, // Emerald
  { color: '#4ffff5', glow: '#4ffff555' }, // Cyan
  { color: '#4fa8ff', glow: '#4fa8ff55' }, // Azure
  { color: '#4f6fff', glow: '#4f6fff55' }, // Indigo
  { color: '#cc77ff', glow: '#cc77ff55' }, // Violet
  { color: '#ff4fde', glow: '#ff4fde55' }, // Pink
  { color: '#ffffff', glow: '#ffffff44' }, // White
  { color: '#a0b4d0', glow: '#a0b4d044' }, // Silver
];

// ─── Orb emoji choices ──────────────────────────────────────────
export const ORB_EMOJIS = [
  '⚡','💥','🔥','❄️','💎','🚀',
  '👾','🌀','🎯','🍄','👻','🐉',
  '⭐','🌈','🎲','🎮','💫','🌙',
  '🔮','💣','🌊','🍀','🦋','🐸',
];

// ─── Grid configurations ────────────────────────────────────────
export const GRID_STYLES = {
  classic: { cols: 7, rows: 9,  label: 'Classic', gap: 4, pad: 12 },
  neon:    { cols: 6, rows: 8,  label: 'Neon',    gap: 3, pad: 10 },
  plasma:  { cols: 8, rows: 10, label: 'Plasma',  gap: 3, pad: 10 },
};

export const MIN_PLAYERS      = 2;
export const MAX_PLAYERS      = 6;
export const AI_DELAY_MS      = 600;
export const EXPLODE_DELAY_MS = 160;
