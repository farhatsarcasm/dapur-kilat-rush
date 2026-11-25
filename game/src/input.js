// The Last Wok — input: walk the warung, talk to people, cook.
// WASD / arrow keys to walk, or tap anywhere to walk there. Walk up to
// a station, a table, the order board, Sam or Mochi and press E (or tap
// it) to interact. No dragging anywhere. M mutes, P pauses, K toggles
// Head Chef AI, ? opens the tutorial.

import { INGREDIENTS, HIRE_COST, ROOM } from './config.js';
import { startShift, startNextDay, buyUpgrade, buyIngredient, hireKoki, setDecor, nearestInteractable, doInteract, setWalkTarget } from './state.js';
import { sounds, setMuted, isMuted } from './audio.js';

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

// Which interactable (if any) did this tap land on? Stations and tables
// are big targets; the board, Sam and Mochi are smaller ones. A tap
// near an approach point counts too — players tap where they want Rani
// to stand, which is just outside the counter/table rects.
function interactableAt(state, point) {
  if (state.screen !== 'playing') return null;
  const nearApproach = (ax, ay) => Math.hypot(point.x - ax, point.y - ay) < 90;
  for (const station of Object.values(ROOM.stations)) {
    if (inside(point, station) || nearApproach(station.approach.x, station.approach.y)) {
      return { kind: 'station', id: station.id, x: station.approach.x, y: station.approach.y };
    }
  }
  for (const table of ROOM.tables) {
    if (inside(point, table) || nearApproach(table.approach.x, table.approach.y)) {
      return { kind: 'table', id: table.id, x: table.approach.x, y: table.approach.y };
    }
  }
  if (inside(point, ROOM.board) || nearApproach(140, 292)) return { kind: 'board', id: 'board', x: 140, y: 292 };
  const gx = state.guardX ?? ROOM.guardSpot.x;
  const gy = state.guardY ?? ROOM.guardSpot.y;
  const guard = { x: gx - 30, y: gy - 34, w: 60, h: 68 };
  if (inside(point, guard)) return { kind: 'guard', id: 'guard', x: gx, y: gy + 40 };
  const mochi = state.mochi;
  if (Math.hypot(point.x - mochi.x, point.y - mochi.y) < 32) {
    return { kind: 'mochi', id: 'mochi', x: mochi.x, y: mochi.y };
  }
  return null;
}

export function handleClick(state, point) {
  const ui = state.ui || { ingredients: [], ready: [], orders: [], buttons: [] };

  // Buttons first (menu, pause, mute, upgrades, decor, Head Chef AI).
  for (const button of ui.buttons) {
    if (!inside(point, button)) continue;
    return handleButton(state, button.id);
  }

  if (state.screen === 'playing' && !state.paused) {
    const it = interactableAt(state, point);
    const player = state.player;
    if (it) {
      // Tapped something to use: walk there, then interact on arrival —
      // or interact at once when already close enough.
      const near = nearestInteractable(state);
      if (near && near.kind === it.kind && near.id === it.id) {
        const result = doInteract(state, it);
        if (result === 'served') sounds.serve();
        if (result === 'started') sounds.sizzle();
        if (result === 'take-order' || result === 'talk' || result === 'board' || result === 'guard-info' || result === 'pet-mochi') sounds.click();
        if (result === 'no-order' || result === 'wrong-station' || result === 'no-stock' || result === 'station-busy') sounds.wrong();
        return result;
      }
      setWalkTarget(state, it.x, it.y, it);
      sounds.click();
      return 'walk-to-interact';
    }
    // Tapped open floor: tap-to-move. Clamped to the room.
    setWalkTarget(state,
      Math.max(ROOM.floor.x + 16, Math.min(ROOM.floor.x + ROOM.floor.w - 16, point.x)),
      Math.max(ROOM.floor.y + 16, Math.min(ROOM.floor.y + ROOM.floor.h - 16, point.y)),
      null);
    return 'walk-to';
  }
  return 'none';
}

function handleButton(state, id) {
  sounds.click();
  if (id === 'skip-intro') { state.screen = 'title'; return 'skip-intro'; }
  if (id === 'mode-rush') { startShift(state, 'rush'); return 'start-rush'; }
  if (id === 'mode-santai') { startShift(state, 'santai'); return 'start-santai'; }
  if (id === 'tutorial') { state.showTutorial = true; return 'tutorial'; }
  if (id === 'close-tutorial') { state.showTutorial = false; return 'close-tutorial'; }
  if (id === 'mute') { state.muted = !isMuted(); setMuted(state.muted); return 'mute'; }
  if (id === 'pause') { state.paused = !state.paused; return 'pause'; }
  if (id === 'koki') { state.koki.enabled = !state.koki.enabled; return 'koki'; }
  if (id === 'play-again') { state.day += 1; startShift(state, state.mode); return 'play-again'; }
  if (id === 'market') { state.screen = 'market'; return 'market'; }
  if (id === 'back-results') { state.screen = 'results'; return 'back-results'; }
  if (id === 'start-day') { startNextDay(state); return 'start-day'; }
  if (id === 'hire-koki') {
    const hired = hireKoki(state);
    state.message = hired ? `Head Chef AI hired for tomorrow — ${HIRE_COST} coins!` : 'Not enough coins to hire Head Chef AI yet!';
    state.messageTimer = 2.5;
    return hired ? 'hire-bought' : 'hire-denied';
  }
  if (id.startsWith('buy-')) {
    const parts = id.slice(4).split('-');
    const qty = parseInt(parts.pop(), 10);
    const ingredientId = parts.join('-');
    const ingredient = INGREDIENTS.find((item) => item.id === ingredientId);
    const bought = buyIngredient(state, ingredientId, qty);
    state.message = bought
      ? `Bought ${qty}× ${ingredient ? ingredient.name : ingredientId} for the pantry!`
      : 'Not enough coins for that — serve more dishes first!';
    state.messageTimer = 2.5;
    return bought ? 'buy-bought' : 'buy-denied';
  }
  if (id === 'change-mode') { state.screen = 'title'; return 'change-mode'; }
  if (id.startsWith('upgrade-')) {
    const bought = buyUpgrade(state, id.slice('upgrade-'.length));
    state.message = bought ? 'Upgrade bought with coins!' : 'Not enough coins yet — serve more dishes!';
    state.messageTimer = 2.5;
    return bought ? 'upgrade-bought' : 'upgrade-denied';
  }
  if (id.startsWith('decor-')) { setDecor(state, id.slice('decor-'.length)); return 'decor'; }
  return 'button';
}

export function handleKey(state, key) {
  const lower = key.toLowerCase();
  // The one name-story panel: any of Enter / Space / Escape skips it.
  if (state.screen === 'intro') {
    if (lower === 'enter' || lower === ' ' || lower === 'spacebar' || lower === 'escape') {
      state.screen = 'title';
      return 'skip-intro';
    }
    return 'none';
  }
  if (state.screen === 'market') {
    if (lower === 'enter' || lower === ' ' || lower === 'spacebar' || lower === 'escape') {
      if (lower === 'escape') { state.screen = 'results'; return 'back-results'; }
      startNextDay(state);
      return 'start-day';
    }
    return 'none';
  }
  if (lower === 'm') { state.muted = !isMuted(); setMuted(state.muted); return 'mute'; }
  if (lower === 'k') { state.koki.enabled = !state.koki.enabled; return 'koki'; }
  if (lower === 'p' && state.screen === 'playing') { state.paused = !state.paused; return 'pause'; }
  if (lower === '?' || lower === '/') { state.showTutorial = !state.showTutorial; return 'tutorial'; }
  if (state.screen === 'playing' && !state.paused) {
    // E or Space or Enter: interact with whatever is close.
    if (lower === 'e' || lower === ' ' || lower === 'spacebar' || lower === 'enter') {
      const it = nearestInteractable(state);
      if (!it) return 'none';
      const result = doInteract(state, it);
      if (result === 'served') sounds.serve();
      if (result === 'started') sounds.sizzle();
      if (result === 'take-order' || result === 'talk' || result === 'board' || result === 'guard-info' || result === 'pet-mochi') sounds.click();
      if (result === 'no-order' || result === 'wrong-station' || result === 'no-stock' || result === 'station-busy') sounds.wrong();
      return result;
    }
  }
  return 'none';
}

// Held movement keys (WASD / arrows). Key repeat is ignored — the key
// stays down until keyup, and the game loop reads state.keys.
export function handleKeyDown(state, key) {
  const lower = key.toLowerCase();
  if (lower === 'w' || lower === 'arrowup') { state.keys.up = true; return 'move'; }
  if (lower === 's' || lower === 'arrowdown') { state.keys.down = true; return 'move'; }
  if (lower === 'a' || lower === 'arrowleft') { state.keys.left = true; return 'move'; }
  if (lower === 'd' || lower === 'arrowright') { state.keys.right = true; return 'move'; }
  return 'none';
}

export function handleKeyUp(state, key) {
  const lower = key.toLowerCase();
  if (lower === 'w' || lower === 'arrowup') state.keys.up = false;
  if (lower === 's' || lower === 'arrowdown') state.keys.down = false;
  if (lower === 'a' || lower === 'arrowleft') state.keys.left = false;
  if (lower === 'd' || lower === 'arrowright') state.keys.right = false;
}
