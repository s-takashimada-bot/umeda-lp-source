// 線のアイコン（24×24）。色は文字色（currentColor）に合わせる。
const p = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.2c2.3.2 4 1.8 4.6 4.8"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17h2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowBig: '<path d="M3 12h16M13 5l7 7-7 7"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5" rx=".6"/><rect x="12" y="8" width="3" height="9" rx=".6"/><rect x="17" y="5" width="3" height="12" rx=".6"/>',
  cart: '<path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7"/><circle cx="9.5" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/>',
  megaphone: '<path d="M4 10v4a1 1 0 001 1h2l7 4V5L7 9H5a1 1 0 00-1 1z"/><path d="M17.5 9.5a3.5 3.5 0 010 5M8 15l1.2 4.5"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 014 13.5z"/><path d="M8 9h8M8 12.5h5"/>',
  yen: '<path d="M6 4l6 8 6-8M12 12v8M7.5 13h9M7.5 16.5h9"/>',
  board: '<rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M3.5 9h17M9 9v11"/><path d="M12 13h5M12 16h3"/>',
  idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0012 3z"/>',
  forecast: '<path d="M7 15a4 4 0 01.6-8 5 5 0 019.6 1.5A3.5 3.5 0 0117 15z"/><path d="M5 20l3.5-3 3 2 4.5-4.5 3 2.5"/>',
  recipe: '<path d="M6 3.5h9.5l3 3V20a.5.5 0 01-.5.5H6a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"/><path d="M9 9h6M9 12.5h6M9 16h3"/><circle cx="16" cy="16" r="1.6"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><rect x="8" y="6" width="8" height="3.5" rx=".8"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  pause: '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
  building: '<path d="M4 20.5h16M6 20.5V5a1 1 0 011-1h7a1 1 0 011 1v15.5M15 9h3a1 1 0 011 1v10.5"/><path d="M9 8h3M9 11.5h3M9 15h3"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M4.5 7l7.5 6 7.5-6"/>',
};

const line = '<svg class="ico ico-line" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.9-3.5 8-6c1.4-1.6 2-3.2 2-4.8C22 6.6 17.5 3 12 3zM8.3 13.4H6.3a.5.5 0 01-.5-.5V9a.5.5 0 011 0v3.4h1.5a.5.5 0 010 1zm2-.5a.5.5 0 01-1 0V9a.5.5 0 011 0zm4.8 0a.5.5 0 01-.9.3l-2-2.8v2.5a.5.5 0 01-1 0V9a.5.5 0 01.9-.3l2 2.8V9a.5.5 0 011 0zm3.2-2.5a.5.5 0 010 1h-1.5v1h1.5a.5.5 0 010 1h-2a.5.5 0 01-.5-.5V9a.5.5 0 01.5-.5h2a.5.5 0 010 1h-1.5v1z"/></svg>';

export function icon(name) {
  if (name === 'line') return line;
  const d = p[name] || p.check;
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
