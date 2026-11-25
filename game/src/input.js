// Dapur Kilat — input: tap-only controls with big targets.
// Mouse click or touch tap, plus keyboard shortcuts. No dragging anywhere:
// click an ingredient, click a ready chip, click the plate to serve.
// Keys: 1-9 and 0 pick ingredients, Space serves, K toggles Head Chef AI,
// P pauses, M mutes, ? opens the tutorial.

import { INGREDIENTS } from './config.js';
import { startShift, tapIngredient, tapReadyIngredient, serveOrder, buyUpgrade, setDecor, selectedOrder } from './state.js';
import { sounds, setMuted, isMuted } from './audio.js';

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w
    && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function handleClick(state, point) {
  const ui = state.ui || { ingredients: [], ready: [], orders: [], buttons: [] };

  // Buttons first (menu, pause, mute, serve, upgrades, decor, Head Chef AI).
  for (const button of ui.buttons) {
    if (!inside(point, button)) continue;
    return handleButton(state, button.id);
  }

  if (state.screen === 'playing') {
    for (const order of ui.orders) {
      if (inside(point, order)) {
        state.selectedOrderId = order.id;
        const current = selectedOrder(state);
        state.activePlate = current ? [...current.placed] : [];
        state.plateReady = false;
        sounds.click();
        return 'select-order';
      }
    }
    for (const ready of ui.ready) {
      if (inside(point, ready)) {
        const result = tapReadyIngredient(state, ready.id);
        if (result === 'placed') sounds.place();
        if (result === 'plate-ready') { sounds.ready(); }
        if (result === 'wrong-dish' || result === 'already') sounds.wrong();
        return result;
      }
    }
    for (const ingredient of ui.ingredients) {
      if (inside(point, ingredient)) {
        const result = tapIngredient(state, ingredient.id);
        if (result === 'started') sounds.sizzle();
        if (result === 'wrong-dish' || result === 'station-busy' || result === 'busy' || result === 'already') {
          sounds.wrong();
          state.message = result === 'wrong-dish'
            ? 'That ingredient is not for this order — check the order board.'
            : result === 'station-busy'
              ? 'That station is full — wait a moment.'
              : 'That ingredient is already being prepped.';
          state.messageTimer = 2;
          state.flashTimer = 0.4;
        }
        return result;
      }
    }
    if (state.ui.plate && inside(point, state.ui.plate) && state.plateReady) {
      return handleServe(state);
    }
  }
  return 'none';
}

function handleServe(state) {
  const served = serveOrder(state);
  if (served) {
    sounds.serve();
    if (state.combo > 1) sounds.combo(state.combo);
    return 'served';
  }
  return 'not-ready';
}

function handleButton(state, id) {
  sounds.click();
  if (id === 'mode-rush') { startShift(state, 'rush'); return 'start-rush'; }
  if (id === 'mode-santai') { startShift(state, 'santai'); return 'start-santai'; }
  if (id === 'tutorial') { state.showTutorial = true; return 'tutorial'; }
  if (id === 'close-tutorial') { state.showTutorial = false; return 'close-tutorial'; }
  if (id === 'mute') { state.muted = !isMuted(); setMuted(state.muted); return 'mute'; }
  if (id === 'pause') { state.paused = !state.paused; return 'pause'; }
  if (id === 'koki') { state.koki.enabled = !state.koki.enabled; return 'koki'; }
  if (id === 'serve') return handleServe(state);
  if (id === 'play-again') { state.day += 1; startShift(state, state.mode); return 'play-again'; }
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
  if (lower === 'm') { state.muted = !isMuted(); setMuted(state.muted); return 'mute'; }
  if (lower === 'k') { state.koki.enabled = !state.koki.enabled; return 'koki'; }
  if (lower === 'p' && state.screen === 'playing') { state.paused = !state.paused; return 'pause'; }
  if (lower === '?' || lower === '/') { state.showTutorial = !state.showTutorial; return 'tutorial'; }
  if (state.screen === 'playing' && !state.paused) {
    if (lower === ' ' || lower === 'spacebar') return handleServe(state);
    const ingredient = INGREDIENTS.find((item) => item.key === lower);
    if (ingredient) {
      const result = tapIngredient(state, ingredient.id);
      if (result === 'started') sounds.sizzle();
      if (result === 'wrong-dish') sounds.wrong();
      return result;
    }
    if (lower === 'enter') return handleServe(state);
  }
  return 'none';
}
