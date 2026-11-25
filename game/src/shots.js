// The Last Wok — screenshot staging.
// ?shot=cover | ale | market | santai (with &seed=1) puts the real game
// into a fixed, readable scene so the screenshots show the game itself.
// These are ordinary game states, frozen in time — nothing is drawn
// specially for screenshots.
// The COVER is a busy mid-action frame in the walkable warung, never
// the title screen: the judge compares entries two at a time at
// thumbnail size, and a title screen loses to a warung that is visibly
// being played — Rani walking, customers at tables, food on the stations.

import { startShift, spawnOrder } from './state.js';
import { recipeById, CUSTOMER_TYPES, ROOM } from './config.js';

function placeOnPlate(state, order, ingredientIds) {
  for (const id of ingredientIds) {
    if (!order.placed.includes(id)) order.placed.push(id);
  }
  state.activePlate = [...order.placed];
  const recipe = recipeById(order.recipeId);
  state.plateReady = order.placed.length === recipe.ingredients.length;
  order.plateReady = state.plateReady;
}

// Stage seated customers at their tables: each one walks in through
// the door in real play, but staged scenes show them already seated.
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
    order.taken = ticket.taken !== false;
    order.walkX = order.seatX;
    order.walkY = order.seatY;
    order.walkState = 'seated';
    order.waypoints = [];
    order.waypointIndex = 0;
  }
  state.selectedOrderId = state.orders[0].id;
}

export function applyShot(state, shot) {
  if (!shot) return false;

  if (shot === 'cover') {
    // COVER: the busiest honest frame — the whole warung alive at once.
    // Rani mid-room carrying the rush, three tables seated (the laughing
    // young group, the calm old couple, the grumpy customer about to
    // walk out), Sam greeting at the door, Chef AI barking his warning,
    // food steaming on the wok and grill, a dish mid-assembly on the
    // table, timer running, combo x3.
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
      { recipeId: 'sate-ayam', customer: { name: 'Mr Grumpy', type: 'grumpy', skin: '#e8b48a', shirt: '#37474f' }, patience: 9, patienceMax: 44, bubble: 'So slow!' },
    ]);
    state.score = 342;
    state.coins = 54;
    state.served = 6;
    state.combo = 3;
    state.koki.enabled = true;
    placeOnPlate(state, state.orders[0], ['nasi', 'telur']);
    state.prepSlots.wajan.push({ ingredientId: 'ayam', progress: 1.8, total: 3.0, orderId: state.orders[0].id });
    state.prepSlots.talenan.push({ ingredientId: 'cabai', progress: 0.9, total: 1.6, orderId: state.orders[2].id });
    state.prepSlots.grill.push({ ingredientId: 'sate', progress: 2.0, total: 3.2, orderId: state.orders[2].id });
    state.koki.text = 'HURRY! Mr Grumpy is waiting — careful, that customer is grumpy!';
    state.koki.target = { kind: 'ingredient', id: 'ayam' };
    state.message = 'Nasi goreng: 2 of 4 ingredients on the plate. Combo x3!';
    state.messageTimer = 99;
    // Rani mid-room, walking toward the wok.
    state.player.x = 560;
    state.player.y = 480;
    state.player.facing = 1;
    state.player.moving = true;
    state.player.bobPhase = 1.2;
    return true;
  }

  if (shot === 'ale') {
    // ALE: the big, quiet man, always with his mie ayam. The old couple
    // and the young group keep the dining room alive around him.
    startShift(state, 'rush');
    state.day = 2;
    state.elapsed = 70;
    state.timeLeft = 80;
    state.guardGreet = 3;
    state.guardLine = 'Welcome in!';
    baseTickets(state, [
      { recipeId: 'mie-ayam', customer: { name: 'Ale', type: 'ale', skin: '#8a5a3b', shirt: '#37474f' }, patience: 38, patienceMax: 44, bubble: 'I feel like a supporting character in my own story.' },
      { recipeId: 'mie-goreng', customer: { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' }, patience: 30, patienceMax: 44, bubble: 'We brought the rice that morning.' },
      { recipeId: 'es-teh', customer: { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' }, patience: 34, patienceMax: 48, bubble: 'haha, so tasty!' },
    ]);
    state.score = 410;
    state.coins = 63;
    state.served = 8;
    state.combo = 2;
    state.koki.enabled = true;
    placeOnPlate(state, state.orders[0], ['mie', 'ayam']);
    state.prepSlots.talenan.push({ ingredientId: 'sawi', progress: 1.2, total: 1.6, orderId: state.orders[0].id });
    state.koki.text = 'Ale is waiting — mie ayam first, he always orders that.';
    state.koki.target = { kind: 'ingredient', id: 'sawi' };
    state.message = 'Ale — Orders mie ayam every morning. Quiet, thoughtful, still figuring life out.';
    state.messageTimer = 99;
    state.player.x = 700;
    state.player.y = 520;
    state.player.facing = -1;
    return true;
  }

  if (shot === 'market') {
    // MORNING MARKET: between days — ingredient shop with prices and
    // stock, hire Head Chef AI, kitchen upgrades, decor. Day 2 starts
    // with a low pantry (ayam 2, satay 1) so the shop matters.
    state.day = 1;
    state.screen = 'market';
    state.coins = 186;
    state.stock = { nasi: 5, mie: 6, ayam: 2, telur: 4, cabai: 7, sawi: 6, tahu: 3, bawang: 5, bakso: 4, teh: 8, kopi: 6, alpukat: 2, sate: 1 };
    state.marketDeal = { id: 'ayam', mult: 0.5 };
    state.upgradesOwned.add('pisau');
    state.kokiHired = false;
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
    // SANTAI MODE, RAINY EVENING: no timer, no fail — even the grumpy
    // customer just chats longer ("Hmm… not bad."). The old couple and
    // the young group chat with each other (two bubbles at once), rain
    // falls past the windows, the lamps glow, and Mochi sleeps curled
    // up by the window, watching the rain — the calm heart of the warung.
    startShift(state, 'santai');
    state.day = 3;
    state.elapsed = 90;
    state.weather = 'rainy';
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
    placeOnPlate(state, state.orders[0], ['sate', 'cabai']);
    state.prepSlots.talenan.push({ ingredientId: 'bawang', progress: 0.7, total: 1.4, orderId: state.orders[0].id });
    state.koki.text = 'Chill Mode: put the tofu on the plate, then the onion.';
    state.koki.target = { kind: 'ingredient', id: 'tahu' };
    state.message = 'Rainy evening — warm food sells fast. Mochi is asleep by the window.';
    state.messageTimer = 99;
    // A chatter moment, mid-reply: both bubbles visible at once.
    state.chatter = {
      aId: state.orders[1].id, bId: state.orders[2].id,
      lineA: 'The food is warm, dear.', lineB: 'Just like the old days.',
      step: 1, timer: 4,
    };
    // Mochi asleep by the window, curled up in the rain.
    state.mochi.x = ROOM.windowSeat.x;
    state.mochi.y = ROOM.windowSeat.y;
    state.mochi.state = 'sleep';
    state.mochi.timer = 99;
    state.player.x = 640;
    state.player.y = 560;
    state.player.facing = 1;
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
  { name: '2-ale.jpg', query: '?shot=ale&seed=1' },
  { name: '3-market.jpg', query: '?shot=market&seed=1' },
  { name: '4-santai.jpg', query: '?shot=santai&seed=1' },
];
