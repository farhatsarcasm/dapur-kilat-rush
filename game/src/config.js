// Dapur Kilat — Warung Rush: configuration.
// Original Indonesian warung cooking game. No ads, no in-app purchases,
// no lives, no energy: every upgrade is earned with coins from serving food.
// Two modes: Rush (timed shift, scored) and Chill (no timer, no fail).

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;

// Stars are earned by skill alone: serve fast, keep combos alive.
export const STAR_THRESHOLDS = [600, 1000, 1400];

// Difficulty ramps gently: patience and spawn rate change slowly across
// the shift, never a sudden wall. Early orders use only the first recipes.
export const DIFFICULTY = {
  patienceStart: 48,
  patienceEnd: 32,
  spawnStart: 13,
  spawnEnd: 8,
  unlockAllAt: 45,
};

export const INGREDIENTS = [
  { id: 'nasi',   name: 'Rice',   key: '1', station: 'wajan',   prepSeconds: 2.2, color: '#fff3d6', accent: '#d9a441', draw: 'rice' },
  { id: 'mie',    name: 'Noodles',    key: '2', station: 'wajan',   prepSeconds: 2.4, color: '#ffe9a8', accent: '#c98a1b', draw: 'noodle' },
  { id: 'ayam',   name: 'Chicken',   key: '3', station: 'wajan',   prepSeconds: 3.0, color: '#f2b879', accent: '#a35a1e', draw: 'chicken' },
  { id: 'telur',  name: 'Egg',  key: '4', station: 'wajan',   prepSeconds: 2.0, color: '#fff8e1', accent: '#e0a800', draw: 'egg' },
  { id: 'cabai',  name: 'Chili',  key: '5', station: 'talenan', prepSeconds: 1.6, color: '#ff6b5e', accent: '#b31d12', draw: 'chili' },
  { id: 'sawi',   name: 'Greens',   key: '6', station: 'talenan', prepSeconds: 1.6, color: '#7bc96f', accent: '#2f7d32', draw: 'veg' },
  { id: 'tahu',   name: 'Tofu',   key: '7', station: 'talenan', prepSeconds: 1.8, color: '#fdf6d8', accent: '#b5892e', draw: 'tofu' },
  { id: 'bawang', name: 'Onion', key: '8', station: 'talenan', prepSeconds: 1.4, color: '#f3d9f2', accent: '#8e44ad', draw: 'onion' },
  { id: 'bakso',  name: 'Meatballs',  key: '9', station: 'wajan',   prepSeconds: 2.6, color: '#d9a066', accent: '#8d5a2b', draw: 'meatball' },
  { id: 'teh',    name: 'Iced Tea', key: '0', station: 'wajan',   prepSeconds: 1.8, color: '#e8a33d', accent: '#7a4a00', draw: 'tea' },
];

export const STATIONS = {
  wajan:   { name: 'Wok',   icon: 'wok',  color: '#3d3d3d' },
  talenan: { name: 'Chopping Board', icon: 'board', color: '#b08954' },
};

// Seven original warung dishes. Each one is four ingredients, mixed
// chop/cook steps, so every order asks for a different route. Es Teh (Sweet Iced Tea)
// is a one-item drink order: a quick win between the big dishes.
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng (Fried Rice)', price: 18,
    ingredients: ['nasi', 'telur', 'cabai', 'ayam'],
    blurb: 'Rice, egg, chili, chicken — a warung classic.',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam (Chicken Noodles)', price: 16,
    ingredients: ['mie', 'ayam', 'sawi', 'bawang'],
    blurb: 'Springy noodles, savory chicken, fresh greens.',
  },
  {
    id: 'gado-gado', name: 'Gado-Gado (Veggie Salad)', price: 15,
    ingredients: ['sawi', 'tahu', 'telur', 'bawang'],
    blurb: 'Greens, tofu, egg — fresh and healthy.',
  },
  {
    id: 'tahu-telur', name: 'Tahu Telur (Tofu Omelette)', price: 14,
    ingredients: ['tahu', 'telur', 'sawi', 'bawang'],
    blurb: 'Crispy tofu omelette, fresh greens.',
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng (Fried Noodles)', price: 17,
    ingredients: ['mie', 'telur', 'cabai', 'sawi'],
    blurb: 'Spicy-sweet noodles, fried egg.',
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam (Chicken Satay)', price: 19,
    ingredients: ['ayam', 'cabai', 'bawang', 'tahu'],
    blurb: 'Grilled satay, chili sauce, grilled tofu.',
  },
  {
    id: 'ayam-geprek', name: 'Ayam Geprek (Smashed Chicken)', price: 18,
    ingredients: ['ayam', 'cabai', 'sawi', 'bawang'],
    blurb: 'Spicy smashed chicken, fresh greens.',
  },
  {
    id: 'bakso-kuah', name: 'Bakso (Meatball Soup)', price: 16,
    ingredients: ['bakso', 'sawi', 'bawang', 'tahu'],
    blurb: 'Hot meatball soup, greens and tofu.',
  },
  {
    id: 'es-teh', name: 'Es Teh (Sweet Iced Tea)', price: 8,
    ingredients: ['teh'],
    blurb: 'Sweet iced tea — quick to serve.',
  },
];

// The warung's regulars — each customer type is a character with a life,
// not a faceless ticket. Distinct patience speed, tip behaviour and lines:
// the young group laughs and tips well, the old couple is slow and calm,
// the grumpy customer drains patience fast, complains, and tips little —
// but serving him on time is a rare achievement.
export const CUSTOMER_TYPES = {
  group: {
    label: 'Young Group', patienceRate: 1.0, tipRate: 1.3,
    lines: ['haha, so tasty!', 'Coming back tomorrow!', 'Hey, try the satay!', 'Photo first, then eat!'],
  },
  couple: {
    label: 'Old Couple', patienceRate: 0.65, tipRate: 1.2,
    lines: ['The food is warm, dear.', 'Such a calm place.', 'We used to come here all the time…', 'Take it slow, dear.'],
  },
  grumpy: {
    label: 'Grumpy Customer', patienceRate: 1.7, tipRate: 0.4,
    lines: ['So slow!', 'This is cold!', 'I do not like this!', 'A bit faster!', 'Hmm… not bad.'],
  },
  regular: {
    label: 'Regular', patienceRate: 1.0, tipRate: 1.0,
    lines: ['The usual, please.', 'It smells amazing.', 'I am starving!', 'Thank you, Bu Rani!'],
  },
};

export const CUSTOMERS = [
  { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' },
  { name: 'Sinta & Bimo', type: 'group', skin: '#e8b48a', shirt: '#c2185b' },
  { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' },
  { name: 'Mr Grumpy', type: 'grumpy', skin: '#e8b48a', shirt: '#37474f' },
  { name: 'Mrs Grumpy', type: 'grumpy', skin: '#f2c89b', shirt: '#4e342e' },
  { name: 'Mr Budi', type: 'regular', skin: '#f2c89b', shirt: '#2e7d32' },
  { name: 'Miss Sari', type: 'regular', skin: '#e8b48a', shirt: '#c2185b' },
  { name: 'Mr Joko', type: 'regular', skin: '#d9a066', shirt: '#1565c0' },
  { name: 'Mrs Ani', type: 'regular', skin: '#f2c89b', shirt: '#ef6c00' },
  { name: 'Rian', type: 'regular', skin: '#e8b48a', shirt: '#6a1b9a' },
  { name: 'Dewi', type: 'regular', skin: '#d9a066', shirt: '#00838f' },
];

// Sam the Guard, the smiling security guard at the door, greets every
// arriving customer. The sleeping cat lives in the chef corner.
export const GUARD_GREETINGS = ['Welcome in!', 'Come on in, sir!', 'Enjoy your lunch!'];
export const GUARD_NAME = 'Sam the Guard';

// Upgrades are bought with coins earned in-game only. No ads, no gems,
// no real money anywhere in this game.
export const UPGRADES = [
  { id: 'pisau',  name: 'Sharp Knife',    desc: 'Chop 30% faster', cost: 60, apply: 'chopSpeed' },
  { id: 'wajan',  name: 'Non-Stick Wok', desc: 'Cook 30% faster', cost: 60, apply: 'cookSpeed' },
  { id: 'senyum', name: 'Happy Customers', desc: 'Customer patience +25%', cost: 80, apply: 'patience' },
  { id: 'kompor', name: 'Double Burner', desc: 'Cook 2 items at once', cost: 120, apply: 'doubleCook' },
];

export const DECOR = [
  { id: 'kuning', name: 'Yellow Walls', color: '#ffd54f' },
  { id: 'hijau',  name: 'Green Walls',  color: '#a5d6a7' },
  { id: 'biru',   name: 'Blue Walls',   color: '#90caf9' },
  { id: 'merah',  name: 'Red Walls',  color: '#ef9a9a' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

export function recipeById(id) {
  return RECIPES.find((dish) => dish.id === id);
}

export function recipeAt(elapsedSeconds) {
  // Early orders stay gentle: only the first three dishes appear, and the
  // one-item Es Teh order can show up any time as a quick win.
  if (Math.random() < 0.12) return RECIPES[RECIPES.length - 1];
  const pool = elapsedSeconds < DIFFICULTY.unlockAllAt ? RECIPES.slice(0, 3) : RECIPES;
  return pool[Math.floor(Math.random() * pool.length)];
}
