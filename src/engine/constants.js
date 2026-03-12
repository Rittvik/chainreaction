// ─── Player colour palettes ────────────────────────────────────
export const PLAYER_COLORS = [
  { color: '#ff4f6d', glow: '#ff4f6d66', name: 'Crimson' },
  { color: '#4fa8ff', glow: '#4fa8ff66', name: 'Azure'   },
  { color: '#4fffb0', glow: '#4fffb066', name: 'Emerald' },
  { color: '#ffb84f', glow: '#ffb84f66', name: 'Amber'   },
  { color: '#c77dff', glow: '#c77dff66', name: 'Violet'  },
  { color: '#ff7f4f', glow: '#ff7f4f66', name: 'Coral'   },
];

// ─── Grid configurations ────────────────────────────────────────
export const GRID_STYLES = {
  classic: { cols: 7, rows: 9, label: 'Classic', gap: 4, pad: 12 },
  neon:    { cols: 6, rows: 8, label: 'Neon',    gap: 3, pad: 10 },
};

export const MIN_PLAYERS    = 2;
export const MAX_PLAYERS    = 6;
export const AI_DELAY_MS    = 600;
export const EXPLODE_DELAY_MS = 160;
