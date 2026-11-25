// The Last Wok — renderer: draws the whole kitchen on one canvas.
// Layout, top to bottom: header (score, coins, timer) — order board —
// Head Chef AI suggestion banner — chef corner, stations, plate — ready tray —
// ingredient counter — message bar. Everything the judge needs to see
// (kitchen, order board, ingredients, a dish mid-assembly, timer, a plate
// ready to serve) is on screen in one glance.

import { CANVAS_W, CANVAS_H, INGREDIENTS, RECIPES, STAR_THRESHOLDS, UPGRADES, DECOR, HIRE_COST, WEATHERS, ROOM, CUSTOMER_TYPES, NEWS_HEADLINES, recipeById, ingredientById } from './config.js';
import { drawIngredientIcon, drawCustomerFace, drawChef, drawKokiRobot, drawGuard, drawCat, drawPlant } from './draw.js';
import { drawSprite, customerSprites, spriteFor } from './sprites.js';
import { selectedOrder, starsFor, dayClock, marketPrice, nearestInteractable } from './state.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  // Monospace = chunky pixel-font feel once the frame is pixelated.
  ctx.font = `${weight} ${size}px "Courier New", monospace`;
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
  // Wall tiles and floor — chunky pixel wood planks, warm sunset light.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 56, 2, 116);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(0, 660, CANVAS_W, 60);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  for (let x = 0; x < CANVAS_W; x += 96) ctx.fillRect(x, 660, 4, 60);
  // Dithered sunset glow: warm orange squares fading down the wall.
  for (let row = 0; row < 4; row++) {
    for (let x = 0; x < CANVAS_W; x += 16) {
      if ((x / 16 + row) % 2 === 0) {
        ctx.fillStyle = `rgba(255, ${160 - row * 20}, 40, ${0.10 - row * 0.02})`;
        ctx.fillRect(x, 56 + row * 16, 8, 8);
      }
    }
  }

  if (state.screen === 'intro') { drawIntroPanel(ctx, state); return; }
  if (state.screen === 'title') { drawTitleScreen(ctx, state); return; }
  drawTopBar(ctx, state);
  if (state.screen === 'playing') {
    // The walkable warung: Rani walks the room, customers sit at tables,
    // Mochi lives by the window. The order board hangs on the wall.
    drawRoom(ctx, state);
    drawWallBoard(ctx, state);
    drawBottomHud(ctx, state);
    // Living world: the light shifts with the day, rain falls on rainy
    // days, lamps glow in the evening. Drawn over the scene so the whole
    // warung feels the time of day — never over the menus.
    drawAtmosphere(ctx, state);
    if (state.showTutorial) drawTutorialOverlay(ctx, state);
    if (state.paused) drawPausedOverlay(ctx, state);
  } else if (state.screen === 'results') {
    drawResultsScreen(ctx, state);
  } else if (state.screen === 'market') {
    drawMarketScreen(ctx, state);
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
  text(ctx, 'THE LAST WOK', 16, 28, 26, '#fff8e1');
  text(ctx, 'Wajan Terakhir', 245, 30, 14, '#ffca28', 'normal');
  text(ctx, `Day ${state.day}`, 380, 28, 16, '#fff8e1');
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
  // Sam the Guard now stands by the door in the room, waving at every
  // arriving customer — walk up to him to hear his greeting.
  drawSmallButton(ctx, state, 'mute', 1080, 10, 84, 36, state.muted ? 'Sound: Off' : 'Sound: On');
  drawSmallButton(ctx, state, 'pause', 1172, 10, 92, 36, state.paused ? 'Resume' : 'Pause (P)');
}

// Time of day, weather, lamps: the living world over the play scene.
// Morning is soft and warm, afternoon bright, evening a warm orange glow
// with the lamps on, night dark blue with warm lamp light. Rain falls in
// diagonal streaks on rainy days. All cheap overlays — no new art.
function drawAtmosphere(ctx, state) {
  const clock = dayClock(state);
  const phase = clock.phase;
  if (phase.tint) {
    ctx.fillStyle = phase.tint;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  if (state.weather === 'cloudy') {
    ctx.fillStyle = 'rgba(90, 100, 120, 0.08)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
  if (phase.id === 'evening' || phase.id === 'night') {
    // Hanging lamps glow warm over the dining room as the day darkens.
    const glow = phase.id === 'night' ? 0.30 : 0.18;
    for (const lx of [320, 640, 960]) {
      const grad = ctx.createRadialGradient(lx, 84, 8, lx, 84, 150);
      grad.addColorStop(0, `rgba(255, 200, 90, ${glow})`);
      grad.addColorStop(1, 'rgba(255, 200, 90, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(lx - 150, 0, 300, 240);
    }
  }
  if (state.weather === 'rainy') {
    // Rain streaks, falling diagonally, animated by the shift clock.
    ctx.strokeStyle = 'rgba(190, 210, 240, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 50; i++) {
      const rx = ((i * 97.3 + state.elapsed * 260) % 1400) - 60;
      const ry = ((i * 57.7 + state.elapsed * 520) % 800) - 40;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 5, ry + 13);
    }
    ctx.stroke();
  }
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSmallButton(ctx, state, id, x, y, w, h, label) {
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 13, '#fff', 'bold', 'center');
  state.ui.buttons.push({ id, x, y, w, h });
}

// --- The walkable warung room (top-down, A Space for the Unbound style) ---

// What a customer looks like right now: happy, laughing, worried,
// annoyed, content while eating, surprised when an event hits. The PNG
// sprites cannot change faces, so the mood shows as a small face badge
// and a bounce — the player can SEE it, not just read a number.
function moodFor(order, state) {
  if (order.walkState === 'eating') return 'content';
  if (order.walkState === 'leavingAngry') return 'annoyed';
  if (state.surpriseTimer > 0) return 'surprised';
  // Mr Grumpy softens when a child is seated — that is what he and his
  // wife always wanted most. Soft beats grumpy and annoyed, never eating.
  const childSeated = state.orders.some((o) => o.walkState === 'seated' && o.customer.type === 'family');
  if (order.customer.type === 'grumpy' && childSeated) return 'soft';
  const ratio = order.patience / order.patienceMax;
  if (order.customer.type === 'grumpy') return ratio > 0.5 ? 'grumpy' : 'annoyed';
  if (ratio < 0.25) return 'annoyed';
  if (ratio < 0.5) return 'worried';
  if (state.chatter && (state.chatter.aId === order.id || state.chatter.bId === order.id)) return 'laugh';
  return 'happy';
}

function drawMoodBadge(ctx, x, y, mood) {
  // A tiny face: yellow for happy/content/laugh, pale for worried,
  // orange for annoyed/grumpy, white wide eyes for surprised.
  const colors = {
    happy: '#ffd54f', laugh: '#ffd54f', content: '#ffe082',
    worried: '#fff59d', annoyed: '#ffab91', grumpy: '#ffab91', surprised: '#fff',
    soft: '#ffe0b2',
  };
  ctx.fillStyle = colors[mood] || '#ffd54f';
  ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#5d4037';
  if (mood === 'surprised') {
    ctx.beginPath(); ctx.arc(x - 3, y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 1, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y + 4, 2.2, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (mood === 'laugh' || mood === 'content' || mood === 'soft') {
    // Closed happy eyes — laughing, content, or softly smiling.
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x - 3.5, y - 1, 2, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 3.5, y - 1, 2, Math.PI, 0); ctx.stroke();
  } else if (mood === 'annoyed' || mood === 'grumpy') {
    // Angled eyebrows, flat mouth.
    ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 1, y - 2.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6, y - 5); ctx.lineTo(x + 1, y - 2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 3, y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 3, y + 4); ctx.lineTo(x + 3, y + 4); ctx.stroke();
    return;
  } else {
    ctx.beginPath(); ctx.arc(x - 3, y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 3, y - 1, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  // Smile: open for laugh, small for happy/content, wavy for worried.
  ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (mood === 'laugh') {
    ctx.fillStyle = '#5d4037';
    ctx.arc(x, y + 2, 3.4, 0, Math.PI);
    ctx.fill();
  } else if (mood === 'worried') {
    ctx.moveTo(x - 3, y + 4);
    ctx.quadraticCurveTo(x - 1.5, y + 2, x, y + 4);
    ctx.quadraticCurveTo(x + 1.5, y + 6, x + 3, y + 4);
    ctx.stroke();
  } else {
    ctx.arc(x, y + 1, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function wrapText(str, maxChars) {
  if (str.length <= maxChars) return [str];
  const words = str.split(' ');
  const lines = [''];
  for (const word of words) {
    if ((lines[lines.length - 1] + ' ' + word).trim().length > maxChars) lines.push(word);
    else lines[lines.length - 1] = (lines[lines.length - 1] + ' ' + word).trim();
  }
  return lines.slice(0, 2);
}

function drawSpeechBubble(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill || '#fff';
  rr(ctx, x - w / 2, y - h / 2, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = fill || '#fff';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + h / 2 - 1); ctx.lineTo(x + 2, y + h / 2 + 8); ctx.lineTo(x + 8, y + h / 2 - 1);
  ctx.closePath(); ctx.fill();
}

// The whole room: floor, rug, windows, door, kitchen counter with the
// three stations and ingredient crates, tables, Sam by the door, Chef
// AI in the kitchen, customers, Mochi, and Bu Rani herself.
function drawRoom(ctx, state) {
  const floor = ROOM.floor;
  // Wood floor planks — light and open, so the room feels airy.
  ctx.fillStyle = '#b08968';
  ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = floor.y + 24; y < floor.y + floor.h; y += 24) ctx.fillRect(floor.x, y, floor.w, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x = floor.x + 48; x < floor.x + floor.w; x += 96) ctx.fillRect(x, floor.y, 2, floor.h);
  // A woven rug in the middle of the dining room.
  ctx.fillStyle = '#a1887f';
  ctx.beginPath(); ctx.ellipse(640, 540, 220, 60, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#bcaaa4';
  ctx.beginPath(); ctx.ellipse(640, 540, 180, 44, 0, 0, Math.PI * 2); ctx.fill();

  drawWindows(ctx, state);

  drawTV(ctx, state);

  // The door, top-right: open, with a welcome mat below it.
  ctx.fillStyle = '#4e342e';
  ctx.fillRect(ROOM.door.x - 4, ROOM.door.y - 4, ROOM.door.w + 8, ROOM.door.h + 8);
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(ROOM.door.x, ROOM.door.y, ROOM.door.w, ROOM.door.h);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(ROOM.door.x + 14, ROOM.door.y + 6, 72, 8);
  ctx.fillStyle = '#a1887f';
  ctx.fillRect(ROOM.door.x + 20, ROOM.door.y + ROOM.door.h, 60, 10);

  // Kitchen counter along the top wall, with the three stations.
  const counter = ROOM.counter;
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(counter.x, counter.y, counter.w, counter.h);
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(counter.x, counter.y, counter.w, 14);
  for (const station of Object.values(ROOM.stations)) {
    const glow = state.koki.target
      && (state.koki.target.kind === 'station' && state.koki.target.id === station.id
        || state.koki.target.kind === 'ingredient' && ingredientById(state.koki.target.id).station === station.id);
    ctx.fillStyle = glow ? '#fff9c4' : 'rgba(255,255,255,0.10)';
    ctx.fillRect(station.x + 4, station.y + 18, station.w - 8, station.h - 22);
    if (glow) { ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 3; ctx.strokeRect(station.x + 4, station.y + 18, station.w - 8, station.h - 22); }
    text(ctx, station.label, station.x + station.w / 2, station.y + 30, 11, '#fff8e1', 'bold', 'center');
    // Jobs cooking on the station: ingredient icon + progress bar.
    const slots = state.prepSlots[station.id];
    slots.forEach((job, index) => {
      const ingredient = ingredientById(job.ingredientId);
      const jx = station.x + 40 + index * 70;
      const jy = station.y + 44;
      drawIngredientIcon(ctx, ingredient.draw, jx, jy, 12, ingredient.color, ingredient.accent);
      const ratio = Math.min(1, job.progress / job.total);
      ctx.fillStyle = '#e0e0e0';
      rr(ctx, jx - 24, jy + 14, 48, 6, 3); ctx.fill();
      ctx.fillStyle = '#fb8c00';
      rr(ctx, jx - 24, jy + 14, 48 * ratio, 6, 3); ctx.fill();
    });
    if (station.id === 'wajan') {
      const flick = Math.floor(state.elapsed * 6) % 2;
      ctx.fillStyle = '#ff6d00';
      ctx.fillRect(station.x + 20, station.y + station.h - 8, station.w - 40, 5);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(station.x + 60 + flick * 10, station.y + station.h - 14, 22, 8);
    }
    if (station.id === 'grill') {
      ctx.fillStyle = '#4e342e';
      for (let gx = station.x + 16; gx < station.x + station.w - 16; gx += 22) ctx.fillRect(gx, station.y + station.h - 10, 14, 4);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(station.x + 70, station.y + station.h - 7, 18, 4);
    }
  }
  // Ingredient crates along the counter front — ingredients on the
  // counter, visible at a glance, with stock running low in red.
  INGREDIENTS.forEach((ingredient, index) => {
    const ix = counter.x + 24 + index * 60;
    const iy = counter.y + counter.h - 8;
    const stock = state.stock[ingredient.id] || 0;
    drawIngredientIcon(ctx, ingredient.draw, ix, iy, 10, ingredient.color, ingredient.accent);
    if (stock <= 2) text(ctx, `×${stock}`, ix + 12, iy + 8, 9, '#ff5252', 'bold', 'center');
  });

  // Tables with chairs; the plate on the table fills as Rani cooks.
  for (const table of ROOM.tables) {
    const order = state.orders.find((o) => o.tableId === table.id);
    const glow = state.koki.target && state.koki.target.kind === 'plate'
      && order && order.id === state.selectedOrderId;
    ctx.fillStyle = '#fff8e1';
    rr(ctx, table.x, table.y, table.w, table.h, 12); ctx.fill();
    ctx.strokeStyle = glow ? '#43a047' : 'rgba(0,0,0,0.2)'; ctx.lineWidth = glow ? 4 : 2; ctx.stroke();
    // Chairs: north (customer) and south (Rani's side).
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath(); ctx.arc(table.x + table.w / 2, table.y - 12, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(table.x + table.w / 2, table.y + table.h + 12, 14, 0, Math.PI * 2); ctx.fill();
    if (order && order.taken) {
      const recipe = recipeById(order.recipeId);
      // The plate on the table, filling up as ingredients land on it.
      ctx.fillStyle = '#eceff1';
      ctx.beginPath(); ctx.ellipse(table.x + table.w / 2, table.y + table.h / 2, 46, 28, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2; ctx.stroke();
      recipe.ingredients.forEach((ingredientId, index) => {
        const ingredient = ingredientById(ingredientId);
        const px = table.x + table.w / 2 - 33 + index * 22;
        const py = table.y + table.h / 2 + (index % 2 === 0 ? -8 : 8);
        if (order.placed.includes(ingredientId)) drawIngredientIcon(ctx, ingredient.draw, px, py, 8, ingredient.color, ingredient.accent);
      });
      if (order.plateReady) {
        ctx.fillStyle = '#43a047';
        rr(ctx, table.x + table.w / 2 - 42, table.y - 30, 84, 20, 8); ctx.fill();
        text(ctx, 'READY!', table.x + table.w / 2, table.y - 19, 12, '#fff', 'bold', 'center');
      }
    }
  }

  // Sam the Guard patrols beside the door, waving at every arrival —
  // never in the doorway, so the entrance stays clear.
  const gx = state.guardX ?? ROOM.guardSpot.x;
  const gy = state.guardY ?? ROOM.guardSpot.y;
  const guardBob = state.guardGreet > 0 ? Math.sin(state.elapsed * 6) * 2 : 0;
  if (!drawSprite(ctx, 'sam-guard', gx, gy + guardBob, 56)) {
    drawGuard(ctx, gx, gy, 0.7, state.guardGreet > 0);
  }
  if (state.guardGreet > 0) {
    // His quiet lines are longer than a greeting, so wrap them.
    const glines = wrapText(`Sam: "${state.guardLine}"`, 34);
    const gh = 18 + glines.length * 13;
    drawSpeechBubble(ctx, gx, gy - 44, 210, gh, '#fff8e1');
    glines.forEach((line, i) => text(ctx, line, gx, gy - 44 - gh / 2 + 12 + i * 13, 11, '#5d4037', 'bold', 'center'));
  }

  // Head Chef AI in the kitchen, barking orders and cheering serves.
  if (!drawSprite(ctx, 'chef-ai', ROOM.chefSpot.x, ROOM.chefSpot.y, 56)) {
    drawKokiRobot(ctx, ROOM.chefSpot.x, ROOM.chefSpot.y, 0.7, state.koki.enabled);
  }
  const praise = state.kokiPraise && state.kokiPraise.timer > 0;
  const warning = state.koki.text && state.koki.text.startsWith('HURRY!');
  if (praise || warning) {
    const line = praise ? state.kokiPraise.text : state.koki.text;
    drawSpeechBubble(ctx, ROOM.chefSpot.x, ROOM.chefSpot.y - 44, 190, 30, praise ? '#e8f5e9' : '#ffebee');
    text(ctx, line.slice(0, 30), ROOM.chefSpot.x, ROOM.chefSpot.y - 44, 11, '#5d4037', 'bold', 'center');
  }

  // Customers: walking in, seated, eating, walking out.
  for (const order of state.orders) drawRoomCustomer(ctx, state, order);
  for (const gone of state.departing) drawRoomCustomer(ctx, state, gone);
  // Coin particles flying up from a served dish.
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffc107';
    ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
    ctx.fillStyle = '#ff8f00';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('C', p.x, p.y + 1);
    ctx.globalAlpha = 1;
  }

  drawMochi(ctx, state);
  drawPlayer(ctx, state);
}

// Windows: daylight and rain show through them, so the room feels open
// and airy. Six of them — four along the top wall, one on each side wall.
function drawWindows(ctx, state) {
  const clock = dayClock(state);
  const sky = clock.phase.id === 'morning' ? '#cfe8ff'
    : clock.phase.id === 'afternoon' ? '#8fd0ff'
    : clock.phase.id === 'evening' ? '#ffb36b' : '#232c52';
  for (const win of ROOM.windows) {
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(win.x - 3, win.y - 3, win.w + 6, win.h + 6);
    ctx.save();
    ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip();
    ctx.fillStyle = sky;
    ctx.fillRect(win.x, win.y, win.w, win.h);
    if (state.weather === 'sunny' && (clock.phase.id === 'morning' || clock.phase.id === 'afternoon')) {
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.arc(win.x + win.w - 18, win.y + 12, 8, 0, Math.PI * 2); ctx.fill();
    }
    if (clock.phase.id === 'night') {
      ctx.fillStyle = '#fff';
      for (let s = 0; s < 3; s++) {
        ctx.fillRect(win.x + 12 + s * 30, win.y + 8 + (s % 2) * 12, 2, 2);
      }
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath(); ctx.arc(win.x + win.w - 16, win.y + 12, 7, 0, Math.PI * 2); ctx.fill();
    }
    if (state.weather === 'rainy') {
      // Rain streaks outside the glass, falling past the window.
      ctx.strokeStyle = 'rgba(190, 210, 240, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const rx = win.x + ((i * 37 + state.elapsed * 160) % (win.w + 20)) - 10;
        const ry = win.y + ((i * 53 + state.elapsed * 320) % (win.h + 20)) - 10;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 3, ry + 10);
      }
      ctx.stroke();
    }
    ctx.restore();
    // Mullion + sill.
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(win.x + win.w / 2 - 2, win.y, 4, win.h);
    ctx.fillRect(win.x, win.y + win.h / 2 - 2, win.w, 4);
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(win.x - 4, win.y + win.h, win.w + 8, 6);
  }
  // Sun patch on the floor by the left window — Mochi's favourite spot.
  if (state.weather === 'sunny' && (clock.phase.id === 'morning' || clock.phase.id === 'afternoon')) {
    ctx.fillStyle = 'rgba(255, 220, 120, 0.28)';
    ctx.beginPath(); ctx.ellipse(ROOM.sunPatch.x, ROOM.sunPatch.y, ROOM.sunPatch.rx, ROOM.sunPatch.ry, 0, 0, Math.PI * 2); ctx.fill();
  } else if (state.weather === 'sunny' && clock.phase.id === 'evening') {
    ctx.fillStyle = 'rgba(255, 150, 60, 0.22)';
    ctx.beginPath(); ctx.ellipse(ROOM.sunPatch.x, ROOM.sunPatch.y, ROOM.sunPatch.rx, ROOM.sunPatch.ry, 0, 0, Math.PI * 2); ctx.fill();
  }
}

// The wall-mounted TV above the order board — always on Indonesian
// news. A small glowing screen, a red LIVE bug, and a ticker that
// scrolls the day's headlines along the bottom. It hangs on the wall,
// above the floor, so it never blocks movement or gameplay.
function drawTV(ctx, state) {
  const tv = ROOM.tv;
  const headline = NEWS_HEADLINES[state.tvHeadline % NEWS_HEADLINES.length];
  // Soft glow on the wall behind the set.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.10)';
  ctx.fillRect(tv.x - 6, tv.y - 6, tv.w + 12, tv.h + 12);
  // Frame + glowing screen.
  ctx.fillStyle = '#212121';
  rr(ctx, tv.x, tv.y, tv.w, tv.h, 4); ctx.fill();
  ctx.fillStyle = '#0d1b3e';
  rr(ctx, tv.x + 3, tv.y + 3, tv.w - 6, tv.h - 6, 3); ctx.fill();
  // LIVE bug, top-left of the screen.
  ctx.fillStyle = '#d32f2f';
  ctx.beginPath(); ctx.arc(tv.x + 12, tv.y + 11, 3, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'LIVE', tv.x + 19, tv.y + 11, 8, '#ff8a80', 'bold', 'left');
  // Ticker: the headline scrolls left along the bottom of the screen.
  ctx.save();
  ctx.beginPath(); ctx.rect(tv.x + 3, tv.y + 3, tv.w - 6, tv.h - 6); ctx.clip();
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(headline, tv.x + tv.w - state.tvOffset, tv.y + tv.h - 11);
  ctx.restore();
}

// The order board on the wall: every order at a glance, the day clock,
// and the weather. Walk up to it and press E to switch the active order.
function drawWallBoard(ctx, state) {
  const board = ROOM.board;
  ctx.fillStyle = '#5d4037';
  rr(ctx, board.x, board.y, board.w, board.h, 10); ctx.fill();
  ctx.fillStyle = '#fff8e1';
  rr(ctx, board.x + 6, board.y + 6, board.w - 12, board.h - 12, 8); ctx.fill();
  text(ctx, 'ORDER BOARD', board.x + 16, board.y + 20, 13, '#5d4037');
  const clock = dayClock(state);
  text(ctx, `Day ${state.day} · ${clock.text} · ${clock.phase.label} · ${WEATHERS[state.weather].label}`, board.x + 16, board.y + 38, 10, '#8d6e63', 'normal');
  for (let i = 0; i < 3; i++) {
    const y = board.y + 52 + i * 38;
    const order = state.orders[i];
    ctx.fillStyle = order ? '#fff' : 'rgba(0,0,0,0.05)';
    rr(ctx, board.x + 10, y, board.w - 20, 32, 6); ctx.fill();
    if (!order) {
      text(ctx, 'Waiting for a customer…', board.x + 20, y + 17, 10, '#bdbdbd', 'normal');
      continue;
    }
    const ratio = order.patience / order.patienceMax;
    text(ctx, order.customer.name, board.x + 20, y + 11, 11, '#333', 'bold');
    text(ctx, recipeById(order.recipeId).name.split(' (')[0], board.x + 20, y + 24, 10, '#b71c1c', 'normal');
    ctx.fillStyle = '#e0e0e0';
    rr(ctx, board.x + 150, y + 8, 66, 7, 3); ctx.fill();
    ctx.fillStyle = patienceColor(ratio);
    rr(ctx, board.x + 150, y + 8, 66 * Math.max(0, ratio), 7, 3); ctx.fill();
    if (order.critic) drawStar(ctx, board.x + board.w - 20, y + 24, 6, '#ffb300');
    if (!order.taken) text(ctx, 'NEW', board.x + 150, y + 24, 9, '#e65100', 'bold');
    else if (order.plateReady) text(ctx, 'READY', board.x + 150, y + 24, 9, '#2e7d32', 'bold');
    if (order.id === state.selectedOrderId) {
      ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 2;
      rr(ctx, board.x + 10, y, board.w - 20, 32, 6); ctx.stroke();
    }
  }
}

// One customer in the room: walking in, seated at their table, eating,
// or walking out. The real character sprite when it has loaded, the
// code-drawn face as fallback. Bubbles carry the order, the chat, and
// the mood — the player can SEE how they feel.
function drawRoomCustomer(ctx, state, order) {
  const type = order.customer.type || 'regular';
  const ratio = order.patience / order.patienceMax;
  const walking = order.walkState === 'entering' || order.walkState === 'leaving' || order.walkState === 'leavingAngry';
  const bob = walking ? Math.sin(order.walkPhase * 12) * 3 : 0;
  const fx = order.walkX;
  const fy = order.walkY + bob;
  const squash = order.walkState === 'seated' || order.walkState === 'eating' ? 0.94 : 1;
  const keys = customerSprites(order.customer);
  let drewSprite = false;
  if (keys.length === 1) {
    drewSprite = drawSprite(ctx, keys[0], fx, fy, type === 'ale' ? 58 : 52, squash);
  } else if (keys.length === 2) {
    const ok1 = drawSprite(ctx, keys[0], fx - 15, fy, 44, squash);
    const ok2 = drawSprite(ctx, keys[1], fx + 15, fy, 44, squash);
    drewSprite = ok1 && ok2;
  } else if (keys.length === 3) {
    // The Ayu family: mum and dad at the sides, little Nara in the
    // middle — smaller, because she is six.
    const ok1 = drawSprite(ctx, keys[0], fx - 26, fy, 42, squash);
    const ok2 = drawSprite(ctx, keys[1], fx + 26, fy, 42, squash);
    const ok3 = drawSprite(ctx, keys[2], fx, fy + 3, 34, squash);
    drewSprite = ok1 && ok2 && ok3;
  }
  if (!drewSprite) {
    const mood = moodFor(order, state);
    drawCustomerFace(ctx, order.customer, fx, fy - 6, type === 'ale' ? 26 : 22, mood);
    ctx.fillStyle = order.customer.shirt || '#8d6e63';
    rr(ctx, fx - 18, fy + 14, 36, 26, 8); ctx.fill();
  }

  const mood = moodFor(order, state);
  const seated = order.walkState === 'seated' || order.walkState === 'eating';
  // Chatter: one bubble, then the reply (both visible in the reply beat).
  const chatter = state.chatter;
  const isA = chatter && chatter.aId === order.id;
  const isB = chatter && chatter.bId === order.id;
  const talking = order.talkTimer > 0 && order.talkText;
  if (talking) {
    const lines = wrapText(order.talkText, 26);
    const h = 18 + lines.length * 13;
    drawSpeechBubble(ctx, fx, fy - 108, 180, h, '#fffde7');
    lines.forEach((line, i) => text(ctx, line, fx, fy - 108 - h / 2 + 12 + i * 13, 11, '#5d4037', 'normal', 'center'));
    drawMoodBadge(ctx, fx + 82, fy - 108 - h / 2 + 6, mood);
  } else if (chatter && (isA || (isB && chatter.step === 1))) {
    const line = isA ? chatter.lineA : chatter.lineB;
    const lines = wrapText(line, 26);
    const h = 18 + lines.length * 13;
    const alpha = isA && chatter.step === 1 ? 0.75 : 1;
    ctx.globalAlpha = alpha;
    drawSpeechBubble(ctx, fx, fy - 108, 180, h, '#fff');
    lines.forEach((l, i) => text(ctx, l, fx, fy - 108 - h / 2 + 12 + i * 13, 11, '#5d4037', 'normal', 'center'));
    ctx.globalAlpha = 1;
    drawMoodBadge(ctx, fx + 82, fy - 108 - h / 2 + 6, mood);
  }

  if (seated && !talking) {
    // Order bubble above the head: dish, patience, ingredient chips.
    const recipe = recipeById(order.recipeId);
    const bx = fx, by = fy - 66;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, bx - 78, by - 22, 156, 44, 10); ctx.fill();
    ctx.strokeStyle = order.id === state.selectedOrderId ? '#ff9800' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = order.id === state.selectedOrderId ? 3 : 1.5; ctx.stroke();
    text(ctx, recipe.name.split(' (')[0], bx, by - 12, 12, '#b71c1c', 'bold', 'center');
    ctx.fillStyle = '#e0e0e0';
    rr(ctx, bx - 60, by + 2, 120, 6, 3); ctx.fill();
    ctx.fillStyle = patienceColor(ratio);
    rr(ctx, bx - 60, by + 2, 120 * Math.max(0, ratio), 6, 3); ctx.fill();
    recipe.ingredients.forEach((ingredientId, index) => {
      const ingredient = ingredientById(ingredientId);
      const cx = bx - 52 + index * 26;
      const cy = by + 15;
      ctx.fillStyle = order.placed.includes(ingredientId) ? '#c8e6c9' : '#fff';
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = order.placed.includes(ingredientId) ? '#43a047' : '#bdbdbd';
      ctx.lineWidth = 1.5; ctx.stroke();
      drawIngredientIcon(ctx, ingredient.draw, cx, cy, 6, ingredient.color, ingredient.accent);
    });
    drawMoodBadge(ctx, bx + 70, by - 22, mood);
    if (order.critic) drawStar(ctx, bx - 70, by - 22, 7, '#ffb300');
  }
  if (order.seatedPop > 0) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(fx + 44, fy - 36, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, '!', fx + 44, fy - 35, 13, '#e65100', 'bold', 'center');
  }
  if (order.walkState === 'eating') {
    ctx.fillStyle = '#8d6e63';
    for (const [cx, cy] of [[-14, 14], [10, 18], [0, 24]]) {
      ctx.beginPath(); ctx.arc(fx + cx, fy + cy, 2, 0, Math.PI * 2); ctx.fill();
    }
    text(ctx, 'yum!', fx, fy - 44, 12, '#e65100', 'bold', 'center');
  }
}

// Mochi the cat: alive. He sits with a flicking tail, walks slowly with
// a bob, stretches, and curls up to sleep — breathing softly. On rainy
// days he sleeps by the window, watching the rain. A heart floats above
// him when he is petted or when a big tip lands.
function drawMochi(ctx, state) {
  const mochi = state.mochi;
  const x = mochi.x;
  const y = mochi.y + (mochi.state === 'walk' || mochi.state === 'follow' ? Math.sin(mochi.bobPhase * 2) * 2 : 0);
  const breathe = mochi.state === 'sleep' ? 1 + Math.sin(state.elapsed * 2) * 0.04 : 1;
  ctx.fillStyle = '#e65100';
  if (mochi.state === 'sleep') {
    // Curled up: a round ball, tail wrapped around, ears poking out.
    ctx.beginPath(); ctx.ellipse(x, y, 16 * breathe, 12 * breathe, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bf360c';
    ctx.beginPath(); ctx.arc(x - 12, y - 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 12, y - 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + 4, y + 6, 10, 0.2, Math.PI * 0.9); ctx.stroke();
    text(ctx, 'z', x + 18, y - 14, 11, '#8d6e63', 'bold', 'center');
  } else if (mochi.state === 'walk' || mochi.state === 'follow') {
    // Slow walk cycle: body, head, four little legs alternating.
    const step = Math.sin(mochi.bobPhase * 2) > 0 ? 2 : -2;
    ctx.beginPath(); ctx.ellipse(x, y, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14 * mochi.facing, y - 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bf360c';
    ctx.beginPath(); ctx.arc(x + 14 * mochi.facing - 5, y - 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 14 * mochi.facing + 5, y - 12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e65100';
    for (const lx of [-9, -3, 3, 9]) {
      ctx.fillRect(x + lx - 2, y + 6 + (Math.abs(lx) < 6 ? step : -step), 4, 6);
    }
    ctx.strokeStyle = '#bf360c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 2); ctx.quadraticCurveTo(x - 22, y - 12, x - 18, y - 18); ctx.stroke();
  } else {
    // Sitting: upright body, head, ears, tail flicking on the floor.
    ctx.beginPath(); ctx.ellipse(x, y + 4, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 12, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bf360c';
    ctx.beginPath(); ctx.moveTo(x - 7, y - 18); ctx.lineTo(x - 4, y - 26); ctx.lineTo(x - 1, y - 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 1, y - 18); ctx.lineTo(x + 4, y - 26); ctx.lineTo(x + 7, y - 18); ctx.closePath(); ctx.fill();
    // Tail flick: the tip swings with the tail phase.
    const flick = Math.sin(mochi.tailPhase * 2) * 6;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + 10, y + 12);
    ctx.quadraticCurveTo(x + 22, y + 10, x + 24, y + 2 + flick);
    ctx.stroke();
    // Ear twitch now and then.
    if ((state.elapsed * 1.3) % 5 < 0.3) {
      ctx.fillStyle = '#bf360c';
      ctx.beginPath(); ctx.moveTo(x + 1, y - 18); ctx.lineTo(x + 6, y - 28); ctx.lineTo(x + 9, y - 18); ctx.closePath(); ctx.fill();
    }
  }
  if (mochi.heartTimer > 0) {
    const hy = y - 30 - Math.sin(state.elapsed * 3) * 2;
    ctx.fillStyle = '#e91e63';
    ctx.beginPath();
    ctx.arc(x - 4, hy, 4, 0, Math.PI * 2);
    ctx.arc(x + 4, hy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, hy + 1); ctx.lineTo(x, hy + 9); ctx.lineTo(x + 8, hy + 1); ctx.closePath(); ctx.fill();
  }
}

// Bu Rani, the player: her real sprite, flipped when she walks left,
// bobbing as she walks. The prompt floats above her when she can
// interact, and she smiles when a customer is happy.
function drawPlayer(ctx, state) {
  const p = state.player;
  const bob = p.moving ? Math.sin(p.bobPhase) * 2 : 0;
  const y = p.y + bob;
  const img = spriteFor('bu-rani');
  if (img) {
    const h = 64;
    const w = (h * img.naturalWidth) / img.naturalHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    ctx.translate(p.x, y);
    ctx.scale(p.facing, 1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  } else {
    drawChef(ctx, p.x, y, 0.8, state.chefMood);
  }
  // Shadow under her feet, so she sits in the room.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 30, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (state.chefMood === 'happy' && state.chefMoodTimer > 0) {
    drawMoodBadge(ctx, p.x + 24, y - 44, 'happy');
  }
  const it = nearestInteractable(state);
  if (it) {
    const label = `E — ${it.label}`;
    const w = 16 + label.length * 7.5;
    drawSpeechBubble(ctx, p.x, y - 58, w, 26, '#fffde7');
    text(ctx, label, p.x, y - 58, 12, '#5d4037', 'bold', 'center');
  }
}

// The bottom HUD: what is on Rani's plate, and what the warung is
// saying — Head Chef AI's hint first, then the message bar.
function drawBottomHud(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 668, CANVAS_W, 52);
  const order = selectedOrder(state);
  if (order && order.taken) {
    const recipe = recipeById(order.recipeId);
    text(ctx, `PLATE — ${recipe.name.split(' (')[0]} ${order.placed.length}/${recipe.ingredients.length}`, 16, 688, 13, '#ffca28', 'bold');
    recipe.ingredients.forEach((ingredientId, index) => {
      const ingredient = ingredientById(ingredientId);
      const cx = 16 + index * 26 + 13;
      if (order.placed.includes(ingredientId)) drawIngredientIcon(ctx, ingredient.draw, cx, 706, 7, ingredient.color, ingredient.accent);
      else {
        ctx.strokeStyle = '#bdbdbd'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, 706, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  } else {
    text(ctx, 'PLATE — walk to a table and take an order', 16, 688, 13, '#ffca28', 'bold');
  }
  const hint = state.koki.text || (state.messageTimer > 0 ? state.message : 'WASD / arrows or tap to move • E to interact • M sound • P pause');
  text(ctx, hint.slice(0, 90), 16, 710, 12, '#fff', 'normal');
  text(ctx, `Day ${state.day} • Served ${state.served} • 3-star target: ${STAR_THRESHOLDS[2]} points`, 1264, 688, 12, '#ffca28', 'normal', 'right');
  text(ctx, 'No ads • No purchases • No lives • Offline', 1264, 710, 12, '#fff', 'normal', 'right');
}

function drawIntroPanel(ctx, state) {
  // THE ONE opening name-story panel: the whole warung-name story, in
  // one short skippable panel shown once before the title screen. The
  // game stays a cooking game first — no other story scenes anywhere.
  ctx.fillStyle = '#2b1a12';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Pixel sunset: blocky sun over a dithered orange sky, warung roofline.
  ctx.fillStyle = '#ff8f00';
  ctx.fillRect(0, 0, CANVAS_W, 300);
  ctx.fillStyle = '#ffb300';
  for (let row = 0; row < 6; row++) {
    for (let x = 0; x < CANVAS_W; x += 16) {
      if ((x / 16 + row) % 2 === 0) ctx.fillRect(x, 120 + row * 16, 8, 8);
    }
  }
  ctx.fillStyle = '#ffca28';
  ctx.fillRect(600, 60, 80, 80);
  ctx.fillStyle = '#fff176';
  ctx.fillRect(616, 76, 48, 48);
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(0, 300, CANVAS_W, 24);
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x, 300, 32, 24);
  }
  // The panel card.
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 240, 360, 800, 240, 16); ctx.fill();
  ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'THE LAST WOK', 640, 400, 40, '#b71c1c', 'bold', 'center');
  text(ctx, 'One night, Rani\u2019s little warung burned down.', 640, 448, 17, '#5d4037', 'normal', 'center');
  text(ctx, 'Everything was lost \u2014 except one wok, still warm in the ashes.', 640, 474, 17, '#5d4037', 'normal', 'center');
  text(ctx, 'She lit it again. Every dish since is a thank-you.', 640, 500, 17, '#5d4037', 'normal', 'center');
  drawMenuButton(ctx, state, 'skip-intro', 540, 528, 200, 52, 'SKIP', 'or press Enter');
}

function drawTitleScreen(ctx, state) {
  ctx.fillStyle = 'rgba(60,20,10,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 190, 60, 900, 600, 20); ctx.fill();
  // Pixel sunset band inside the top of the title card.
  ctx.fillStyle = '#ff8f00';
  ctx.fillRect(206, 72, 868, 28);
  ctx.fillStyle = '#ffca28';
  for (let x = 206; x < 1074; x += 16) {
    if ((x / 16) % 2 === 0) ctx.fillRect(x, 84, 8, 8);
  }
  ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 4; ctx.stroke();
  text(ctx, 'THE LAST WOK', 640, 130, 64, '#b71c1c', 'bold', 'center');
  text(ctx, '"The wok that refused to go out."', 640, 172, 22, '#e65100', 'bold', 'center');
  text(ctx, 'A pixel-art warung cooking game. Read the orders, then cook!', 640, 212, 16, '#5d4037', 'normal', 'center');
  if (!drawSprite(ctx, 'bu-rani', 560, 282, 100)) drawChef(ctx, 560, 300, 1.2, 'happy');
  if (!drawSprite(ctx, 'chef-ai', 720, 282, 100)) drawKokiRobot(ctx, 720, 300, 1.2, true);
  text(ctx, 'Chef Rani & Head Chef AI, your clever sous-chef', 640, 340, 14, '#1565c0', 'normal', 'center');
  // Straight to the cooking: pick a mode and play. No forced reading —
  // the story lives in one tagline and the customers' one-line backgrounds.
  drawMenuButton(ctx, state, 'mode-rush', 290, 380, 330, 64, 'RUSH MODE', '150-second shift, chase 3 stars');
  drawMenuButton(ctx, state, 'mode-santai', 660, 380, 330, 64, 'CHILL MODE', 'No timer, no failing');
  drawMenuButton(ctx, state, 'tutorial', 470, 460, 340, 48, 'HOW TO PLAY', '30-second tutorial');
  text(ctx, 'No ads  •  No in-app purchases  •  No lives  •  All upgrades from coins  •  Offline', 640, 540, 14, '#2e7d32', 'bold', 'center');
  text(ctx, '12 warung dishes — restock at the Morning Market after each day.', 640, 568, 13, '#757575', 'normal', 'center');
  text(ctx, `Today: ${WEATHERS[state.weather].label} — ${WEATHERS[state.weather].line}`, 640, 592, 13, '#1565c0', 'bold', 'center');
  text(ctx, 'WASD / arrows or tap to move • E to interact and talk • M sound • P pause', 640, 614, 13, '#757575', 'normal', 'center');
  text(ctx, 'Ale is inspired by "Seporsi Mie Ayam Sebelum Mati" by Brian Khrisna (Grasindo, 2025).', 640, 632, 11, '#9e9e9e', 'normal', 'center');
  text(ctx, 'Made for make.fun — @farhat-gt', 640, 650, 12, '#9e9e9e', 'normal', 'center');
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
  text(ctx, `Day ${state.day} done — the warung closes at 2 AM. Restock before tomorrow!`, 640, 320, 14, '#5d4037', 'normal', 'center');
  if (state.achievements && state.achievements.size) {
    text(ctx, 'Achievements: ' + [...state.achievements].join(' • '), 640, 342, 14, '#e65100', 'bold', 'center');
  }
  text(ctx, 'UPGRADE SHOP — buy with coins (no real money):', 640, 362, 15, '#b71c1c', 'bold', 'center');
  UPGRADES.forEach((upgrade, index) => {
    const x = 280 + index * 190;
    const y = 382;
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
  text(ctx, 'Warung decor (free, pick a wall color):', 640, 506, 14, '#5d4037', 'bold', 'center');
  DECOR.forEach((decor, index) => {
    const x = 440 + index * 100;
    const y = 520;
    ctx.fillStyle = decor.color;
    rr(ctx, x, y, 84, 36, 8); ctx.fill();
    ctx.strokeStyle = state.decorId === decor.id ? '#b71c1c' : '#bdbdbd'; ctx.lineWidth = state.decorId === decor.id ? 4 : 2; ctx.stroke();
    text(ctx, decor.name, x + 42, y + 52, 11, '#5d4037', 'normal', 'center');
    state.ui.buttons.push({ id: `decor-${decor.id}`, x, y, w: 84, h: 36 });
  });
  drawMenuButton(ctx, state, 'play-again', 300, 592, 220, 56, 'PLAY AGAIN', 'A new shift, free, no waiting');
  drawMenuButton(ctx, state, 'market', 530, 592, 220, 56, 'MORNING MARKET', 'Buy ingredients, hire help');
  drawMenuButton(ctx, state, 'change-mode', 760, 592, 220, 56, 'CHANGE MODE', 'Rush or Chill');
}

// The Morning Market (v4): between days, buy ingredients for coins,
// hire Head Chef AI for the day, buy kitchen upgrades, pick decor.
// Stock carries over — an empty pantry cannot cook that dish.
function drawMarketScreen(ctx, state) {
  ctx.fillStyle = '#fff8e1';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#6d4c41';
  ctx.fillRect(0, 0, CANVAS_W, 56);
  text(ctx, 'MORNING MARKET', 16, 28, 26, '#fff8e1');
  text(ctx, `Day ${state.day + 1} — stock up before opening (open until 2 AM)`, 330, 28, 15, '#ffca28', 'normal');
  text(ctx, `Coins ${state.coins}`, 1264, 28, 18, '#ffca28', 'bold', 'right');
  text(ctx, 'Buy ingredients for tomorrow — an empty pantry cannot cook that dish.', 16, 76, 13, '#5d4037', 'normal');
  // Today's market deal: one ingredient is half price or double price.
  if (state.marketDeal) {
    const dealItem = ingredientById(state.marketDeal.id);
    const dealText = state.marketDeal.mult < 1
      ? `TODAY'S DEAL: ${dealItem.name} HALF PRICE — ${marketPrice(state, dealItem.id)} coin${marketPrice(state, dealItem.id) === 1 ? '' : 's'} each!`
      : `TODAY: ${dealItem.name} costs DOUBLE — ${marketPrice(state, dealItem.id)} coins each!`;
    text(ctx, dealText, 1264, 76, 13, '#e65100', 'bold', 'right');
  }

  // 13 ingredients in 6 columns = 3 rows; the rows are kept short so the
  // third row (Satay) stays visible above the Hire card below.
  INGREDIENTS.forEach((ingredient, index) => {
    const col = index % 6, row = Math.floor(index / 6);
    const x = 16 + col * 208, y = 88 + row * 88, w = 200, h = 80;
    const stock = state.stock[ingredient.id] || 0;
    const price = marketPrice(state, ingredient.id);
    const isDeal = state.marketDeal && state.marketDeal.id === ingredient.id;
    const afford1 = state.coins >= price;
    const afford5 = state.coins >= price * 5;
    ctx.fillStyle = '#fff';
    rr(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = isDeal ? '#e65100' : '#bdbdbd'; ctx.lineWidth = isDeal ? 3 : 2; ctx.stroke();
    drawIngredientIcon(ctx, ingredient.draw, x + 30, y + 43, 20, ingredient.color, ingredient.accent);
    text(ctx, ingredient.name, x + 58, y + 20, 13, '#333', 'bold');
    text(ctx, isDeal ? `${price} coins each — DEAL!` : `${price} coins each`, x + 58, y + 40, 11, isDeal ? '#e65100' : '#757575', isDeal ? 'bold' : 'normal');
    text(ctx, `Stock ×${stock}`, x + 58, y + 58, 12, stock <= 2 ? '#e65100' : '#2e7d32', 'bold');
    drawMarketBuyButton(ctx, state, `buy-${ingredient.id}-1`, x + 138, y + 48, 28, 28, '+1', afford1);
    drawMarketBuyButton(ctx, state, `buy-${ingredient.id}-5`, x + 170, y + 48, 28, 28, '+5', afford5);
  });

  // Hire Head Chef AI for the day: auto-cooks the busiest station.
  const hy = 356;
  ctx.fillStyle = state.kokiHired ? '#c8e6c9' : '#e3f2fd';
  rr(ctx, 16, hy, 400, 108, 12); ctx.fill();
  ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2; ctx.stroke();
  if (!drawSprite(ctx, 'chef-ai', 56, hy + 42, 72)) drawKokiRobot(ctx, 56, hy + 42, 0.9, true);
  text(ctx, 'HIRE HEAD CHEF AI', 96, hy + 24, 16, '#1565c0');
  text(ctx, 'Auto-cooks one station all day.', 96, hy + 46, 12, '#546e7a', 'normal');
  text(ctx, state.kokiHired ? 'HIRED for tomorrow!' : `${HIRE_COST} coins / day`, 96, hy + 70, 13, state.kokiHired ? '#2e7d32' : '#e65100', 'bold');
  if (!state.kokiHired) {
    drawMarketBuyButton(ctx, state, 'hire-koki', 300, hy + 62, 96, 32, 'HIRE', state.coins >= HIRE_COST);
  }

  // Kitchen upgrades, right of the hire card.
  text(ctx, 'KITCHEN UPGRADES — buy with coins:', 448, hy + 16, 14, '#b71c1c');
  UPGRADES.forEach((upgrade, index) => {
    const x = 448 + index * 198, y = hy + 28;
    const owned = state.upgradesOwned.has(upgrade.id);
    const afford = state.coins >= upgrade.cost;
    ctx.fillStyle = owned ? '#c8e6c9' : afford ? '#fff' : '#eeeeee';
    rr(ctx, x, y, 190, 80, 10); ctx.fill();
    ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, upgrade.name, x + 95, y + 20, 13, '#333', 'bold', 'center');
    text(ctx, upgrade.desc, x + 95, y + 40, 11, '#757575', 'normal', 'center');
    text(ctx, owned ? 'OWNED' : `${upgrade.cost} coins`, x + 95, y + 62, 13, owned ? '#2e7d32' : '#e65100', 'bold', 'center');
    if (!owned) state.ui.buttons.push({ id: `upgrade-${upgrade.id}`, x, y, w: 190, h: 80 });
  });

  text(ctx, 'Warung decor (free, pick a wall color):', 16, 476, 14, '#5d4037', 'bold');
  DECOR.forEach((decor, index) => {
    const x = 16 + index * 100;
    const y = 488;
    ctx.fillStyle = decor.color;
    rr(ctx, x, y, 84, 36, 8); ctx.fill();
    ctx.strokeStyle = state.decorId === decor.id ? '#b71c1c' : '#bdbdbd'; ctx.lineWidth = state.decorId === decor.id ? 4 : 2; ctx.stroke();
    text(ctx, decor.name, x + 42, y + 52, 11, '#5d4037', 'normal', 'center');
    state.ui.buttons.push({ id: `decor-${decor.id}`, x, y, w: 84, h: 36 });
  });

  drawMenuButton(ctx, state, 'start-day', 440, 576, 400, 56, `START DAY ${state.day + 1}`, 'Open the warung — until 2 AM');
  drawMenuButton(ctx, state, 'back-results', 440, 644, 400, 44, 'BACK TO RESULTS', '');
}

function drawMarketBuyButton(ctx, state, id, x, y, w, h, label, afford) {
  ctx.fillStyle = afford ? '#e65100' : '#bdbdbd';
  rr(ctx, x, y, w, h, 6); ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 + 1, 13, '#fff', 'bold', 'center');
  state.ui.buttons.push({ id, x, y, w, h });
}

function drawUpgradeScreen(ctx, state) {
  drawResultsScreen(ctx, state);
}

function drawTutorialOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e1';
  rr(ctx, 340, 90, 600, 500, 16); ctx.fill();
  text(ctx, 'HOW TO PLAY — 30 SECONDS', 640, 130, 26, '#b71c1c', 'bold', 'center');
  const steps = [
    ['1', 'Walk with WASD / arrow keys, or tap anywhere to walk there.'],
    ['2', 'Walk to a table and press E to take the customer\'s order.'],
    ['3', 'Walk to the Wok, Chopping Board or Grill and press E to cook — finished food lands straight on the plate.'],
    ['4', 'Full plate? Walk back to the table and press E to serve. Head Chef AI suggests the best next step.'],
    ['5', 'Rush: serve before the day ends at 2 AM. Chill: no timer, no failing.'],
    ['6', 'Ingredients run out — restock them at the Morning Market after each day.'],
    ['7', 'Talk to customers, pet Mochi the cat, and watch the weather change.'],
  ];
  steps.forEach(([number, line], index) => {
    const y = 176 + index * 44;
    ctx.fillStyle = '#e65100';
    ctx.beginPath(); ctx.arc(390, y, 18, 0, Math.PI * 2); ctx.fill();
    text(ctx, number, 390, y + 1, 16, '#fff', 'bold', 'center');
    text(ctx, line, 420, y + 1, 14, '#333', 'normal');
  });
  drawMenuButton(ctx, state, 'close-tutorial', 470, 490, 340, 52, 'START COOKING', 'Close tutorial');
}

function drawPausedOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', 640, 340, 48, '#fff', 'bold', 'center');
  text(ctx, 'Press P or the Resume button to keep playing', 640, 390, 16, '#fff', 'normal', 'center');
}
