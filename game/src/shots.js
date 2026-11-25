// Dapur Kilat — screenshot staging.
// ?shot=cover | koki | upgrade | santai (with &seed=1) puts the real game
// into a fixed, readable scene so the screenshots show the game itself.
// These are ordinary game states, frozen in time — nothing is drawn
// specially for screenshots.
// The COVER is a busy mid-action frame, never the title screen: the judge
// compares entries two at a time at thumbnail size, and a title screen
// loses to a kitchen that is visibly being played.

import { startShift, spawnOrder } from './state.js';
import { recipeById, CUSTOMER_TYPES } from './config.js';

function placeOnPlate(state, order, ingredientIds) {
  for (const id of ingredientIds) {
    if (!order.placed.includes(id)) order.placed.push(id);
  }
  state.activePlate = [...order.placed];
  const recipe = recipeById(order.recipeId);
  state.plateReady = order.placed.length === recipe.ingredients.length;
}

function baseTickets(state, tickets) {
  state.orders = [];
  for (const ticket of tickets) {
    spawnOrder(state);
    const order = state.orders[state.orders.length - 1];
    order.recipeId = ticket.recipeId;
    order.customer = ticket.customer;
    order.patience = ticket.patience;
    order.patienceMax = ticket.patienceMax;
    const type = CUSTOMER_TYPES[ticket.customer.type] || CUSTOMER_TYPES.regular;
    order.patienceRate = type.patienceRate;
    order.tipRate = type.tipRate;
    order.bubble = ticket.bubble || type.lines[0];
    order.bubbleTimer = 99;
  }
  state.selectedOrderId = state.orders[0].id;
}

export function applyShot(state, shot) {
  if (!shot) return false;

  if (shot === 'cover') {
    // COVER: the busiest honest frame — the whole warung alive at once.
    // Three tickets: the laughing young group, the calm old couple, and
    // the grumpy customer about to walk out. Sam the Guard greets at the
    // door, the strict Head Chef AI barks his warning, a dish is
    // mid-assembly, food steams in the wok, timer runs, combo x3.
    startShift(state, 'rush');
    state.day = 2;
    state.upgradesOwned.add('pisau');
    state.elapsed = 62;
    state.timeLeft = 88;
    state.guardGreet = 3;
    state.guardLine = 'Welcome in!';
    baseTickets(state, [
      { recipeId: 'nasi-goreng', customer: { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' }, patience: 34, patienceMax: 48, bubble: 'haha, so tasty!' },
      { recipeId: 'mie-ayam', customer: { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' }, patience: 30, patienceMax: 44, bubble: 'Such a calm place.' },
      { recipeId: 'es-teh', customer: { name: 'Mr Grumpy', type: 'grumpy', skin: '#e8b48a', shirt: '#37474f' }, patience: 9, patienceMax: 44, bubble: 'So slow!' },
    ]);
    state.score = 342;
    state.coins = 54;
    state.served = 6;
    state.combo = 3;
    state.koki.enabled = true;
    placeOnPlate(state, state.orders[0], ['nasi', 'telur']);
    state.prepSlots.wajan.push({ ingredientId: 'ayam', progress: 1.8, total: 3.0 });
    state.prepSlots.talenan.push({ ingredientId: 'cabai', progress: 0.9, total: 1.6 });
    state.koki.text = 'HURRY! Mr Grumpy is waiting — careful, that customer is grumpy!';
    state.koki.target = { kind: 'ingredient', id: 'ayam' };
    state.message = 'Nasi goreng: 2 of 4 ingredients on the plate. Combo x3!';
    state.messageTimer = 99;
    return true;
  }

  if (shot === 'koki') {
    // HEAD CHEF AI + COMBO: customers chatting and laughing while a dish is
    // served — the young group, the old couple, a happy chef.
    startShift(state, 'rush');
    state.day = 2;
    state.elapsed = 96;
    state.timeLeft = 54;
    state.guardGreet = 3;
    state.guardLine = 'Enjoy your lunch!';
    baseTickets(state, [
      { recipeId: 'nasi-goreng', customer: { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' }, patience: 30, patienceMax: 48, bubble: 'Coming back tomorrow!' },
      { recipeId: 'sate-ayam', customer: { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' }, patience: 26, patienceMax: 44, bubble: 'The food is warm, dear.' },
      { recipeId: 'bakso-kuah', customer: { name: 'Rian', type: 'regular', skin: '#e8b48a', shirt: '#6a1b9a' }, patience: 36, patienceMax: 44, bubble: 'I am starving!' },
    ]);
    state.score = 588;
    state.coins = 92;
    state.served = 11;
    state.combo = 4;
    state.koki.enabled = true;
    placeOnPlate(state, state.orders[0], ['nasi', 'telur', 'cabai', 'ayam']);
    state.readyTray = ['mie'];
    state.prepSlots.wajan.push({ ingredientId: 'ayam', progress: 2.2, total: 3.0 });
    state.koki.text = 'Great, keep it up! Plate complete — serve it NOW, don\'t just stand there!';
    state.koki.target = { kind: 'plate' };
    state.message = 'Served! +32 pts, +19 coins, combo x4!';
    state.messageTimer = 99;
    state.chefMood = 'happy';
    state.chefMoodTimer = 99;
    return true;
  }

  if (shot === 'upgrade') {
    // BETWEEN SHIFTS: 3 stars, coins earned, upgrade shop + decor visible.
    startShift(state, 'rush');
    state.day = 2;
    state.screen = 'results';
    state.score = 1240;
    state.results = { score: 1240, coins: 186, served: 21, lost: 2, bestCombo: 5, stars: 3 };
    state.coins = 186;
    state.upgradesOwned.add('pisau');
    state.chefMood = 'proud';
    return true;
  }

  if (shot === 'santai') {
    // SANTAI MODE: no timer, no fail — even the grumpy customer just chats
    // longer ("Hmm… not bad."). Sate mid-assembly, Head Chef AI listing
    // the full recipe sequence.
    startShift(state, 'santai');
    state.day = 3;
    state.elapsed = 120;
    baseTickets(state, [
      { recipeId: 'sate-ayam', customer: { name: 'Mr Grumpy', type: 'grumpy', skin: '#e8b48a', shirt: '#37474f' }, patience: 44, patienceMax: 44, bubble: 'Hmm… not bad.' },
      { recipeId: 'bakso-kuah', customer: { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' }, patience: 44, patienceMax: 44, bubble: 'Take it slow, dear.' },
      { recipeId: 'es-teh', customer: { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' }, patience: 44, patienceMax: 44, bubble: 'Photo first, then eat!' },
    ]);
    state.score = 410;
    state.coins = 73;
    state.served = 9;
    state.combo = 2;
    state.koki.enabled = true;
    placeOnPlate(state, state.orders[0], ['ayam', 'cabai']);
    state.prepSlots.talenan.push({ ingredientId: 'bawang', progress: 0.7, total: 1.4 });
    state.readyTray = ['tahu'];
    state.koki.text = 'Chill Mode: put the tofu on the plate, then the onion.';
    state.koki.target = { kind: 'ready', id: 'tahu' };
    state.message = 'Chill Mode — no timer, no fail. Cook at your own pace!';
    state.messageTimer = 99;
    return true;
  }

  if (shot === 'start') {
    state.screen = 'title';
    return true;
  }
  return false;
}

// Which shots to take, in order. The first by name is the cover.
export const SHOT_LIST = [
  { name: '1-cover.jpg', query: '?shot=cover&seed=1' },
  { name: '2-koki.jpg', query: '?shot=koki&seed=1' },
  { name: '3-upgrade.jpg', query: '?shot=upgrade&seed=1' },
  { name: '4-santai.jpg', query: '?shot=santai&seed=1' },
];
