// Display data for themes and games.
// The 10 themes are free for everyone. The real colours are CSS variables in index.css ([data-theme='...']).
export const THEMES = [
  { id: 'violet', name: 'Violet Night', swatch: ['#0f0c1d', '#8b5cf6', '#ec4899', '#f5b84b'] },
  { id: 'ocean', name: 'Deep Ocean', swatch: ['#08111c', '#0ea5e9', '#14b8a6', '#fbbf24'] },
  { id: 'sunset', name: 'Sunset Drive', swatch: ['#180c0e', '#f97316', '#f43f5e', '#facc15'] },
  { id: 'forest', name: 'Midnight Forest', swatch: ['#09140f', '#22c55e', '#84cc16', '#f59e0b'] },
  { id: 'neon', name: 'Neon Arcade', swatch: ['#06060c', '#d946ef', '#22d3ee', '#facc15'] },
  { id: 'rose', name: 'Rose Quartz', swatch: ['#1a0c14', '#f472b6', '#fb7185', '#fcd34d'] },
  { id: 'aurora', name: 'Aurora', swatch: ['#071a1a', '#2dd4bf', '#a78bfa', '#fde047'] },
  { id: 'mocha', name: 'Mocha', swatch: ['#16100c', '#d6a06a', '#ef8354', '#fcd34d'] },
  { id: 'graphite', name: 'Graphite', swatch: ['#0e1014', '#94a3b8', '#38bdf8', '#fbbf24'] },
  { id: 'candy', name: 'Candy Pop', swatch: ['#150b24', '#a855f7', '#f472b6', '#67e8f9'] },
];
export const THEME_IDS = THEMES.map((t) => t.id);

export const GAME_INFO = {
  ttt: { name: 'Tic Tac Toe', emoji: '❌', blurb: 'Three in a row wins', color: 'from-vibe to-vibe-pink' },
  c4: { name: 'Connect Four', emoji: '🔴', blurb: 'Drop discs, link four', color: 'from-amber-vibe to-vibe-pink' },
  rps: { name: 'Rock Paper Scissors', emoji: '✊', blurb: 'Best of three', color: 'from-vibe-soft to-vibe' },
};
