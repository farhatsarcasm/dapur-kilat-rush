// The Last Wok — Head Chef AI, the strict head chef.
// A visible, rule-based in-game AI agent: no network, no API calls, no
// external model. It reads the order tickets, their patience, the prep
// stations and the plate, then suggests the single most urgent next step.
// He is STRICT: he barks when patience runs low, praises a fast serve,
// and warns about the grumpy customer. Toggle with K or the button.
// In Santai mode he also lists the full recipe sequence.

import { recipeById, ingredientById } from './config.js';

export function createKoki() {
  return {
    enabled: true,
    text: '',
    target: null, // { kind: 'ingredient'|'plate'|'order'|'station', id }
    sequence: [],
  };
}

// Pick the order in the most trouble: lowest patience ratio first.
export function mostUrgentOrder(state) {
  if (!state.orders.length) return null;
  let best = state.orders[0];
  for (const order of state.orders) {
    if (order.patience / order.patienceMax < best.patience / best.patienceMax) best = order;
  }
  return best;
}

export function updateKoki(state) {
  const koki = state.koki;
  if (!koki.enabled || state.screen !== 'playing') {
    koki.text = '';
    koki.target = null;
    koki.sequence = [];
    return;
  }
  // Chef AI cheers a good serve first — praise beats the next instruction.
  if (state.kokiPraise && state.kokiPraise.timer > 0) {
    koki.text = state.kokiPraise.text;
    koki.target = { kind: 'plate' };
    koki.sequence = [];
    return;
  }
  const order = selectedOrderForKoki(state);
  if (!order) {
    koki.text = 'Ready to help! New orders are coming soon.';
    koki.target = null;
    koki.sequence = [];
    return;
  }
  const recipe = recipeById(order.recipeId);
  const missing = recipe.ingredients.filter((id) => !order.placed.includes(id));
  const urgency = order.patience / order.patienceMax;
  const customer = order.customer.name;
  const isGrumpy = order.customer.type === 'grumpy';
  // Strict head chef: praise when the kitchen is fast, bark when a
  // customer is about to walk out, and always warn about the grumpy one.
  const praise = state.combo >= 3 ? 'Great, keep it up! ' : '';
  const scold = urgency < 0.35 ? `HURRY! ${customer} is waiting! ` : '';
  const grumpyWarn = isGrumpy ? 'Careful, that customer is grumpy! ' : '';

  // In Santai mode, show the whole remaining sequence.
  if (state.mode === 'santai') {
    koki.sequence = missing.map((id) => ingredientById(id).name);
  } else {
    koki.sequence = [];
  }

  if (missing.length === 0) {
    koki.text = `${praise}The ${recipe.name} plate is complete — serve it NOW, don't just stand there!`;
    koki.target = { kind: 'plate' };
    return;
  }
  const nextId = missing[0];
  const next = ingredientById(nextId);
  const inPrep = state.prepSlots.wajan.some((p) => p.ingredientId === nextId)
    || state.prepSlots.talenan.some((p) => p.ingredientId === nextId)
    || state.prepSlots.grill.some((p) => p.ingredientId === nextId);

  if (inPrep) {
    // While it cooks, point at the next missing ingredient instead.
    const later = missing.find((id) => id !== nextId
      && !state.prepSlots.wajan.some((p) => p.ingredientId === id)
      && !state.prepSlots.talenan.some((p) => p.ingredientId === id)
      && !state.prepSlots.grill.some((p) => p.ingredientId === id));
    if (later) {
      const laterIngredient = ingredientById(later);
      koki.text = `${next.name} is cooking — get ${laterIngredient.name} ready too, don't just stand around!`;
      koki.target = { kind: 'ingredient', id: later };
      return;
    }
    koki.text = `${next.name} is cooking, wait a moment…`;
    koki.target = { kind: 'station', id: next.station };
    return;
  }
  const stationName = next.station === 'wajan' ? 'wok' : next.station === 'grill' ? 'grill' : 'chopping board';
  koki.text = `${scold}${grumpyWarn}Cook ${next.name} in the ${stationName} first! Move!`;
  koki.target = { kind: 'ingredient', id: nextId };
}

function selectedOrderForKoki(state) {
  const selected = state.orders.find((order) => order.id === state.selectedOrderId);
  if (selected && selected.taken) return selected;
  // Prefer a taken order in trouble; an untaken order cannot be cooked
  // for yet, so it only counts if nothing is taken.
  const taken = state.orders.filter((order) => order.taken);
  if (taken.length) return mostUrgentOrder({ orders: taken });
  return mostUrgentOrder(state);
}
