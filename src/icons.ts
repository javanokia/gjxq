// Clean vector SVG icons for 3D Chess UI (zero emojis)

export const ICONS = {
  // Logo Crown
  crown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
  </svg>`,

  // Audio On / Off
  volume: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>`,

  volumeMute: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>`,

  // Help / Rules
  help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  // Game Modes
  bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="18" height="12" x="3" y="8" rx="2"/>
    <path d="M12 2v6M2 14h2M20 14h2M9 13v2M15 13v2"/>
  </svg>`,

  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>`,

  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,

  // Actions
  undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>`,

  restart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>`,

  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>`,

  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,

  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,

  handshake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L13 12"/>
    <path d="m18 11 3.3-3.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0L14 7"/>
    <path d="M2 12l5.5-5.5a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4L6 16"/>
    <path d="m7 17-2.3 2.3a1 1 0 0 1-1.4 0l-1.6-1.6a1 1 0 0 1 0-1.4L4 14"/>
  </svg>`,

  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>`,

  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`,

  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>`,

  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/>
  </svg>`,

  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>`,

  // Scene Themes
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
  </svg>`,

  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
    <path d="M6 6h10M6 10h10"/>
  </svg>`,

  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
  </svg>`,

  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>`,

  dice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
    <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>`
};

// Vector Chess Piece Silhouettes (Clean, modern, crisp Staunton paths)
export const CHESS_PIECES_SVG = {
  // King
  k: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/>
        <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/>
      </g>
    </svg>`,

  // Queen
  q: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="12" r="2.5"/>
        <circle cx="14" cy="9" r="2.5"/>
        <circle cx="22.5" cy="8" r="2.5"/>
        <circle cx="31" cy="9" r="2.5"/>
        <circle cx="39" cy="12" r="2.5"/>
        <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-6-15-2.5 15-2.5-15-6 15-7-11 2 12" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M9 26c0 2 1.5 2 2.5 4 2.5 4 1 5.5 1 5.5h20s-1.5-1.5 1-5.5c1-2 2.5-2 2.5-4 0 0-3.5-.5-13.5-.5S9 26 9 26"/>
        <path d="M11.5 30c3.5-1 14.5-1 21 0m-21 3.5c3.5-1 14.5-1 21 0m-21 3.5c3.5-1 14.5-1 21 0"/>
      </g>
    </svg>`,

  // Rook
  r: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-13.5h14l1.5 13.5H14z" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M14 18h17V11H14v7zm0-7l-2-4h4.5l1 2.5h3l1-2.5h4.5l1 2.5h3l1-2.5h4.5l-2 4H14z"/>
        <path d="M11 14h23"/>
      </g>
    </svg>`,

  // Bishop
  b: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="22.5" cy="8" r="2.5"/>
        <path d="M17.5 26c0 3 1.5 6 5 6s5-3 5-6c0-4-3-8.5-5-14-2 5.5-5 10-5 14" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0v3H15v-3zm-3 5c3 2 18 2 21 0v3H12v-3z"/>
        <path d="M21 16.5l3.5 3.5m-3.5 0l3.5-3.5" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}"/>
      </g>
    </svg>`,

  // Knight
  n: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <circle cx="15" cy="14" r="1.5" fill="${isWhite ? '#1e1c1a' : '#c9aa71'}"/>
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0"/>
      </g>
    </svg>`,

  // Pawn
  p: (isWhite: boolean) => `
    <svg viewBox="0 0 45 45" class="piece-svg ${isWhite ? 'white-piece' : 'black-piece'}">
      <g fill="${isWhite ? '#ffffff' : '#1e1c1a'}" stroke="${isWhite ? '#1e1c1a' : '#c9aa71'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="22.5" cy="12" r="5.5" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M19 19.5c-3 3-5 7-5 13.5h17c0-6.5-2-10.5-5-13.5" fill="${isWhite ? '#f8f5eb' : '#23201d'}"/>
        <path d="M12 36c2.5 2.5 18.5 2.5 21 0v3H12v-3z"/>
      </g>
    </svg>`
};

const pieceSvgCache = new Map<string, string>();

export function getPieceSvg(piece: string, color: 'w' | 'b'): string {
  const key = `${piece}_${color}`;
  const cached = pieceSvgCache.get(key);
  if (cached) return cached;

  const p = piece.toLowerCase() as keyof typeof CHESS_PIECES_SVG;
  const renderer = CHESS_PIECES_SVG[p];
  if (renderer) {
    const svg = renderer(color === 'w');
    pieceSvgCache.set(key, svg);
    return svg;
  }
  return '';
}
