// The Last Wok — game state: orders, timer, score, coins, upgrades, modes.
// Modes: "rush" (150-second shift, scored, 3 stars) and "chill" (no timer,
// no fail, patience never runs out). No lives, no energy: a lost order just
// costs the combo, and any shift can be replayed immediately, for free.
// Management layer (v4): the Morning Market sells ingredients for coins,
// stock runs out, Head Chef AI can be hired for a day to auto-cook, and
// every shift is one day at the warung — open until 2 AM.

import {
  SHIFT_SECONDS, MAX_ORDERS, STAR_THRESHOLDS, DIFFICULTY, START_STOCK, HIRE_COST,
  INGREDIENTS, CANVAS_W, DAY_PHASES, DAY_START_HOUR, DAY_HOURS, WEATHERS,
  ROOM, PLAYER_SPEED, CUSTOMER_WALK_SPEED, INTERACT_RANGE, CHATTER_REPLIES,
  CUSTOMERS, CUSTOMER_TYPES, GUARD_GREETINGS, GUARD_BIO, GUARD_LINES, RANI_SERVE_LINES, NEWS_HEADLINES, UPGRADES, DECOR, recipeAt, recipeById, ingredientById,
} from './config.js';
import { createKoki, updateKoki } from './koki.js';

let orderCounter = 0;

export function freshStock() {
  return Object.fromEntries(INGREDIENTS.map((item) => [item.id, START_STOCK]));
}

export function createState() {
  return {
    screen: 'intro', // intro (one name-story panel) | title | playing | results | upgrades
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
    prepSlots: { wajan: [], talenan: [], grill: [] },
    selectedOrderId: null,
    activePlate: [],
    plateReady: false,
    upgradesOwned: new Set(),
    decorId: 'kuning',
    // Walkable warung: Bu Rani walks the room (WASD / arrows / tap).
    // tx/ty is the tap-to-move target; pendingInteract fires on arrival.
    player: {
      x: ROOM.playerSpawn.x, y: ROOM.playerSpawn.y,
      tx: null, ty: null, facing: 1, moving: false, bobPhase: 0,
      pendingInteract: null,
    },
    keys: { up: false, down: false, left: false, right: false },
    // Mochi the cat: alive, not a statue. He wanders slowly, stretches,
    // sits in sun patches, follows Rani a little, and curls up to sleep.
    // On rainy days his favourite spot is the window seat, watching the
    // rain — the calm heart of the warung.
    mochi: {
      x: ROOM.windowSeat.x, y: ROOM.windowSeat.y,
      tx: null, ty: null, state: 'sit', // sit | walk | sleep | follow
      timer: 4, facing: -1, tailPhase: 0, bobPhase: 0,
      heartTimer: 0, // a pink heart floats above him when petted or tipped
    },
    // Ambient chatter: two seated customers talk to each other, one
    // bubble, then the reply. Never blocks cooking; pauses while the
    // player is talking to a customer.
    chatter: null, // { aId, bId, lineA, lineB, step, timer }
    chatterTimer: 6,
    lastChatterKey: null, // last exchange, so chatter never repeats twice in a row
    lastGuardLine: '',
    lastRaniLine: '',
    surpriseTimer: 0, // faces go wide-eyed for a moment when an event hits
    kokiPraise: { text: '', timer: 0 }, // Chef AI cheers when a dish is served
    // Morning Market: ingredient stock (runs out — restock between days)
    // and the hired Head Chef AI (one day only, auto-cooks one station).
    stock: freshStock(),
    kokiHired: false,
    hiredTimer: 0,
    // Walk-in animation: customers leaving the table keep walking out.
    departing: [],
    particles: [],
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
    // Sam patrols a small loop beside the door (never in the doorway).
    guardX: ROOM.guardSpot.x,
    guardY: ROOM.guardSpot.y,
    guardPatrolIdx: 0,
    guardLineIdx: 0,
    // The Grumpys' quiet moment: once per seated child, Mr Grumpy
    // softens and speaks to his wife. The id stops it repeating.
    grumpyMomentId: null,
    // The wall-mounted TV: headline index, ticker scroll, rotation timer.
    tvHeadline: 0,
    tvOffset: 0,
    tvTimer: 10,
    achievements: new Set(),
    grumpyServed: 0,
    // Living world: weather + market deal are picked fresh every morning;
    // the day's two random events (food critic, sudden rush) fire once.
    weather: 'sunny',
    marketDeal: null, // { id, mult } — one ingredient half or double price today
    criticAt: 0,
    rushAt: 0,
    criticDone: false,
    rushDone: false,
  };
}

// How far through the day the warung is, 0..1. Rush follows the shift
// timer; Chill loops the day so the warung never sleeps.
export function dayFrac(state) {
  if (state.mode === 'santai') return (state.elapsed % SHIFT_SECONDS) / SHIFT_SECONDS;
  return Math.min(1, state.elapsed / SHIFT_SECONDS);
}

// The day clock: 07:00 to 02:00 across the shift, plus the phase name.
export function dayClock(state) {
  const frac = dayFrac(state);
  const totalMinutes = DAY_START_HOUR * 60 + Math.round(frac * DAY_HOURS * 60);
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const phase = DAY_PHASES.find((p) => frac < p.until) || DAY_PHASES[DAY_PHASES.length - 1];
  return { hour, minute, phase, frac, text: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

function pickWeather(state) {
  const r = Math.random();
  state.weather = r < 0.5 ? 'sunny' : r < 0.8 ? 'cloudy' : 'rainy';
}

function pickMarketDeal(state) {
  const item = INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)];
  state.marketDeal = { id: item.id, mult: Math.random() < 0.5 ? 0.5 : 2 };
}

// The price of an ingredient today — the market deal makes one item
// half price or double price, shown clearly in the Morning Market.
export function marketPrice(state, ingredientId) {
  const ingredient = ingredientById(ingredientId);
  if (!ingredient) return 0;
  if (state.marketDeal && state.marketDeal.id === ingredientId) {
    return Math.max(1, Math.round(ingredient.price * state.marketDeal.mult));
  }
  return ingredient.price;
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
  state.prepSlots = { wajan: [], talenan: [], grill: [] };
  state.selectedOrderId = null;
  state.activePlate = [];
  state.plateReady = false;
  state.paused = false;
  state.koki = createKoki();
  state.departing = [];
  state.particles = [];
  state.hiredTimer = 0;
  // Bu Rani starts at the bottom of the room, ready to walk.
  state.player.x = ROOM.playerSpawn.x;
  state.player.y = ROOM.playerSpawn.y;
  state.player.tx = null;
  state.player.ty = null;
  state.player.pendingInteract = null;
  state.keys = { up: false, down: false, left: false, right: false };
  // Mochi starts at his window seat, sitting in the sun.
  state.mochi.x = ROOM.windowSeat.x;
  state.mochi.y = ROOM.windowSeat.y;
  state.mochi.state = 'sit';
  state.mochi.timer = 4;
  state.mochi.tx = null;
  state.mochi.ty = null;
  // A fresh morning: new weather, a new market deal, and the day's two
  // random events scheduled once each (critic mid-morning, rush later).
  pickWeather(state);
  pickMarketDeal(state);
  state.criticAt = 35 + Math.random() * 55;
  state.rushAt = 60 + Math.random() * 60;
  state.criticDone = false;
  state.rushDone = false;
  const weather = WEATHERS[state.weather];
  state.message = mode === 'santai'
    ? `Chill Mode — Day ${state.day}, ${state.weather} — ${weather.line} No timer, no fail. Cook at your own pace!`
    : `Day ${state.day} — ${state.weather}, ${weather.line} Open until 2 AM.`;
  state.messageTimer = 3.5;
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
  const base = DIFFICULTY.spawnStart + (DIFFICULTY.spawnEnd - DIFFICULTY.spawnStart) * progress;
  // Rain brings people in from the street — orders arrive a little faster.
  return state.weather === 'rainy' ? base * WEATHERS.rainy.spawnMult : base;
}

// The first free table — each order sits at its own table (3 tables,
// 3 orders max). A served or lost order frees its table at once.
export function freeTable(state) {
  for (const table of ROOM.tables) {
    if (!state.orders.some((o) => o.tableId === table.id)) return table;
  }
  return null;
}

export function spawnOrder(state, opts = {}) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const table = freeTable(state);
  if (!table) return null;
  const customer = opts.customer || CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  // Ale always orders mie ayam — it is his morning bowl, every morning.
  const recipe = customer.type === 'ale' ? recipeById('mie-ayam') : recipeAt(state.elapsed);
  const type = CUSTOMER_TYPES[customer.type] || CUSTOMER_TYPES.regular;
  // A customer can carry their own lines (Mr Grumpy grumbles, Mrs
  // Grumpy soothes) — otherwise the type's lines.
  const lines = customer.lines || type.lines;
  orderCounter += 1;
  const order = {
    id: orderCounter,
    recipeId: recipe.id,
    customer,
    tableId: table.id,
    seatX: table.seat.x,
    seatY: table.seat.y,
    taken: false, // Rani walks to the table and presses E to take the order
    talkText: '',
    talkTimer: 0,
    patience: patienceFor(state),
    patienceMax: patienceFor(state),
    patienceRate: type.patienceRate,
    tipRate: type.tipRate,
    // The Food Critic is picky (less patience) but pays a big tip when
    // served perfectly — her ticket carries a gold star.
    critic: !!opts.critic,
    lines,
    lastBubble: '',
    lastReply: '',
    // A new arrival greets the room — a greeting line, not a waiting line.
    bubble: pickLine(customer.greet || type.greet || lines, ''),
    bubbleTimer: 4 + Math.random() * 2,
    placed: [],
    plateReady: false,
    // Walk-in: from the door, down the door lane, along the corridor,
    // then down to the table. The walk never blocks cooking — Rani can
    // always walk and cook while a customer arrives.
    walkX: ROOM.doorSpawn.x,
    walkY: ROOM.doorSpawn.y,
    walkState: 'entering', // entering | seated | eating | leaving | leavingAngry
    walkPhase: 0,
    waypoints: [
      { x: ROOM.doorSpawn.x, y: ROOM.corridorY },
      { x: table.seat.x, y: ROOM.corridorY },
      { x: table.seat.x, y: table.seat.y },
    ],
    waypointIndex: 0,
    seatedPop: 0,
    eatTimer: 0,
  };
  order.lastBubble = order.bubble;
  state.orders.push(order);
  // Sam the Guard greets every arriving customer at the door.
  state.guardGreet = 3;
  state.guardLine = pickLine(GUARD_GREETINGS, state.lastGuardLine);
  state.lastGuardLine = state.guardLine;
  if (order.critic) {
    // Picky critic: less patience, but a big tip when served perfectly.
    order.patienceMax = Math.round(patienceFor(state) * 0.7);
    order.patience = order.patienceMax;
    order.tipRate = (order.tipRate || 1) * 2;
  }
  return order;
}

// Move a walking order one step along its waypoints. Returns true when
// the last waypoint is reached.
function stepWaypoints(order, deltaSeconds, speed) {
  const target = order.waypoints[order.waypointIndex];
  if (!target) return true;
  const dx = target.x - order.walkX;
  const dy = target.y - order.walkY;
  const dist = Math.hypot(dx, dy);
  const step = speed * deltaSeconds;
  order.walkPhase += deltaSeconds;
  if (dist <= step) {
    order.walkX = target.x;
    order.walkY = target.y;
    order.waypointIndex += 1;
    return order.waypointIndex >= order.waypoints.length;
  }
  order.walkX += (dx / dist) * step;
  order.walkY += (dy / dist) * step;
  return false;
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

// Walk up to a station and press E: cook the next missing ingredient of
// the active (taken) order that belongs to this station. Cooking spends
// 1 unit of stock — an empty pantry cannot cook until the Morning
// Market restocks it. Finished ingredients go straight onto the plate.
export function cookAtStation(state, stationId) {
  const order = selectedOrder(state);
  if (!order || !order.taken || state.screen !== 'playing' || state.paused) return 'no-order';
  const recipe = recipeById(order.recipeId);
  const busy = (id) => state.prepSlots.wajan.some((p) => p.ingredientId === id)
    || state.prepSlots.talenan.some((p) => p.ingredientId === id)
    || state.prepSlots.grill.some((p) => p.ingredientId === id)
    || order.placed.includes(id);
  const next = recipe.ingredients.find((id) => !busy(id) && ingredientById(id).station === stationId);
  if (!next) {
    const missingOther = recipe.ingredients.some((id) => !busy(id));
    return missingOther ? 'wrong-station' : 'done';
  }
  if ((state.stock[next] || 0) <= 0) return 'no-stock';
  if (!startPrep(state, next, order.id)) return 'station-busy';
  state.stock[next] -= 1;
  return 'started';
}

// Start one ingredient prepping on its station, for a specific order.
// Shared by the player's cooking and by the hired Head Chef AI auto-cook.
export function startPrep(state, ingredientId, orderId = null) {
  const ingredient = ingredientById(ingredientId);
  if (!ingredient) return false;
  const slots = state.prepSlots[ingredient.station];
  if (!slots || slots.length >= prepCapacity(state, ingredient.station)) return false;
  slots.push({ ingredientId, progress: 0, total: ingredient.prepSeconds, orderId });
  return true;
}

function spawnCoinBurst(state, x, y) {
  for (let i = 0; i < 6; i++) {
    state.particles.push({
      x: x + (Math.random() * 60 - 30), y,
      vx: Math.random() * 40 - 20, vy: 60 + Math.random() * 50,
      life: 0.9, maxLife: 0.9,
    });
  }
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
  // The Food Critic, served perfectly: a big tip (her tip rate is already
  // doubled) plus a gold-star review.
  if (order.critic && patienceRatio > 0.5) {
    points += 15;
    state.achievements.add('Food Critic Impressed!');
    extra = ' — Food Critic Impressed! +15';
  }
  // Ale's hopeful arc: served well and on time, the quiet man smiles for
  // the first time and says he will come back tomorrow. A small bowl can
  // be a reason to stay.
  if (order.customer.type === 'ale' && patienceRatio > 0.5) {
    points += 8;
    state.achievements.add('Ale Smiled Today!');
    extra = ' — Ale smiled! "See you tomorrow." +8';
  }
  state.score += points;
  state.coins += coins;
  state.served += 1;
  // Chef AI cheers a good serve — his bubble pops above him in the
  // kitchen. A big tip makes Mochi happy too (a heart floats above him).
  // Chef AI never repeats a praise twice in a row.
  const praises = ['Nice one!', 'Beautiful serve!', 'That was fast — well done!', 'The customers love it!', 'The wok is proud of you!', 'Perfect timing, Rani!', 'That plate sings!', 'Even the grumpy one would smile at that!'];
  state.kokiPraise = { text: pickLine(praises, state.kokiPraise.text), timer: 2.5 };
  if (coins >= 25) state.mochi.heartTimer = 3;
  // Eat & leave: the customer stays at the table for a happy eating
  // beat (coins fly up), then stands and walks back to the door.
  order.walkX = order.seatX;
  order.walkY = order.seatY;
  order.walkState = 'eating';
  order.eatTimer = 1.1;
  // Nara's joy: served well, the little one holds her spoon up high.
  if (order.customer.type === 'family' && patienceRatio > 0.5) {
    order.talkText = 'This is yummy!';
    order.talkTimer = 2;
  }
  order.waypoints = [
    { x: order.seatX, y: ROOM.corridorY },
    { x: ROOM.doorSpawn.x, y: ROOM.corridorY },
    { x: ROOM.doorSpawn.x, y: ROOM.doorSpawn.y - 30 },
  ];
  order.waypointIndex = 0;
  spawnCoinBurst(state, order.seatX, order.seatY - 30);
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.departing.push(order);
  state.selectedOrderId = state.orders[0] ? state.orders[0].id : null;
  state.activePlate = [];
  state.plateReady = false;
  state.chefMood = 'happy';
  state.chefMoodTimer = 2;
  // Bu Rani smiles when a customer is happy — her line rides along with
  // the serve message, so the player hears her voice, not just a score.
  const raniLine = pickLine(RANI_SERVE_LINES, state.lastRaniLine);
  state.lastRaniLine = raniLine;
  state.message = `Served! +${points} pts, +${coins} coins${state.combo > 1 ? `, combo x${state.combo}` : ''}${extra} — "${raniLine}"`;
  state.messageTimer = 2.5;
  return { points, coins, recipeName: recipe.name };
}

export function loseOrder(state, order) {
  // Stood up annoyed and walks out: the customer leaves the table at
  // once, angry, and walks back to the door.
  order.walkX = order.seatX;
  order.walkY = order.seatY;
  order.walkState = 'leavingAngry';
  order.waypoints = [
    { x: order.seatX, y: ROOM.corridorY },
    { x: ROOM.doorSpawn.x, y: ROOM.corridorY },
    { x: ROOM.doorSpawn.x, y: ROOM.doorSpawn.y - 30 },
  ];
  order.waypointIndex = 0;
  state.orders = state.orders.filter((item) => item.id !== order.id);
  state.departing.push(order);
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
  // The hire lasts one day only; the dining room clears for the night.
  state.kokiHired = false;
  state.departing = [];
  state.particles = [];
}

// Morning Market: buy ingredients with coins. Stock carries over.
// Today's market deal makes one ingredient half price or double price.
export function buyIngredient(state, ingredientId, qty) {
  const ingredient = ingredientById(ingredientId);
  if (!ingredient || qty <= 0) return false;
  const cost = marketPrice(state, ingredientId) * qty;
  if (state.coins < cost) return false;
  state.coins -= cost;
  state.stock[ingredientId] = (state.stock[ingredientId] || 0) + qty;
  return true;
}

// Hire Head Chef AI for the next day: he auto-cooks one station while
// you play. The free hints stay free — hiring only adds the auto-help.
export function hireKoki(state) {
  if (state.kokiHired || state.coins < HIRE_COST) return false;
  state.coins -= HIRE_COST;
  state.kokiHired = true;
  return true;
}

export function startNextDay(state) {
  state.day += 1;
  // The neighbours drop off a few ingredients every morning — so a bad
  // day can never leave the pantry completely empty with no coins.
  // The loop always restarts: no way to get stuck with nothing to cook.
  for (const item of INGREDIENTS) {
    state.stock[item.id] = Math.max(state.stock[item.id] || 0, 2);
  }
  startShift(state, state.mode);
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

  // Prep stations tick. A finished ingredient goes straight onto the
  // plate of the order it was cooked for — no tray to tap, Rani just
  // keeps walking and cooking.
  for (const station of ['wajan', 'talenan', 'grill']) {
    const slots = state.prepSlots[station];
    for (let i = slots.length - 1; i >= 0; i--) {
      const job = slots[i];
      job.progress += deltaSeconds * prepSpeed(state, station);
      if (job.progress >= job.total) {
        slots.splice(i, 1);
        const order = state.orders.find((o) => o.id === job.orderId);
        if (order && !order.placed.includes(job.ingredientId)) {
          order.placed.push(job.ingredientId);
          // The plate is ready when every ingredient is on it — tracked
          // on the order itself (serve + READY tag read it) and on the
          // selected order's state flag.
          order.plateReady = order.placed.length === recipeById(order.recipeId).ingredients.length;
          if (order.id === state.selectedOrderId) {
            state.activePlate = [...order.placed];
            state.plateReady = order.plateReady;
          }
          state.justReady = job.ingredientId;
        }
      }
    }
  }

  // Patience only runs out in Rush. In Chill the bar stays full and
  // customers just chat longer. Patience drains at each character's own
  // speed: the grumpy customer fast, the old couple slow and unhurried.
  // But when a child (Nara) is seated, Mr Grumpy softens — his patience
  // drains much slower and even refills a little. That is what he and
  // his wife always wanted most: a child of their own.
  const childSeated = state.orders.some((o) => o.walkState === 'seated' && o.customer.type === 'family');
  if (state.mode === 'rush') {
    for (const order of [...state.orders]) {
      if (order.customer.type === 'grumpy' && childSeated) {
        order.patience -= deltaSeconds * (order.patienceRate || 1) * 0.4;
        order.patience = Math.min(order.patienceMax, order.patience + deltaSeconds * 0.5);
      } else {
        order.patience -= deltaSeconds * (order.patienceRate || 1);
      }
      if (order.patience <= 0) loseOrder(state, order);
    }
  }

  // Customers chat with each other: every few seconds a neighbour gets a
  // fresh line, so the dining room feels alive.
  for (const order of state.orders) {
    order.bubbleTimer -= deltaSeconds;
    if (order.bubbleTimer <= 0) {
      order.bubble = bubbleLineFor(order, state);
      order.bubbleTimer = 4 + Math.random() * 3;
    }
  }
  if (state.guardGreet > 0) state.guardGreet -= deltaSeconds;

  // Bu Rani walks the room; Mochi lives his own small life; Sam patrols
  // his little loop beside the door.
  updatePlayer(state, deltaSeconds);
  updateMochi(state, deltaSeconds);
  updateGuard(state, deltaSeconds);

  // Walk-in: customers walk from the door, along the corridor, then
  // down to their table, with a 2-step bob. The walk never blocks
  // cooking — Rani can always walk and cook while a customer arrives.
  for (const order of state.orders) {
    if (order.walkState === 'entering') {
      if (stepWaypoints(order, deltaSeconds, CUSTOMER_WALK_SPEED)) {
        order.walkState = 'seated';
        order.seatedPop = 0.9;
      }
    } else if (order.walkState === 'seated') {
      order.walkX = order.seatX;
      order.walkY = order.seatY;
    }
    if (order.seatedPop > 0) order.seatedPop -= deltaSeconds;
    if (order.talkTimer > 0) order.talkTimer -= deltaSeconds;
  }

  // Eat & leave: a served customer eats happily, coins fly, then
  // stands and walks back to the door. An annoyed customer walks out.
  for (let i = state.departing.length - 1; i >= 0; i--) {
    const gone = state.departing[i];
    if (gone.talkTimer > 0) gone.talkTimer -= deltaSeconds;
    if (gone.walkState === 'eating') {
      gone.eatTimer -= deltaSeconds;
      if (gone.eatTimer <= 0) gone.walkState = 'leaving';
    } else {
      const speed = gone.walkState === 'leavingAngry' ? 300 : 220;
      if (stepWaypoints(gone, deltaSeconds, speed)) state.departing.splice(i, 1);
    }
  }

  // Coin particles from a served dish.
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * deltaSeconds;
    p.y -= p.vy * deltaSeconds;
    p.life -= deltaSeconds;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  // Hired Head Chef AI: every few seconds he auto-cooks the most
  // urgent missing ingredient (if its station is free and stock lasts).
  if (state.kokiHired) {
    state.hiredTimer += deltaSeconds;
    if (state.hiredTimer >= 2.5) {
      state.hiredTimer = 0;
      const urgent = state.orders.reduce((best, item) => {
        if (!best) return item;
        return (item.patience / item.patienceMax) < (best.patience / best.patienceMax) ? item : best;
      }, null);
      if (urgent) {
        const recipe = recipeById(urgent.recipeId);
        const next = recipe.ingredients.find((id) => !urgent.placed.includes(id)
          && !state.prepSlots.wajan.some((p) => p.ingredientId === id)
          && !state.prepSlots.talenan.some((p) => p.ingredientId === id)
          && !state.prepSlots.grill.some((p) => p.ingredientId === id)
          && (state.stock[id] || 0) > 0);
        if (next && startPrep(state, next, urgent.id)) {
          state.stock[next] -= 1;
          state.message = `Head Chef AI cooked ${ingredientById(next).name} for you!`;
          state.messageTimer = 2;
        }
      }
    }
  }

  state.spawnTimer -= deltaSeconds;
  if (state.spawnTimer <= 0) {
    spawnOrder(state);
    state.spawnTimer = spawnInterval(state);
  }

  // Random events, once per day each. They announce themselves in the
  // message bar — the warung stays alive and never monotonous.
  if (!state.criticDone && state.elapsed >= state.criticAt) {
    const criticCustomer = CUSTOMERS.find((c) => c.name === 'Miss Sari') || CUSTOMERS[0];
    const critic = spawnOrder(state, { customer: criticCustomer, critic: true });
    if (critic) {
      state.criticDone = true;
      state.surpriseTimer = 2; // every face in the room goes wide-eyed
      state.message = 'Food Critic is here! Serve her perfectly for a big tip.';
      state.messageTimer = 4;
    } else {
      state.criticAt += 5; // tables full — she waits a little
    }
  }
  if (!state.rushDone && state.elapsed >= state.rushAt) {
    const before = state.orders.length;
    spawnOrder(state);
    spawnOrder(state);
    if (state.orders.length > before) {
      state.rushDone = true;
      state.surpriseTimer = 2; // every face in the room goes wide-eyed
      state.message = state.weather === 'rainy'
        ? 'Rain drove everyone inside — sudden rush! Two more tables!'
        : 'Sudden rush! Two more tables just sat down!';
      state.messageTimer = 4;
    } else {
      state.rushAt += 5; // tables full — the rush waits a little
    }
  }

  // Ambient chatter: every few seconds two seated customers talk to
  // each other — one bubble, then the reply. It pauses while the
  // player is talking to a customer, and never blocks cooking.
  if (state.surpriseTimer > 0) state.surpriseTimer -= deltaSeconds;
  if (state.kokiPraise.timer > 0) state.kokiPraise.timer -= deltaSeconds;
  if (state.chatter) {
    state.chatter.timer -= deltaSeconds;
    if (state.chatter.timer <= 0) {
      if (state.chatter.step === 0) {
        state.chatter.step = 1;
        state.chatter.timer = 2.2;
      } else {
        state.chatter = null;
        state.chatterTimer = 5 + Math.random() * 5;
      }
    }
  } else {
    state.chatterTimer -= deltaSeconds;
    if (state.chatterTimer <= 0) {
      state.chatterTimer = 5 + Math.random() * 5;
      tryStartChatter(state);
    }
  }

  // The Grumpys' quiet moment: when a child (Nara) is seated and Mr
  // Grumpy is in the room, his face softens — and once per child he
  // says it out loud to his wife. Hopeful, never heavy: one soft line.
  if (!state.chatter && !state.orders.some((o) => o.talkTimer > 0)) {
    const child = state.orders.find((o) => o.walkState === 'seated' && o.customer.type === 'family');
    const mr = state.orders.find((o) => o.walkState === 'seated' && o.customer.name === 'Mr Grumpy');
    if (child && mr && state.grumpyMomentId !== child.id) {
      state.grumpyMomentId = child.id;
      const mrs = state.orders.find((o) => o.walkState === 'seated' && o.customer.name === 'Mrs Grumpy');
      if (mrs) {
        state.chatter = {
          aId: mr.id, bId: mrs.id,
          lineA: 'In another life, maybe we’ll have a child of our own, dear.',
          lineB: 'Maybe, dear. Maybe.',
          step: 0, timer: 2.6,
        };
      } else {
        mr.bubble = 'In another life, maybe we’ll have a child of our own, dear.';
        mr.bubbleTimer = 5;
      }
    }
  }

  // The TV above the order board: the ticker scrolls, the headline
  // rotates every few seconds, and a big story makes someone react —
  // Mr Grumpy grumbles, the old couple sighs, Sam nods. Subtle: one
  // reaction per headline at most, never interrupting cooking.
  state.tvOffset += deltaSeconds * 55;
  state.tvTimer -= deltaSeconds;
  if (state.tvTimer <= 0) {
    state.tvTimer = 10;
    state.tvOffset = 0;
    state.tvHeadline = (state.tvHeadline + 1) % NEWS_HEADLINES.length;
    tvReact(state);
  }

  // Head Chef AI re-reads the tickets every frame and updates its suggestion.
  updateKoki(state);
}

// --- Walkable warung: movement, Mochi, interaction ---

// Collision: the counter, the order board and the tables are solid, and
// so are the walls. Movement slides along them (x then y separately).
function roomBlocked(x, y, half) {
  const floor = ROOM.floor;
  if (x - half < floor.x || x + half > floor.x + floor.w
    || y - half < floor.y || y + half > floor.y + floor.h) return true;
  for (const r of [ROOM.counter, ROOM.board, ...ROOM.tables]) {
    if (x + half > r.x && x - half < r.x + r.w
      && y + half > r.y && y - half < r.y + r.h) return true;
  }
  return false;
}

function tryMove(state, dx, dy, half) {
  const p = state.player;
  let moved = false;
  if (dx !== 0 && !roomBlocked(p.x + dx, p.y, half)) { p.x += dx; moved = true; }
  if (dy !== 0 && !roomBlocked(p.x, p.y + dy, half)) { p.y += dy; moved = true; }
  return moved;
}

export function updatePlayer(state, deltaSeconds) {
  const p = state.player;
  let mdx = 0, mdy = 0;
  if (state.keys.left) mdx -= 1;
  if (state.keys.right) mdx += 1;
  if (state.keys.up) mdy -= 1;
  if (state.keys.down) mdy += 1;
  if (mdx || mdy) {
    // Keys beat tap-to-move: Rani goes where the player steers her.
    p.tx = null; p.ty = null; p.path = null; p.pendingInteract = null;
    const len = Math.hypot(mdx, mdy);
    p.moving = tryMove(state, (mdx / len) * PLAYER_SPEED * deltaSeconds, (mdy / len) * PLAYER_SPEED * deltaSeconds, 14);
    if (mdx !== 0) p.facing = mdx > 0 ? 1 : -1;
  } else if (p.tx != null && p.ty != null) {
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 8) {
      if (p.path && p.path.length) {
        // Next waypoint on the route — the real target is the last one.
        const next = p.path.shift();
        p.tx = next.x; p.ty = next.y;
      } else {
        p.tx = null; p.ty = null; p.moving = false;
        if (p.pendingInteract) {
          const it = p.pendingInteract;
          p.pendingInteract = null;
          doInteract(state, it);
        }
      }
    } else {
      const step = Math.min(dist, PLAYER_SPEED * deltaSeconds);
      p.moving = tryMove(state, (dx / dist) * step, (dy / dist) * step, 14);
      if (!p.moving) {
        // Fully blocked mid-route (should be rare with pathfinding):
        // drop the walk rather than freeze — the player can tap again.
        p.tx = null; p.ty = null; p.path = null; p.pendingInteract = null;
      }
      if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
    }
  } else {
    p.moving = false;
  }
  if (p.moving) p.bobPhase += deltaSeconds * 10;
}

// Tap-to-move pathfinding: Rani must never get wedged against a table.
// A coarse grid BFS routes her around the counter, the order board and
// the tables, so a tap always arrives — even to a table approach
// straight through the table from above. Obstacles are inflated past
// her radius, so the route keeps clearance and the slide never has to
// save her. Waypoints are turning points only; the final target is
// appended by setWalkTarget.
const PATH_CELL = 32;
function pathBlocked(cx, cy) {
  const cols = Math.ceil(CANVAS_W / PATH_CELL);
  const rows = Math.ceil(720 / PATH_CELL);
  if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return true;
  return roomBlocked(cx * PATH_CELL + PATH_CELL / 2, cy * PATH_CELL + PATH_CELL / 2, 22);
}
function nearestOpenCell(cx, cy) {
  for (let r = 0; r <= 4; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!pathBlocked(cx + dx, cy + dy)) return [cx + dx, cy + dy];
      }
    }
  }
  return null;
}
export function findPath(state, tx, ty) {
  const cols = Math.ceil(CANVAS_W / PATH_CELL);
  const sx = Math.floor(state.player.x / PATH_CELL);
  const sy = Math.floor(state.player.y / PATH_CELL);
  const goal = nearestOpenCell(Math.floor(tx / PATH_CELL), Math.floor(ty / PATH_CELL));
  if (!goal) return [];
  const [gx, gy] = goal;
  if (sx === gx && sy === gy) return [];
  const key = (x, y) => y * cols + x;
  const prev = new Map();
  const queue = [[sx, sy]];
  prev.set(key(sx, sy), null);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    if (cx === gx && cy === gy) break;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (pathBlocked(nx, ny) || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), [cx, cy]);
      queue.push([nx, ny]);
    }
  }
  if (!prev.has(key(gx, gy))) return [];
  const cells = [];
  let cur = [gx, gy];
  while (cur) { cells.push(cur); cur = prev.get(key(cur[0], cur[1])); }
  cells.reverse();
  cells.shift(); // the player's own cell
  const pts = cells.map(([cx, cy]) => ({ x: cx * PATH_CELL + PATH_CELL / 2, y: cy * PATH_CELL + PATH_CELL / 2 }));
  const turns = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i - 1] || { x: state.player.x, y: state.player.y };
    const b = pts[i];
    const c = pts[i + 1];
    if (!c || (b.x - a.x) * (c.y - b.y) !== (b.y - a.y) * (c.x - b.x)) turns.push(b);
  }
  return turns;
}

// Set a walk target with a route around the furniture. The pending
// interact fires when Rani reaches the final target.
export function setWalkTarget(state, x, y, pending) {
  const p = state.player;
  p.path = [...findPath(state, x, y), { x, y }];
  const first = p.path.shift();
  p.tx = first.x;
  p.ty = first.y;
  p.pendingInteract = pending || null;
}

// Sam the Guard patrols a small loop beside the door — never in the
// doorway, never in the entrance lane (x1210) or the corridor (y200).
// He walks slowly, waves at arrivals, and the door stays clear.
function updateGuard(state, deltaSeconds) {
  const loop = ROOM.guardPatrol || [ROOM.guardSpot];
  const speed = ROOM.guardPatrolSpeed || 16;
  const target = loop[state.guardPatrolIdx % loop.length];
  const dx = target.x - state.guardX;
  const dy = target.y - state.guardY;
  const dist = Math.hypot(dx, dy);
  const step = speed * deltaSeconds;
  if (dist <= step) {
    state.guardX = target.x;
    state.guardY = target.y;
    state.guardPatrolIdx = (state.guardPatrolIdx + 1) % loop.length;
  } else {
    state.guardX += (dx / dist) * step;
    state.guardY += (dy / dist) * step;
  }
}

function updateMochi(state, deltaSeconds) {
  const mochi = state.mochi;
  mochi.tailPhase += deltaSeconds;
  mochi.timer -= deltaSeconds;
  if (mochi.heartTimer > 0) mochi.heartTimer -= deltaSeconds;
  const rainy = state.weather === 'rainy';
  const seat = ROOM.windowSeat;
  const nearSeat = Math.hypot(mochi.x - seat.x, mochi.y - seat.y) < 24;

  if (mochi.state === 'walk' || mochi.state === 'follow') {
    // Slow walk cycle toward the target, tail up.
    const dx = mochi.tx - mochi.x, dy = mochi.ty - mochi.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 6) {
      mochi.tx = null; mochi.ty = null;
      if (rainy && nearSeat) { mochi.state = 'sleep'; mochi.timer = 10 + Math.random() * 6; }
      else { mochi.state = 'sit'; mochi.timer = 2 + Math.random() * 3; }
      return;
    }
    const step = Math.min(dist, 42 * deltaSeconds);
    const nx = mochi.x + (dx / dist) * step;
    const ny = mochi.y + (dy / dist) * step;
    if (!roomBlocked(nx, ny, 10)) {
      mochi.x = nx; mochi.y = ny; mochi.stuck = 0;
    } else {
      mochi.stuck = (mochi.stuck || 0) + deltaSeconds;
      if (mochi.stuck > 1.5) { mochi.state = 'sit'; mochi.timer = 2; return; }
    }
    mochi.bobPhase += deltaSeconds * 8;
    if (dx !== 0) mochi.facing = dx > 0 ? 1 : -1;
    return;
  }
  if (mochi.timer > 0) return;

  // Pick the next thing to do. Rain always wins: Mochi goes to the
  // window seat to watch the rain, then curls up and sleeps there.
  if (rainy && !nearSeat) {
    mochi.tx = seat.x; mochi.ty = seat.y; mochi.state = 'walk'; mochi.timer = 30;
    return;
  }
  if (rainy && nearSeat) { mochi.state = 'sleep'; mochi.timer = 10 + Math.random() * 8; return; }
  const r = Math.random();
  if (r < 0.3) {
    mochi.state = 'sleep'; mochi.timer = 6 + Math.random() * 5;
  } else if (r < 0.55) {
    // Wander — on sunny days he often heads for the sun patch instead.
    const sunny = state.weather === 'sunny';
    const spot = sunny && Math.random() < 0.6 ? ROOM.sunPatch : randomFloorSpot();
    mochi.tx = spot.x; mochi.ty = spot.y; mochi.state = 'walk'; mochi.timer = 30;
  } else if (r < 0.75 && Math.hypot(state.player.x - mochi.x, state.player.y - mochi.y) < 280) {
    // Follow Rani a little, then sit near her.
    mochi.tx = state.player.x + (Math.random() * 80 - 40);
    mochi.ty = state.player.y + 50 + Math.random() * 20;
    mochi.state = 'follow'; mochi.timer = 30;
  } else {
    mochi.state = 'sit'; mochi.timer = 2 + Math.random() * 4;
  }
}

function randomFloorSpot() {
  for (let i = 0; i < 10; i++) {
    const x = ROOM.floor.x + 40 + Math.random() * (ROOM.floor.w - 80);
    const y = ROOM.floor.y + 40 + Math.random() * (ROOM.floor.h - 80);
    if (!roomBlocked(x, y, 10)) return { x, y };
  }
  return { x: ROOM.playerSpawn.x, y: ROOM.playerSpawn.y };
}

// A big headline breaks on the TV: someone in the room glances up.
// Mr Grumpy grumbles at the news, the old couple sighs, anyone else
// mutters — or, in an empty room, Sam nods thoughtfully. Small "!"
// beat above the customer, then cooking goes on as normal.
function tvReact(state) {
  if (Math.random() > 0.6) return; // not every headline gets a reaction
  const seated = state.orders.filter((o) => o.walkState === 'seated');
  const grumpy = seated.find((o) => o.customer.name === 'Mr Grumpy');
  const couple = seated.find((o) => o.customer.type === 'couple');
  if (grumpy) {
    grumpy.bubble = 'Hmph. Politicians.';
    grumpy.bubbleTimer = 4;
    grumpy.seatedPop = 0.9;
  } else if (couple) {
    couple.bubble = 'Oh, dear…';
    couple.bubbleTimer = 4;
    couple.seatedPop = 0.9;
  } else if (seated.length) {
    const o = seated[Math.floor(Math.random() * seated.length)];
    o.bubble = 'Did you hear that?';
    o.bubbleTimer = 4;
    o.seatedPop = 0.9;
  } else {
    state.guardLine = 'Hmm. Big news today.';
    state.guardGreet = 3;
  }
}

// Dialogue pools: pick a line, never the same one twice in a row.
// bubbleLineFor picks by context — a grumpy customer softens when a
// child is seated, anyone gets impatient when patience runs low, and
// rainy days and evenings change the small talk.
function pickLine(lines, last) {
  if (!lines || !lines.length) return '';
  let line = lines[Math.floor(Math.random() * lines.length)];
  if (lines.length > 1) {
    let guard = 0;
    while (line === last && guard++ < 8) line = lines[Math.floor(Math.random() * lines.length)];
  }
  return line;
}
function linePoolFor(order, context) {
  const customer = order.customer;
  const type = CUSTOMER_TYPES[customer.type] || CUSTOMER_TYPES.regular;
  if (context) return customer[context] || type[context] || customer.lines || type.lines;
  return customer.lines || type.lines;
}
function bubbleLineFor(order, state) {
  const ratio = order.patience / order.patienceMax;
  let pool;
  if (order.customer.type === 'grumpy' && state.orders.some((o) => o.walkState === 'seated' && o.customer.type === 'family')) {
    pool = linePoolFor(order, 'soft');
  } else if (ratio < 0.3) {
    pool = linePoolFor(order, 'impatient');
  } else if (state.weather === 'rainy') {
    pool = linePoolFor(order, 'rainy');
  } else {
    const phase = dayClock(state).phase.id;
    pool = (phase === 'evening' || phase === 'night') ? linePoolFor(order, 'evening') : linePoolFor(order, null);
  }
  const line = pickLine(pool, order.lastBubble);
  order.lastBubble = line;
  return line;
}

// Pick two seated customers and let them talk: the first speaks a line
// from their own type, the second answers from their reply pool.
function tryStartChatter(state) {
  const seated = state.orders.filter((o) => o.walkState === 'seated');
  if (seated.length < 2) return;
  if (state.orders.some((o) => o.talkTimer > 0)) return; // player is talking
  const a = seated[Math.floor(Math.random() * seated.length)];
  let b = seated[Math.floor(Math.random() * seated.length)];
  if (b.id === a.id) b = seated[(seated.indexOf(a) + 1) % seated.length];
  // Never the same exchange twice in a row: re-pick lines if this pair
  // would repeat the last exchange exactly.
  let lineA, lineB, key, tries = 0;
  do {
    lineA = bubbleLineFor(a, state);
    const replies = CHATTER_REPLIES[b.customer.type] || CHATTER_REPLIES.regular;
    lineB = pickLine(replies, b.lastReply);
    b.lastReply = lineB;
    key = `${a.id}|${b.id}|${lineA}|${lineB}`;
    tries++;
  } while (key === state.lastChatterKey && tries < 4);
  state.lastChatterKey = key;
  state.chatter = { aId: a.id, bId: b.id, lineA, lineB, step: 0, timer: 2.2 };
}

// What can Rani interact with right now, and what would E do?
export function nearestInteractable(state) {
  const p = state.player;
  const candidates = [];
  for (const station of Object.values(ROOM.stations)) {
    candidates.push({ kind: 'station', id: station.id, x: station.approach.x, y: station.approach.y });
  }
  for (const table of ROOM.tables) {
    candidates.push({ kind: 'table', id: table.id, x: table.approach.x, y: table.approach.y });
  }
  candidates.push({ kind: 'board', id: 'board', x: 140, y: 292 });
  candidates.push({ kind: 'guard', id: 'guard', x: state.guardX, y: state.guardY + 40 });
  // Mochi the cat: walk up and press E to pet him.
  candidates.push({ kind: 'mochi', id: 'mochi', x: state.mochi.x, y: state.mochi.y, range: 64 });
  let best = null, bestDist = Infinity;
  for (const c of candidates) {
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  if (!best || bestDist > (best.range || INTERACT_RANGE)) return null;
  return { ...best, label: interactLabel(state, best) };
}

function interactLabel(state, it) {
  if (it.kind === 'mochi') return 'Pet Mochi the cat';
  if (it.kind === 'station') {
    return `Cook at the ${ROOM.stations[it.id].label}`;
  }
  if (it.kind === 'table') {
    const order = state.orders.find((o) => o.tableId === it.id);
    if (!order) return 'Empty table';
    if (!order.taken) return `Take ${order.customer.name}'s order`;
    if (order.plateReady) return `Serve ${recipeById(order.recipeId).name.split(' (')[0]}`;
    return `Talk to ${order.customer.name}`;
  }
  if (it.kind === 'board') return 'Order board — check the orders';
  if (it.kind === 'guard') return 'Talk to Sam the Guard';
  return '';
}

export function doInteract(state, it) {
  if (!it) return 'none';
  if (it.kind === 'station') {
    const result = cookAtStation(state, it.id);
    const station = ROOM.stations[it.id];
    if (result === 'started') {
      const order = selectedOrder(state);
      state.message = `Cooking for ${order.customer.name} at the ${station.label.toLowerCase()}…`;
      state.messageTimer = 2;
      return 'started';
    }
    state.message = result === 'no-order' ? 'Take an order first — walk to a table!'
      : result === 'wrong-station' ? `Nothing for this order at the ${station.label.toLowerCase()} — check the order board.`
      : result === 'no-stock' ? 'Out of stock! Buy more at the Morning Market after this day.'
      : result === 'station-busy' ? 'That station is full — wait a moment.'
      : 'This order is all cooked — serve it at the table!';
    state.messageTimer = 2;
    return result;
  }
  if (it.kind === 'table') {
    const order = state.orders.find((o) => o.tableId === it.id);
    if (!order) {
      state.message = 'An empty table. A customer will sit here soon.';
      state.messageTimer = 2;
      return 'empty';
    }
    if (!order.taken) {
      order.taken = true;
      state.selectedOrderId = order.id;
      state.activePlate = [...order.placed];
      state.plateReady = order.placed.length === recipeById(order.recipeId).ingredients.length;
      order.plateReady = state.plateReady;
      order.talkText = order.bubble;
      order.talkTimer = 4;
      state.message = `Order taken: ${recipeById(order.recipeId).name} for ${order.customer.name}. Cook it at the stations!`;
      state.messageTimer = 3;
      return 'take-order';
    }
    if (order.plateReady) {
      state.selectedOrderId = order.id;
      state.activePlate = [...order.placed];
      state.plateReady = true;
      return serveOrder(state) ? 'served' : 'not-ready';
    }
    // Taken, plate not ready: select it and chat — one bubble at a
    // time, cooking never waits for the story.
    state.selectedOrderId = order.id;
    state.activePlate = [...order.placed];
    state.plateReady = false;
    const type = CUSTOMER_TYPES[order.customer.type] || CUSTOMER_TYPES.regular;
    order.talkText = order.bubble;
    order.talkTimer = 4;
    state.message = `${order.customer.name} — ${order.customer.bio || type.bio || 'A regular at the warung.'}`;
    state.messageTimer = 4;
    return 'talk';
  }
  if (it.kind === 'board') {
    const taken = state.orders.filter((o) => o.taken);
    if (taken.length) {
      const idx = taken.findIndex((o) => o.id === state.selectedOrderId);
      const next = taken[(idx + 1) % taken.length];
      state.selectedOrderId = next.id;
      state.activePlate = [...next.placed];
      state.plateReady = next.placed.length === recipeById(next.recipeId).ingredients.length;
      next.plateReady = state.plateReady;
      state.message = `Active order: ${recipeById(next.recipeId).name} for ${next.customer.name}.`;
    } else {
      state.message = 'Order board: walk to a table and take an order first!';
    }
    state.messageTimer = 2.5;
    return 'board';
  }
  if (it.kind === 'guard') {
    // Talking to Sam shows his story in the message bar and one of his
    // quiet lines in his speech bubble — proud and hopeful, never pitiful.
    state.message = `Sam the Guard — ${GUARD_BIO}`;
    state.messageTimer = 4;
    state.guardLine = GUARD_LINES[state.guardLineIdx % GUARD_LINES.length];
    state.guardLineIdx += 1;
    state.guardGreet = 4;
    return 'guard-info';
  }
  if (it.kind === 'mochi') {
    // Petting Mochi: a heart floats above him, and the warung feels
    // a little calmer. He never blocks cooking — just a small joy.
    state.mochi.heartTimer = 3;
    state.message = 'Mochi purrs happily. The warung feels calmer already.';
    state.messageTimer = 2.5;
    return 'pet-mochi';
  }
  return 'none';
}
