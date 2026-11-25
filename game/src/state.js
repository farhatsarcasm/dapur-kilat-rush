// Dapur Kilat — game state: orders, timer, score, coins, upgrades, modes.
// Modes: "rush" (150-second shift, scored, 3 stars) and "chill" (no timer,
// no fail, patience never runs out). No lives, no energy: a lost order just
// costs the combo, and any shift can be replayed immediately, for free.

import {
  SHIFT_SECONDS, MAX_ORDERS, STAR_THRESHOLDS, DIFFICULTY,
  CUSTOMERS, CUSTOMER_TYPES, GUARD_GREETINGS, UPGRADES, DECOR, recipeAt, recipeById, ingredientById,
} from './config.js';
import { createKoki, updateKoki } from './koki.js';

let orderCounter = 0;

export function createState() {
  return {
    screen: 'title', // title | playing | results | upgrades
    mode: 'rush',
    showTutorial: false,
    day: 1,
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    spawnTimer: 4,
    prepSlots: { wajan: [], talenan: [] },
    readyTray: [],
    selectedOrderId: null,
    activePlate: [],
    plateReady: false,
    upgradesOwned: new Set(),
    decorId: 'kuning',
    chefMood: 'idle', // idle | happy | worried | proud
    chefMoodTimer: 0,
    message: '',
    messageTimer: 0,
    flashOrderId: null,
    flashTimer: 0,
    shiftBest: 0,
    lastTickSecond: -1,
    paused: false,
    muted: false,
    koki: createKoki(),
    results: null,
    // Atmosphere: the guard greets arrivals, customers chat, the cat sleeps.
    guardGreet: 0,
    guardLine: '',
    achievements: new Set(),
    grumpyServed: 0,
  };
}

export function startShift(state, mode) {
  state.mode = mode;
  state.screen = 'playing';
  state.elapsed = 0;
  state.timeLeft = SHIFT_SECONDS;
  state.score = 0;
  state.served = 0;
  state.lost = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.orders = [];
  state.spawnTimer = 3;
  state.prepSlots = { wajan: [], talenan: [] };
  state.readyTray = [];
  state.selectedOrderId = null;
  state.activePlate = [];
  state.plateReady = false;
  state.paused = false;
  state.koki = createKoki();
  state.message = mode === 'santai'
    ? 'Chill Mode — no timer, no fail. Cook at your own pace!'
    : 'Shift started! Serve as fast as you can.';
  state.messageTimer = 3;
  spawnOrder(state);
  spawnOrder(state);
}

export function patienceFor(state) {
  const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
  const base = DIFFICULTY.patienceStart
    + (DIFFICULTY.patienceEnd - DIFFICULTY.patienceStart) * progress;
  return state.upgradesOwned.has('senyum') ? base * 1.25 : base;
}

export function spawnInterval(state) {
  const progress = Math.min(1, state.elapsed / SHIFT_SECONDS);
  return DIFFICULTY.spawnStart + (DIFFICULTY.spawnEnd - DIFFICULTY.spawnStart) * progress;
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return;
  const recipe = recipeAt(state.elapsed);
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const type = CUSTOMER_TYPES[customer.type] || CUSTOMER_TYPES.regular;
  orderCounter += 1;
  state.orders.push({
    id: orderCounter,
    recipeId: recipe.id,
    customer,
    patience: patienceFor(state),
    patienceMax: patienceFor(state),
    patienceRate: type.patienceRate,
    tipRate: type.tipRate,
    bubble: type.lines[Math.floor(Math.random() * type.lines.length)],
    bubbleTimer: 4 + Math.random() * 2,
    placed: [],
  });
  if (!state.selectedOrderId) state.selectedOrderId = orderCounter;
  // Sam the Guard greets every arriving customer at the door.
  state.guardGreet = 3;
  state.guardLine = GUARD_GREETINGS[Math.floor(Math.random() * GUARD_GREETINGS.length)];
}

export function selectedOrder(state) {
  return state.orders.find((order) => order.id === state.selectedOrderId) || state.orders[0] || null;
}

export function prepSpeed(state, station) {
  let speed = 1;
  if (station === 'talenan' && state.upgradesOwned.has('pisau')) speed *= 1.43;
  if (station === 'wajan' && state.upgradesOwned.has('wajan')) speed *= 1.43;
  return speed;
}

export function prepCapacity(state, station) {
  if (station === 'wajan' && state.upgradesOwned.has('kompor')) return 2;
  return 1;
}

// Tap an ingredient: it goes straight onto its station to be chopped or
// cooked. Big tap targets, no dragging anywhere in the game.
export function tapIngredient(state, ingredientId) {
  const order = selectedOrder(state);
  if (!order || state.screen !== 'playing' || state.paused) return 'no-order';
  const recipe = recipeById(order.recipeId);
  if (!recipe.ingredients.includes(ingredientId)) return 'wrong-dish';
  if (order.placed.includes(ingredientId)) return 'already';
  if (state.prepSlots.wajan.some((p) => p.ingredientId === ingredientId)
    || state.prepSlots.talenan.some((p) => p.ingredientId === ingredientId)
    || state.readyTray.includes(ingredientId)) return 'busy';
  const ingredient = ingredientById(ingredientId);
  const slots = state.prepSlots[ingredient.station];
  if (slots.length >= prepCapacity(state, ingredient.station)) return 'station-busy';
  slots.push({ ingredientId, progress: 0, total: ingredient.prepSeconds });
  return 'started';
}

export function tapReadyIngredient(state, ingredientId) {
  const order = selectedOrder(state);
  if (!order || state.screen !== 'playing' || state.paused) return 'no-order';
  if (!state.readyTray.includes(ingredientId)) return 'not-ready';
  const recipe = recipeById(order.recipeId);
  if (!recipe.ingredients.includes(ingredientId)) return 'wrong-dish';
  if (order.placed.includes(ingredientId)) return 'already';
  state.readyTray = state.readyTray.filter((id) => id !== ingredientId);
  order.placed.push(ingredientId);
  state.activePlate = [...order.placed];
  state.plateReady = order.placed.length === recipe.ingredients.length;
  return state.plateReady ? 'plate-ready' : 'placed';
}

export function serveOrder(state) {
  const order = selectedOrder(state);
  if (!order || !state.plateReady) return null;
  const recipe = recipeById(order.recipeId);
  const patienceRatio = order.patience / order.patienceMax;
  const patienceBonus = Math.round(10 * patienceRatio);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboBonus = (state.combo - 1) * 4;
  // Tips depend on who the customer is: the young group and the old couple
  // tip generously; the grumpy customer tips little even when served.
  const baseCoins = recipe.price + Math.min(6, state.combo);
  const coins = Math.max(1, Math.round(baseCoins * (order.tipRate || 1)));
  let points = recipe.price + patienceBonus + comboBonus;
  let extra = '';
  // Serving a grumpy customer correctly and on time is rare — it pays more
  // and earns the "Grumpy Customer Pleased!" achievement.
  if (order.customer.type === 'grumpy' && patienceRatio > 0.5) {
    points += 8;
    state.grumpyServed += 1;
    state.achievements.add('Grumpy Customer Pleased!');
    extra = ' — Grumpy Customer Pleased! +8';
  }
  state.score += points;
  state.coins += coins;
  state.served += 1;
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.selectedOrderId = state.orders[0] ? state.orders[0].id : null;
  state.activePlate = [];
  state.plateReady = false;
  state.chefMood = 'happy';
  state.chefMoodTimer = 2;
  state.message = `Served! +${points} pts, +${coins} coins${state.combo > 1 ? `, combo x${state.combo}` : ''}${extra}`;
  state.messageTimer = 2.5;
  return { points, coins, recipeName: recipe.name };
}

export function loseOrder(state, order) {
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.lost += 1;
  state.combo = 0;
  if (state.selectedOrderId === order.id) {
    state.selectedOrderId = state.orders[0] ? state.orders[0].id : null;
  }
  state.activePlate = [];
  state.plateReady = false;
  state.chefMood = 'worried';
  state.chefMoodTimer = 2;
  state.message = order.customer.type === 'grumpy'
    ? `${order.customer.name} left grumbling… "So slow!" No lives — try again!`
    : `${order.customer.name} left — the order is lost. No lives — try again!`;
  state.messageTimer = 2.5;
}

export function starsFor(score) {
  if (score >= STAR_THRESHOLDS[2]) return 3;
  if (score >= STAR_THRESHOLDS[1]) return 2;
  if (score >= STAR_THRESHOLDS[0]) return 1;
  return 0;
}

export function endShift(state) {
  state.screen = 'results';
  const stars = state.mode === 'rush' ? starsFor(state.score) : 3;
  state.results = {
    score: state.score,
    coins: state.coins,
    served: state.served,
    lost: state.lost,
    bestCombo: state.bestCombo,
    stars,
  };
  state.shiftBest = Math.max(state.shiftBest, state.score);
  state.chefMood = stars >= 2 ? 'proud' : 'idle';
}

export function buyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade || state.upgradesOwned.has(upgradeId)) return false;
  if (state.coins < upgrade.cost) return false;
  state.coins -= upgrade.cost;
  state.upgradesOwned.add(upgradeId);
  return true;
}

export function setDecor(state, decorId) {
  if (DECOR.some((item) => item.id === decorId)) state.decorId = decorId;
}

export function update(state, deltaSeconds) {
  if (state.screen !== 'playing' || state.paused) return;
  state.elapsed += deltaSeconds;
  if (state.mode === 'rush') {
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    const whole = Math.ceil(state.timeLeft);
    if (whole !== state.lastTickSecond) {
      state.lastTickSecond = whole;
      if (whole <= 10 && whole > 0) state.tickNow = true;
    }
    if (state.timeLeft <= 0) { endShift(state); return; }
  }
  if (state.messageTimer > 0) state.messageTimer -= deltaSeconds;
  if (state.chefMoodTimer > 0) {
    state.chefMoodTimer -= deltaSeconds;
    if (state.chefMoodTimer <= 0) state.chefMood = 'idle';
  }
  if (state.flashTimer > 0) state.flashTimer -= deltaSeconds;

  // Prep stations tick.
  for (const station of ['wajan', 'talenan']) {
    const slots = state.prepSlots[station];
    for (let i = slots.length - 1; i >= 0; i--) {
      const job = slots[i];
      job.progress += deltaSeconds * prepSpeed(state, station);
      if (job.progress >= job.total) {
        slots.splice(i, 1);
        state.readyTray.push(job.ingredientId);
        state.justReady = job.ingredientId;
      }
    }
  }

  // Patience only runs out in Rush. In Chill the bar stays full and
  // customers just chat longer. Patience drains at each character's own
  // speed: the grumpy customer fast, the old couple slow and unhurried.
  if (state.mode === 'rush') {
    for (const order of [...state.orders]) {
      order.patience -= deltaSeconds * (order.patienceRate || 1);
      if (order.patience <= 0) loseOrder(state, order);
    }
  }

  // Customers chat with each other: every few seconds a neighbour gets a
  // fresh line, so the dining room feels alive.
  for (const order of state.orders) {
    order.bubbleTimer -= deltaSeconds;
    if (order.bubbleTimer <= 0) {
      const type = CUSTOMER_TYPES[order.customer.type] || CUSTOMER_TYPES.regular;
      order.bubble = type.lines[Math.floor(Math.random() * type.lines.length)];
      order.bubbleTimer = 4 + Math.random() * 3;
    }
  }
  if (state.guardGreet > 0) state.guardGreet -= deltaSeconds;

  state.spawnTimer -= deltaSeconds;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = spawnInterval(state);
  }

  // Head Chef AI re-reads the tickets every frame and updates its suggestion.
  updateKoki(state);
}
