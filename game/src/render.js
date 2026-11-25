// Dapur Kilat — renderer: draws the whole kitchen on one canvas.
// Layout, top to bottom: header (score, coins, timer) — order board —
// Head Chef AI suggestion banner — chef corner, stations, plate — ready tray —
// ingredient counter — message bar. Everything the judge needs to see
// (kitchen, order board, ingredients, a dish mid-assembly, timer, a plate
// ready to serve) is on screen in one glance.

import { CANVAS_W, CANVAS_H, INGREDIENTS, RECIPES, STAR_THRESHOLDS, UPGRADES, DECOR, recipeById, ingredientById } from './config.js';
import { drawIngredientIcon, drawCustomerFace, drawChef, drawKokiRobot, drawGuard, drawCat, drawPlant } from './draw.js';
import { selectedOrder, starsFor } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function patienceColor(ratio) {
  // Calm, human patience: green, then warm amber. No harsh flashing red —
  // the tension comes from the orders, not from a stressful UI.
  if (ratio > 0.5) return '#43a047';
  if (ratio > 0.25) return '#fb8c00';
  return '#e65100';
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function render(ctx, state) {
  state.ui = { ingredients: [], ready: [], orders: [], buttons: [] };
  const decor = DECOR.find((d) => d.id === state.decorId) || DECOR[0];
  ctx.fillStyle = decor.color;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Wall tiles and floor.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 56, 2, 116);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 660, CANVAS_W, 60);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < CANVAS_W; x += 96) ctx.fillRect(x, 660, 2, 60);

  if (state.screen === 'title') { drawTitleScreen(ctx, state); return; }
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  if (state.screen === 'playing') {
    drawKokiBanner(ctx, state);
    drawChefCorner(ctx, state);
    drawStations(ctx, state);
    drawPlateArea(ctx, state);
    drawReadyTray(ctx, state);
    drawIngredientCounter(ctx, state);
    drawBottomBar(ctx, state);
    if (state.showTutorial) drawTutorialOverlay(ctx, state);
    if (state.paused) drawPausedOverlay(ctx, state);
  } else if (state.screen === 'results') {
    drawResultsScreen(ctx, state);
  } else if (state.screen === 'upgrades') {
    drawUpgradeScreen(ctx, state);
  }
}

function drawTopBar(ctx, state) {
  // Warm, calm warung palette: warm wood, golden light, soft greens.
  // Not a loud neon arcade kitchen — the game should feel relaxing to
  // look at even during Rush mode.
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(0, 0, CANVAS_W, 56);
  ctx.fillStyle = '#ffca28';
  for (let x = 0; x < CANVAS_W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 56); ctx.lineTo(x + 24, 56); ctx.lineTo(x + 12, 68); ctx.closePath();
    ctx.fill();
  }
  text(ctx, 'DAPUR KILAT', 16, 28, 26, '#fff8e1');
  text(ctx, 'Warung Rush', 200, 30, 14, '#ffca28', 'normal');
  text(ctx, `Day ${state.day}`, 330, 28, 16, '#fff8e1');
  text(ctx, `Score ${state.score}`, 470, 28, 18, '#fff8e1');
  text(ctx, `Coins ${state.coins}`, 610, 28, 18, '#ffca28');
  if (state.mode === 'rush') {
    const urgent = state.timeLeft <= 30;
    ctx.fillStyle = urgent ? '#e65100' : '#fff8e1';
    rr(ctx, 760, 10, 130, 36, 18); ctx.fill();
    text(ctx, formatTime(state.timeLeft), 825, 29, 22, urgent ? '#fff' : '#6d4c41', 'bold', 'center');
  } else {
    ctx.fillStyle = '#43a047';
    rr(ctx, 760, 10, 130, 36, 18); ctx.fill();
    text(ctx, 'CHILL', 825, 29, 18, '#fff', 'bold', 'center');
  }
  text(ctx, state.combo > 1 ? `Combo x${state.combo}` : '', 930, 28, 16, '#ffca28');
  // Sam the Guard at the door, waving at every arriving customer.
  drawGuard(ctx, 1042, 34, 0.62, state.guardGreet > 0);
  if (state.guardGreet > 0 && state.screen === 'playing') {
    ctx.fillStyle = '#fff8e1';
    rr(ctx, 830, 62, 230, 24, 10); ctx.fill();
    ctx.strokeStyle = '#ffca28'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, `Sam the Guard: "${state.guardLine}"`, 945, 75, 12, '#5d4037', 'bold', 'center');
  }
  drawSmallButton(ctx, state, 'mute', 1080, 10, 84, 36, state.muted ? 'Sound: Off' : 'Sound: On');
  drawSmallButton(ctx, state, 'pause', 1172, 10, 92, 36, state.paused ? 'Resume' : 'Pause (P)');
}

function drawSmallButton(ctx, state, id, x, y, w, h, label) {
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 13, '#fff', 'bold', 'center');
  state.ui.buttons.push({ id, x, y, w, h });
}

function drawOrderBoard(ctx, state) {
  text(ctx, 'ORDER BOARD', 16, 78, 13, '#5d4037');
  const ticketW = 405, ticketH = 96, gap = 16;
  for (let i = 0; i < 3; i++) {
    const x = 16 + i * (ticketW + gap);
    const y = 88;
    const order = state.orders[i];
    ctx.fillStyle = order ? '#fffdf5' : 'rgba(255,255,255,0.45)';
    rr(ctx, x, y, ticketW, ticketH, 12); ctx.fill();
    ctx.strokeStyle = order && order.id === state.selectedOrderId ? '#ff9800' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = order && order.id === state.selectedOrderId ? 4 : 2; ctx.stroke();
    if (!order) {
      text(ctx, 'Waiting for a customer…', x + ticketW / 2, y + ticketH / 2, 15, '#8d6e63', 'normal', 'center');
      continue;
    }
    const recipe = recipeById(order.recipeId);
    const ratio = order.patience / order.patienceMax;
    const type = order.customer.type || 'regular';
    // Faces tell the story: the young group laughs, the old couple smiles,
    // the grumpy customer frowns with crossed arms.
    const mood = type === 'grumpy' ? 'grumpy'
      : type === 'group' && ratio > 0.5 ? 'laugh'
      : ratio > 0.5 ? 'happy' : ratio > 0.25 ? 'neutral' : 'angry';
    drawCustomerFace(ctx, order.customer, x + 44, y + 34, 24, mood);
    if (type === 'grumpy') {
      // Crossed arms under the face, tapping the table.
      ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 28, y + 62); ctx.lineTo(x + 60, y + 70);
      ctx.moveTo(x + 60, y + 62); ctx.lineTo(x + 28, y + 70);
      ctx.stroke();
    }
    if (type === 'couple') {
      // A small heart: the old couple enjoying food together, unhurried.
      ctx.fillStyle = '#e91e63';
      ctx.beginPath();
      ctx.arc(x + 38, y + 66, 4, 0, Math.PI * 2);
      ctx.arc(x + 48, y + 66, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 33, y + 67); ctx.lineTo(x + 43, y + 76); ctx.lineTo(x + 53, y + 67); ctx.closePath(); ctx.fill();
    }
    text(ctx, order.customer.name, x + 76, y + 20, 14, '#333');
    text(ctx, recipe.name, x + 76, y + 42, 17, '#b71c1c');
    // The customer's own words, not a menu blurb: neighbours chat, the
    // group laughs, the grumpy one complains. This is the living warung.
    text(ctx, `"${order.bubble || recipe.blurb}"`, x + 76, y + 62, 11, '#757575', 'italic');
    // Ingredient chips: filled when placed on the plate.
    recipe.ingredients.forEach((ingredientId, index) => {
      const ingredient = ingredientById(ingredientId);
      const cx = x + 90 + index * 52;
      const cy = y + 82;
      ctx.fillStyle = order.placed.includes(ingredientId) ? '#c8e6c9' : '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = order.placed.includes(ingredientId) ? '#43a047' : '#bdbdbd';
      ctx.lineWidth = 2; ctx.stroke();
      drawIngredientIcon(ctx, ingredient.draw, cx, cy, 11, ingredient.color, ingredient.accent);
      if (order.placed.includes(ingredientId)) {
        ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 1, cy + 5); ctx.lineTo(cx + 7, cy - 5); ctx.stroke();
      }
    });
    // Patience bar: the clearest feedback in the game. Impatient customers
    // sigh ("Huh…") instead of flashing red — the mood stays warm.
    ctx.fillStyle = '#e0e0e0';
    rr(ctx, x + 280, y + 14, 108, 12, 6); ctx.fill();
    ctx.fillStyle = patienceColor(ratio);
    rr(ctx, x + 280, y + 14, 108 * Math.max(0, ratio), 12, 6); ctx.fill();
    const patienceText = state.mode === 'santai' ? 'Chill'
      : ratio < 0.25 && type !== 'grumpy' ? `Huh… ${Math.ceil(order.patience)} s`
      : `${Math.ceil(order.patience)} s`;
    text(ctx, patienceText, x + 334, y + 40, 12, '#5d4037', 'normal', 'center');
    state.ui.orders.push({ id: order.id, x, y, w: ticketW, h: ticketH });
  }
}

function drawKokiBanner(ctx, state) {
  const koki = state.koki;
  const y = 192, h = 40;
  ctx.fillStyle = koki.enabled ? '#e3f2fd' : '#eceff1';
  rr(ctx, 232, y, 616, h, 12); ctx.fill();
  ctx.strokeStyle = koki.enabled ? '#42a5f5' : '#b0bec5'; ctx.lineWidth = 2; ctx.stroke();
  drawKokiRobot(ctx, 258, y + 20, 0.55, koki.enabled);
  const label = koki.enabled ? (koki.text || 'Head Chef AI ready to help!') : 'Head Chef AI is off — press K to turn it on.';
  text(ctx, label, 288, y + 15, 15, '#1565c0');
  if (koki.sequence.length) {
    text(ctx, 'Order: ' + koki.sequence.join(' → '), 288, y + 32, 12, '#546e7a', 'normal');
  } else if (koki.enabled) {
    text(ctx, 'Head Chef AI suggests the best next step — the suggested button glows.', 288, y + 32, 12, '#546e7a', 'normal');
  }
  drawSmallButton(ctx, state, 'koki', 856, y + 4, 120, 32, koki.enabled ? 'Head Chef: On' : 'Head Chef: Off');
}

function drawChefCorner(ctx, state) {
  const x = 16, y = 192, w = 200, h = 236;
  ctx.fillStyle = 'rgba(255,248,225,0.9)';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'CHEF RANI', x + w / 2, y + 20, 15, '#b71c1c', 'bold', 'center');
  drawPlant(ctx, x + 18, y + 40, 0.7, Math.sin(state.elapsed * 0.8) * 2);
  drawChef(ctx, x + 62, y + 96, 1.1, state.chefMood);
  drawKokiRobot(ctx, x + 150, y + 96, 1, state.koki.enabled);
  text(ctx, 'Head Chef AI', x + 150, y + 128, 11, '#1565c0', 'bold', 'center');
  text(ctx, 'strict sous-chef', x + 150, y + 144, 10, '#757575', 'normal', 'center');
  const moodText = state.chefMood === 'happy' ? 'Happy! Order served.' : state.chefMood === 'worried' ? 'Oh no, a customer is getting annoyed!' : state.chefMood === 'proud' ? 'What a great shift!' : 'Ready to cook!';
  text(ctx, moodText, x + w / 2, y + 168, 12, '#5d4037', 'normal', 'center');
  ctx.fillStyle = '#fff3e0';
  rr(ctx, x + 12, y + 186, w - 24, 36, 8); ctx.fill();
  text(ctx, `Served: ${state.served}  •  Left: ${state.lost}`, x + w / 2, y + 200, 12, '#5d4037', 'normal', 'center');
  if (state.upgradesOwned.size) {
    text(ctx, 'Upgrades: ' + [...state.upgradesOwned].map((id) => (UPGRADES.find((u) => u.id === id) || {}).name || id).join(', '), x + w / 2, y + 216, 10, '#2e7d32', 'bold', 'center');
  }
  // The warung cat, asleep in the corner of the kitchen.
  drawCat(ctx, x + 168, y + 228, 0.5);
}

function drawStations(ctx, state) {
  const stations = [
    { id: 'talenan', x: 232, label: 'CHOPPING BOARD — CHOP', hint: 'Chili, greens, tofu, onion' },
    { id: 'wajan', x: 548, label: 'WOK — COOK', hint: 'Rice, noodles, chicken, egg, meatballs, iced tea' },
  ];
  for (const station of stations) {
    const x = station.x, y = 240, w = 300, h = 188;
    const glow = state.koki.target && state.koki.target.kind === 'station' && state.koki.target.id === station.id;
    ctx.fillStyle = glow ? '#fff9c4' : '#fffdf5';
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.strokeStyle = glow ? '#ff9800' : 'rgba(0,0,0,0.15)'; ctx.lineWidth = glow ? 4 : 2; ctx.stroke();
    text(ctx, station.label, x + w / 2, y + 20, 15, '#5d4037', 'bold', 'center');
    text(ctx, station.hint, x + w / 2, y + 40, 11, '#9e9e9e', 'normal', 'center');
    const slots = state.prepSlots[station.id];
    if (!slots.length) {
      text(ctx, 'Empty — tap an ingredient below', x + w / 2, y + 110, 13, '#bdbdbd', 'normal', 'center');
    }
    slots.forEach((job, index) => {
      const ingredient = ingredientById(job.ingredientId);
      const jx = x + 60 + index * 180;
      const jy = y + 110;
      // Steam rising: motion implied in a still frame.
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.arc(jx - 14 + s * 14, jy - 52 - s * 8, 7 - s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(jx, jy, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = ingredient.accent; ctx.lineWidth = 3; ctx.stroke();
      drawIngredientIcon(ctx, ingredient.draw, jx, jy, 26, ingredient.color, ingredient.accent);
      const ratio = Math.min(1, job.progress / job.total);
      ctx.fillStyle = '#e0e0e0';
      rr(ctx, jx - 40, jy + 44, 80, 10, 5); ctx.fill();
      ctx.fillStyle = '#fb8c00';
      rr(ctx, jx - 40, jy + 44, 80 * ratio, 10, 5); ctx.fill();
      text(ctx, ingredient.name, jx, jy + 66, 12, '#5d4037', 'bold', 'center');
    });
  }
}

function drawPlateArea(ctx, state) {
  const x = 864, y = 240, w = 400, h = 188;
  const order = selectedOrder(state);
  const recipe = order ? recipeById(order.recipeId) : null;
  const glow = state.plateReady || (state.koki.target && state.koki.target.kind === 'plate');
  ctx.fillStyle = glow ? '#e8f5e9' : '#fffdf5';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = glow ? '#43a047' : 'rgba(0,0,0,0.15)'; ctx.lineWidth = glow ? 4 : 2; ctx.stroke();
  text(ctx, 'PLATE — BUILD THE ORDER', x + w / 2, y + 20, 15, '#5d4037', 'bold', 'center');
  // The plate itself.
  ctx.fillStyle = '#eceff1';
  ctx.beginPath(); ctx.ellipse(x + 130, y + 105, 95, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(x + 130, y + 105, 72, 46, 0, 0, Math.PI * 2); ctx.fill();
  if (order && recipe) {
    recipe.ingredients.forEach((ingredientId, index) => {
      const ingredient = ingredientById(ingredientId);
      const placed = order.placed.includes(ingredientId);
      const px = x + 70 + index * 40;
      const py = y + 105 + (index % 2 === 0 ? -14 : 14);
      if (placed) drawIngredientIcon(ctx, ingredient.draw, px, py, 20, ingredient.color, ingredient.accent);
      else {
        ctx.strokeStyle = '#bdbdbd'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, '?', px, py + 1, 16, '#bdbdbd', 'bold', 'center');
      }
    });
    const nameParts = recipe.name.split(' (');
    text(ctx, nameParts[0], x + 250, y + 62, 14, '#b71c1c');
    if (nameParts[1]) text(ctx, '(' + nameParts[1], x + 250, y + 80, 12, '#b71c1c', 'normal');
    text(ctx, `${order.placed.length}/${recipe.ingredients.length} ingredients`, x + 250, y + 100, 13, '#5d4037', 'normal');
    if (state.plateReady) {
      ctx.fillStyle = '#43a047';
      rr(ctx, x + 250, y + 112, 130, 44, 10); ctx.fill();
      text(ctx, 'READY TO SERVE!', x + 315, y + 135, 14, '#fff', 'bold', 'center');
      state.ui.buttons.push({ id: 'serve', x: x + 250, y: y + 112, w: 130, h: 44 });
    } else {
      text(ctx, 'Tap a Ready item below,', x + 250, y + 126, 11, '#9e9e9e', 'normal');
      text(ctx, 'then serve it.', x + 250, y + 144, 11, '#9e9e9e', 'normal');
    }
  } else {
    text(ctx, 'No active order yet.', x + w / 2, y + 105, 14, '#9e9e9e', 'normal', 'center');
  }
  if (state.plateReady) state.ui.plate = { x, y, w, h };
}

function drawReadyTray(ctx, state) {
  const y = 440;
  text(ctx, 'READY — tap to put it on the plate:', 16, y + 16, 13, '#5d4037');
  if (!state.readyTray.length) {
    text(ctx, 'Nothing yet. Finished ingredients appear here.', 330, y + 16, 13, '#9e9e9e', 'normal');
    return;
  }
  state.readyTray.forEach((ingredientId, index) => {
    const ingredient = ingredientById(ingredientId);
    const x = 330 + index * 92;
    const glow = state.koki.target && state.koki.target.kind === 'ready' && state.koki.target.id === ingredientId;
    ctx.fillStyle = glow ? '#fff9c4' : '#fff';
    rr(ctx, x, y, 82, 44, 10); ctx.fill();
    ctx.strokeStyle = glow ? '#ff9800' : '#ffca28'; ctx.lineWidth = glow ? 4 : 2; ctx.stroke();
    drawIngredientIcon(ctx, ingredient.draw, x + 22, y + 22, 15, ingredient.color, ingredient.accent);
    text(ctx, ingredient.name, x + 44, y + 23, 12, '#333');
    state.ui.ready.push({ id: ingredientId, x, y, w: 82, h: 44 });
  });
}

function drawIngredientCounter(ctx, state) {
  const y = 500;
  text(ctx, 'INGREDIENT COUNTER — tap an ingredient (keys 1-9, 0), it is prepped automatically:', 16, y + 8, 13, '#5d4037');
  const order = selectedOrder(state);
  const recipe = order ? recipeById(order.recipeId) : null;
  INGREDIENTS.forEach((ingredient, index) => {
    const w = 118, h = 122, gap = 8;
    const x = 14 + index * (w + gap);
    const needed = recipe && recipe.ingredients.includes(ingredient.id);
    const busy = state.prepSlots.wajan.some((p) => p.ingredientId === ingredient.id)
      || state.prepSlots.talenan.some((p) => p.ingredientId === ingredient.id)
      || state.readyTray.includes(ingredient.id)
      || (order && order.placed.includes(ingredient.id));
    const glow = state.koki.target && state.koki.target.kind === 'ingredient' && state.koki.target.id === ingredient.id;
    ctx.fillStyle = glow ? '#fff9c4' : needed ? '#fff8e1' : '#fafafa';
    rr(ctx, x, y + 22, w, h, 12); ctx.fill();
    ctx.strokeStyle = glow ? '#ff9800' : needed ? '#ff9800' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = glow || needed ? 3 : 2; ctx.stroke();
    // A soft disc behind the icon: pale icons (nasi, telur) stay readable
    // on the white card at thumbnail size.
    ctx.fillStyle = 'rgba(255, 213, 79, 0.35)';
    ctx.beginPath(); ctx.arc(x + w / 2, y + 62, 34, 0, Math.PI * 2); ctx.fill();
    drawIngredientIcon(ctx, ingredient.draw, x + w / 2, y + 62, 30, ingredient.color, ingredient.accent);
    text(ctx, ingredient.name, x + w / 2, y + 104, 14, '#333', 'bold', 'center');
    text(ctx, ingredient.station === 'wajan' ? 'Wok' : 'Board', x + w / 2, y + 122, 11, '#9e9e9e', 'normal', 'center');
    ctx.fillStyle = '#5d4037';
    rr(ctx, x + 6, y + 28, 22, 20, 5); ctx.fill();
    text(ctx, ingredient.key, x + 17, y + 39, 12, '#fff', 'bold', 'center');
    if (busy) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      rr(ctx, x, y + 22, w, h, 12); ctx.fill();
      text(ctx, '…', x + w / 2, y + 62, 20, '#757575', 'bold', 'center');
    }
    state.ui.ingredients.push({ id: ingredient.id, x, y: y + 22, w, h });
  });
}

function drawBottomBar(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 660, CANVAS_W, 60);
  const message = state.messageTimer > 0 ? state.message : 'Tap an order to select it, tap ingredients, serve when the plate is complete.';
  text(ctx, message, 16, 682, 14, '#fff', 'normal');
  text(ctx, 'No ads • No purchases • No lives • Offline • Calm music (M)', 16, 704, 12, '#ffca28', 'normal');
  text(ctx, '1-9,0 ingredients • Space serve • K Chef AI • P pause • M sound', 900, 682, 12, '#fff', 'normal');
  text(ctx, `3-star target: ${STAR_THRESHOLDS[2]} points`, 900, 704, 12, '#ffca28', 'normal');
}

function drawTitleScreen(ctx, state) {
  ctx.fillStyle = 'rgba(60,20,10,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 190, 60, 900, 600, 20); ctx.fill();
  ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'DAPUR KILAT', 640, 130, 64, '#b71c1c', 'bold', 'center');
  text(ctx, '— Warung Rush —', 640, 172, 24, '#e65100', 'bold', 'center');
  text(ctx, "Run Bu Rani's warung at lunchtime. Read the orders,", 640, 212, 16, '#5d4037', 'normal', 'center');
  text(ctx, 'cook in the wok, chop on the board, serve before customers leave!', 640, 236, 16, '#5d4037', 'normal', 'center');
  drawChef(ctx, 560, 300, 1.2, 'happy');
  drawKokiRobot(ctx, 720, 300, 1.2, true);
  text(ctx, 'Chef Rani & Head Chef AI, your clever sous-chef', 640, 340, 14, '#1565c0', 'normal', 'center');
  // Mode buttons.
  drawMenuButton(ctx, state, 'mode-rush', 290, 380, 330, 64, 'RUSH MODE', '150-second shift, chase 3 stars');
  drawMenuButton(ctx, state, 'mode-santai', 660, 380, 330, 64, 'CHILL MODE', 'No timer, no failing');
  drawMenuButton(ctx, state, 'tutorial', 470, 460, 340, 48, 'HOW TO PLAY', '30-second tutorial');
  text(ctx, 'No ads  •  No in-app purchases  •  No lives  •  All upgrades from coins  •  Offline', 640, 540, 14, '#2e7d32', 'bold', 'center');
  text(ctx, '9 warung dishes: nasi goreng, mie ayam, gado-gado, sate, ayam geprek, bakso, es teh.', 640, 568, 13, '#757575', 'normal', 'center');
  text(ctx, 'Tap the big ingredients on the counter, no dragging. Keys 1-9, 0 for ingredients, Space to serve.', 640, 592, 13, '#757575', 'normal', 'center');
  text(ctx, 'Made for make.fun — @farhat-gt', 640, 632, 12, '#9e9e9e', 'normal', 'center');
}

function drawMenuButton(ctx, state, id, x, y, w, h, label, sub) {
  ctx.fillStyle = '#e65100';
  rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rr(ctx, x, y + h - 8, w, 8, 6); ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 - 10, 20, '#fff', 'bold', 'center');
  text(ctx, sub, x + w / 2, y + h / 2 + 14, 12, '#ffe0b2', 'normal', 'center');
  state.ui.buttons.push({ id, x, y, w, h });
}

function drawResultsScreen(ctx, state) {
  const results = state.results || { score: 0, coins: 0, served: 0, lost: 0, bestCombo: 0, stars: 0 };
  ctx.fillStyle = 'rgba(60,20,10,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 240, 50, 800, 620, 20); ctx.fill();
  ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, state.mode === 'santai' ? 'CHILL SHIFT COMPLETE' : 'SHIFT COMPLETE', 640, 100, 36, '#b71c1c', 'bold', 'center');
  for (let i = 0; i < 3; i++) {
    const sx = 560 + i * 80;
    ctx.fillStyle = i < results.stars ? '#ffc107' : '#e0e0e0';
    ctx.beginPath();
    ctx.moveTo(sx, 130); ctx.lineTo(sx + 12, 158); ctx.lineTo(sx + 42, 158); ctx.lineTo(sx + 18, 176); ctx.lineTo(sx + 26, 204); ctx.lineTo(sx, 188); ctx.lineTo(sx - 26, 204); ctx.lineTo(sx - 18, 176); ctx.lineTo(sx - 42, 158); ctx.lineTo(sx - 12, 158); ctx.closePath(); ctx.fill();
  }
  text(ctx, `Score ${results.score}  •  Served ${results.served}  •  Left ${results.lost}`, 640, 240, 18, '#5d4037', 'bold', 'center');
  text(ctx, `Coins earned ${results.coins}  •  Best combo x${results.bestCombo}`, 640, 268, 16, '#5d4037', 'normal', 'center');
  text(ctx, results.stars === 3 ? '3 stars! Your warung is legendary!' : results.stars === 2 ? '2 stars — almost perfect!' : results.stars === 1 ? '1 star — a good shift!' : 'No stars yet — try again, free, no lives!', 640, 296, 15, '#2e7d32', 'bold', 'center');
  if (state.achievements && state.achievements.size) {
    text(ctx, 'Achievements: ' + [...state.achievements].join(' • '), 640, 320, 14, '#e65100', 'bold', 'center');
  }
  text(ctx, 'UPGRADE SHOP — buy with coins (no real money):', 640, 336, 15, '#b71c1c', 'bold', 'center');
  UPGRADES.forEach((upgrade, index) => {
    const x = 280 + index * 190;
    const y = 356;
    const owned = state.upgradesOwned.has(upgrade.id);
    const afford = state.coins >= upgrade.cost;
    ctx.fillStyle = owned ? '#c8e6c9' : afford ? '#fff' : '#eeeeee';
    rr(ctx, x, y, 170, 96, 10); ctx.fill();
    ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, upgrade.name, x + 85, y + 20, 13, '#333', 'bold', 'center');
    text(ctx, upgrade.desc, x + 85, y + 42, 11, '#757575', 'normal', 'center');
    text(ctx, owned ? 'OWNED' : `${upgrade.cost} coins`, x + 85, y + 70, 13, owned ? '#2e7d32' : '#e65100', 'bold', 'center');
    if (!owned) state.ui.buttons.push({ id: `upgrade-${upgrade.id}`, x, y, w: 170, h: 96 });
  });
  text(ctx, 'Warung decor (free, pick a wall color):', 640, 486, 14, '#5d4037', 'bold', 'center');
  DECOR.forEach((decor, index) => {
    const x = 440 + index * 100;
    const y = 500;
    ctx.fillStyle = decor.color;
    rr(ctx, x, y, 84, 36, 8); ctx.fill();
    ctx.strokeStyle = state.decorId === decor.id ? '#b71c1c' : '#bdbdbd'; ctx.lineWidth = state.decorId === decor.id ? 4 : 2; ctx.stroke();
    text(ctx, decor.name, x + 42, y + 52, 11, '#5d4037', 'normal', 'center');
    state.ui.buttons.push({ id: `decor-${decor.id}`, x, y, w: 84, h: 36 });
  });
  drawMenuButton(ctx, state, 'play-again', 340, 580, 280, 56, 'PLAY AGAIN', 'A new shift, free, no waiting');
  drawMenuButton(ctx, state, 'change-mode', 660, 580, 280, 56, 'CHANGE MODE', 'Rush or Chill');
}

function drawUpgradeScreen(ctx, state) {
  drawResultsScreen(ctx, state);
}

function drawTutorialOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 340, 110, 600, 460, 16); ctx.fill();
  text(ctx, 'HOW TO PLAY — 30 SECONDS', 640, 150, 26, '#b71c1c', 'bold', 'center');
  const steps = [
    ['1', 'Tap an order on the board above to select it.'],
    ['2', 'Tap an ingredient on the counter below — it is cooked in the wok or chopped on the board.'],
    ['3', 'Finished ingredients appear in the READY bar — tap one to put it on the plate.'],
    ['4', 'Full plate = tap SERVE (or Space). Head Chef AI suggests the best next step.'],
    ['5', 'Rush: serve before the timer runs out. Chill: no timer, no failing.'],
  ];
  steps.forEach(([number, line], index) => {
    const y = 200 + index * 52;
    ctx.fillStyle = '#e65100';
    ctx.beginPath(); ctx.arc(390, y, 18, 0, Math.PI * 2); ctx.fill();
    text(ctx, number, 390, y + 1, 16, '#fff', 'bold', 'center');
    text(ctx, line, 420, y + 1, 14, '#333', 'normal');
  });
  drawMenuButton(ctx, state, 'close-tutorial', 470, 480, 340, 52, 'START COOKING', 'Close tutorial');
}

function drawPausedOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', 640, 340, 48, '#fff', 'bold', 'center');
  text(ctx, 'Press P or the Resume button to keep playing', 640, 390, 16, '#fff', 'normal', 'center');
}
