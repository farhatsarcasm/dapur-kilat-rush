// The Last Wok: configuration.
// Original Indonesian warung cooking game. No ads, no in-app purchases,
// no lives, no energy: every upgrade is earned with coins from serving food.
// Two modes: Rush (timed shift, scored) and Chill (no timer, no fail).

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;

// WALKABLE WARUNG (top-down, A Space for the Unbound style): the player
// is Bu Rani, walking around one big, open warung room. WASD / arrows
// or tap to move; walk up to a station, a table or the order board and
// press E. The kitchen counter runs along the top wall, the door is
// top-right (customers walk in from it), three tables fill the dining
// room, and windows line the walls — daylight and rain show through
// them, so the room feels open and airy.
export const PLAYER_SPEED = 240;
export const CUSTOMER_WALK_SPEED = 160;
export const INTERACT_RANGE = 76;
export const ROOM = {
  floor: { x: 16, y: 96, w: 1248, h: 572 },
  counter: { x: 300, y: 100, w: 800, h: 60 },
  board: { x: 20, y: 100, w: 240, h: 170 },
  door: { x: 1160, y: 56, w: 100, h: 48 },
  doorSpawn: { x: 1210, y: 96 },
  // Wall-mounted TV above the order board — always on Indonesian news.
  // It hangs on the wall, above the floor, so it never blocks movement.
  tv: { x: 28, y: 57, w: 234, h: 38 },
  corridorY: 200,
  playerSpawn: { x: 640, y: 600 },
  // Sam the Guard patrols a small loop BESIDE the door — never in the
  // doorway. The door is x1160-1260, the entrance lane is x1210 and
  // the corridor is y200; the loop stays in the free gap between the
  // counter end (x1100) and the door, clear of both, so customers
  // always walk in freely and the door stays visibly open.
  guardSpot: { x: 1128, y: 146 },
  guardPatrol: [
    { x: 1112, y: 128 },
    { x: 1144, y: 128 },
    { x: 1144, y: 164 },
    { x: 1112, y: 164 },
  ],
  guardPatrolSpeed: 16,
  // Six windows: four along the top wall, one tall window on each side
  // wall. The left window has a sunny ledge — Mochi the cat's spot.
  windows: [
    { x: 320, y: 60, w: 120, h: 36 },
    { x: 560, y: 60, w: 120, h: 36 },
    { x: 800, y: 60, w: 120, h: 36 },
    { x: 1020, y: 60, w: 120, h: 36 },
    { x: 20, y: 300, w: 56, h: 120 },
    { x: 1204, y: 300, w: 56, h: 120 },
  ],
  // Mochi's window seat: the floor by the tall left window, where the
  // sun falls in the morning and where he curls up to watch the rain.
  windowSeat: { x: 112, y: 436 },
  sunPatch: { x: 112, y: 436, rx: 84, ry: 28 },
  // Head Chef AI stands in the kitchen, by the grill, barking orders.
  chefSpot: { x: 1060, y: 240 },
  stations: {
    talenan: { id: 'talenan', x: 320, y: 100, w: 200, h: 60, label: 'CHOPPING BOARD', approach: { x: 420, y: 192 } },
    wajan: { id: 'wajan', x: 560, y: 100, w: 200, h: 60, label: 'WOK', approach: { x: 660, y: 192 } },
    grill: { id: 'grill', x: 800, y: 100, w: 200, h: 60, label: 'GRILL', approach: { x: 900, y: 192 } },
  },
  tables: [
    { id: 0, x: 180, y: 350, w: 200, h: 100, seat: { x: 280, y: 322 }, approach: { x: 280, y: 488 } },
    { id: 1, x: 540, y: 350, w: 200, h: 100, seat: { x: 640, y: 322 }, approach: { x: 640, y: 488 } },
    { id: 2, x: 900, y: 350, w: 200, h: 100, seat: { x: 1000, y: 322 }, approach: { x: 1000, y: 488 } },
  ],
};

// The warung day runs 07:00 to 02:00 (19 hours in one 150-second shift).
// The light changes as the day goes on — soft morning, bright afternoon,
// warm sunset evening with the lamps on, dark blue night. In Chill mode
// the day cycles again instead of ending, so the warung never sleeps.
export const DAY_START_HOUR = 7;
export const DAY_HOURS = 19;
// Phase boundaries as fractions of the 19-hour day: morning 07:00–12:00
// (5/19), afternoon 12:00–17:00 (10/19), evening 17:00–21:00 (14/19),
// night 21:00–02:00.
export const DAY_PHASES = [
  { id: 'morning', label: 'Morning', until: 5 / 19, tint: 'rgba(255, 220, 150, 0.05)' },
  { id: 'afternoon', label: 'Afternoon', until: 10 / 19, tint: null },
  { id: 'evening', label: 'Evening', until: 14 / 19, tint: 'rgba(255, 110, 40, 0.13)' },
  { id: 'night', label: 'Night', until: 1, tint: 'rgba(12, 22, 68, 0.24)' },
];

// Ambient chatter: when two seated customers chat, the second one
// answers with a line from their own type's reply pool. Short, English,
// warm — the dining room talking to itself.
export const CHATTER_REPLIES = {
  group: ['I told you the satay is the best!', 'Haha, exactly!', 'We should come every day!', 'Next round is on me!', 'This place is our place now!'],
  couple: ['Just like the old days.', 'The food is warm, dear.', 'So peaceful here.', 'Forty years, same table.'],
  grumpy: ['Shh, dear. Smile a little.', 'Easy now, the food is coming.', 'He means well, dear.', 'Forty years of this, dear.'],
  ale: ['One bowl at a time, friend.', 'I know that feeling.', 'Tell me about it.', 'The broth helps, does it not?'],
  family: ['Mum, this is the best!', 'Can we come again tomorrow?', 'Daddy, can we come again tomorrow?', 'This is yummy!'],
  regular: ['Best mie ayam in town.', 'This warung never disappoints.', 'I know, right?', 'Could not agree more.'],
};

// Weather, picked fresh every morning. Rain brings people in from the
// street — orders arrive a little faster, and warm food sells fast.
export const WEATHERS = {
  sunny: { label: 'Sunny', line: 'a calm clear day — steady tables.', spawnMult: 1 },
  cloudy: { label: 'Cloudy', line: 'soft light, steady tables.', spawnMult: 1 },
  rainy: { label: 'Rainy', line: 'warm food sells fast — everyone comes in from the rain!', spawnMult: 0.85 },
};

// Morning Market economy: every ingredient costs coins and runs out.
// A dish sells for more than its ingredients cost, so a well-run day
// always earns — but an empty pantry means a dish cannot be cooked
// until the Morning Market restocks it. Prices stay fair and simple.
export const START_STOCK = 8;
export const HIRE_COST = 40; // coins per day: Head Chef AI auto-cooks one station

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
  { id: 'nasi',   name: 'Rice',   key: '1', station: 'wajan',   prepSeconds: 2.2, color: '#fff3d6', accent: '#d9a441', draw: 'rice', price: 2 },
  { id: 'mie',    name: 'Noodles',    key: '2', station: 'wajan',   prepSeconds: 2.4, color: '#ffe9a8', accent: '#c98a1b', draw: 'noodle', price: 2 },
  { id: 'ayam',   name: 'Chicken',   key: '3', station: 'wajan',   prepSeconds: 3.0, color: '#f2b879', accent: '#a35a1e', draw: 'chicken', price: 4 },
  { id: 'telur',  name: 'Egg',  key: '4', station: 'wajan',   prepSeconds: 2.0, color: '#fff8e1', accent: '#e0a800', draw: 'egg', price: 2 },
  { id: 'cabai',  name: 'Chili',  key: '5', station: 'talenan', prepSeconds: 1.6, color: '#ff6b5e', accent: '#b31d12', draw: 'chili', price: 1 },
  { id: 'sawi',   name: 'Greens',   key: '6', station: 'talenan', prepSeconds: 1.6, color: '#7bc96f', accent: '#2f7d32', draw: 'veg', price: 1 },
  { id: 'tahu',   name: 'Tofu',   key: '7', station: 'talenan', prepSeconds: 1.8, color: '#fdf6d8', accent: '#b5892e', draw: 'tofu', price: 2 },
  { id: 'bawang', name: 'Onion', key: '8', station: 'talenan', prepSeconds: 1.4, color: '#f3d9f2', accent: '#8e44ad', draw: 'onion', price: 1 },
  { id: 'bakso',  name: 'Meatballs',  key: '9', station: 'wajan',   prepSeconds: 2.6, color: '#d9a066', accent: '#8d5a2b', draw: 'meatball', price: 3 },
  { id: 'teh',    name: 'Iced Tea', key: '0', station: 'wajan',   prepSeconds: 1.8, color: '#e8a33d', accent: '#7a4a00', draw: 'tea', price: 1 },
  { id: 'kopi',   name: 'Coffee',   key: 'q', station: 'wajan',   prepSeconds: 1.8, color: '#6f4e37', accent: '#3e2723', draw: 'coffee', price: 1 },
  { id: 'alpukat', name: 'Avocado', key: 'w', station: 'talenan', prepSeconds: 1.8, color: '#9ccc65', accent: '#33691e', draw: 'avocado', price: 3 },
  { id: 'sate',   name: 'Satay Skewers', key: 'e', station: 'grill', prepSeconds: 3.2, color: '#d9a066', accent: '#8d5a2b', draw: 'satay', price: 5 },
];

export const STATIONS = {
  wajan:   { name: 'Wok',   icon: 'wok',  color: '#3d3d3d' },
  talenan: { name: 'Chopping Board', icon: 'board', color: '#b08954' },
  grill:   { name: 'Grill', icon: 'grill', color: '#4e342e' },
};

// Twelve original warung dishes. Each one is four ingredients, mixed
// chop/cook/grill steps, so every order asks for a different route.
// Es Teh (Sweet Iced Tea) stays last: it is the one-item drink order,
// a quick win between the big dishes, and the 12% quick-win pick.
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
    ingredients: ['sate', 'cabai', 'bawang', 'tahu'],
    blurb: 'Grilled satay skewers, chili sauce, grilled tofu.',
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
    id: 'ayam-goreng', name: 'Ayam Goreng (Fried Chicken)', price: 18,
    ingredients: ['ayam', 'bawang', 'cabai', 'telur'],
    blurb: 'Crispy fried chicken, chili and egg.',
  },
  {
    id: 'kopi-tubruk', name: 'Kopi Tubruk (Black Coffee)', price: 7,
    ingredients: ['kopi'],
    blurb: 'Strong black coffee — quick to serve.',
  },
  {
    id: 'jus-alpukat', name: 'Jus Alpukat (Avocado Juice)', price: 9,
    ingredients: ['alpukat'],
    blurb: 'Creamy avocado juice — a sweet quick win.',
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
// DIALOGUE POOLS: no character has one line. Every type carries 6-8
// general lines plus small pools for greeting, impatience, rainy days
// and evenings — the picker never repeats a line twice in a row.
export const CUSTOMER_TYPES = {
  group: {
    label: 'Young Group', patienceRate: 1.0, tipRate: 1.3,
    lines: ['haha, so tasty!', 'Coming back tomorrow!', 'Hey, try the satay!', 'Photo first, then eat!', 'This place never misses!', 'I laughed so hard I dropped my spoon!', 'Best warung in town, fight me!', 'We should bring the whole class here!'],
    greet: ['Hey! We are back!', 'Table for two — we brought an appetite!'],
    impatient: ['Our food is taking forever…', 'I am SO hungry!'],
    rainy: ['At least it is warm in here!', 'Rain outside, noodles inside. Perfect.'],
    evening: ['Evening noodles hit different.', 'The lamps make everything taste better.'],
    bio: 'Regulars since day one — they laugh, share food, and always come back.',
  },
  couple: {
    label: 'Old Couple', patienceRate: 0.65, tipRate: 1.2,
    // Mr Harto & Mrs Lastri are two of the neighbours who came back the
    // morning after the fire, each carrying one ingredient.
    lines: ['The food is warm, dear.', 'Such a calm place.', 'We brought the rice that morning — cook it well, dear.', 'Take it slow, dear.', 'Forty years, same table.', 'Do you remember our first bowl here?', 'Slow food, slow love.', 'The broth tastes like 1985.'],
    greet: ['Ah, our usual table.', 'Good afternoon, dear.'],
    impatient: ['No rush, dear. We have time.', 'The young ones hurry. We wait.'],
    rainy: ['Rain on the roof, soup in the bowl.', 'Cozy, is it not?'],
    evening: ['The sunset through that window…', 'Evenings here are the best part of the day.'],
    bio: 'Neighbours who brought ingredients the morning after the fire.',
  },
  grumpy: {
    label: 'Grumpy Customer', patienceRate: 1.7, tipRate: 0.4,
    lines: ['So slow!', 'This is cold!', 'I do not like this!', 'A bit faster!', 'Hmm… not bad.', 'My soup is getting cold!', 'In my day, food came faster.'],
    greet: ['Hmph. Finally, a table.', 'Do not keep me waiting.'],
    impatient: ['This is taking forever!', 'I have been waiting since this morning!', 'Unbelievable!'],
    rainy: ['Even the rain waits for no one.', 'Hmph. Wet shoes, cold food.'],
    evening: ['It is getting dark and still no food!', 'Evening, and I am still hungry.'],
    // Soft lines, only when a child is seated nearby: that is what he
    // and his wife always wanted most.
    soft: ['In another life, maybe we’ll have a child of our own, dear.', 'Look at them… lucky.', 'She would have loved this place.'],
    bio: 'First customer after the fire. Grumpy, but the most loyal.',
  },
  family: {
    // Mrs Ayu, Mr Dedi and little Nara — one family, one table. Nara
    // is the child from the Grumpy brief: when she is seated, Mr
    // Grumpy's face softens, because that is what he always wanted most.
    label: 'Mum, Dad & Nara', patienceRate: 1.0, tipRate: 1.1,
    lines: ['This is yummy!', 'Daddy, can we come again tomorrow?', 'Look, I finished it all!', 'Mum, the noodles are dancing!', 'I want the pink plate!', 'Daddy, look — I ate everything!'],
    greet: ['We are here! Sunday noodles!', 'Nara has been talking about this all week!'],
    impatient: ['I am hungry NOW!', 'Daddy, when is it coming?'],
    rainy: ['Rainy Sundays are noodle Sundays!', 'Puddle-jumping, then noodles!'],
    evening: ['Can we stay a little longer?', 'The lamps look like stars!'],
    bio: 'Brings her daughter here every Sunday. The warung is their little tradition.',
  },
  ale: {
    // Ale, inspired by "Seporsi Mie Ayam Sebelum Mati" by Brian Khrisna
    // (Grasindo, 2025). A big, quiet man who always orders mie ayam, sits
    // alone, and rambles gently while waiting. His lines stay soft and
    // hopeful — the darkness is there, but so is the turn toward hope.
    // Served well and on time, he smiles for the first time and says he
    // will come back tomorrow.
    label: 'Ale', patienceRate: 0.9, tipRate: 1.1,
    lines: [
      'Still figuring life out…',
      'One bowl at a time.',
      'Nobody talks to me at work.',
      'I feel like a supporting character in my own story.',
      'This broth tastes like hope.',
      'Some days I wonder why I keep going... nobody seems to care.',
      'What is my purpose in life?',
      'This mie ayam is so good... it makes me want to live again.',
    ],
    greet: ['Morning. The usual, please.', 'Just me again.'],
    impatient: ['Is my bowl coming…?', 'I waited all morning for this.'],
    rainy: ['Rainy days feel heavier. This broth helps.', 'The rain sounds like the city sighing.'],
    evening: ['Evenings are the hardest. But the lights are warm here.', 'One more bowl before the dark.'],
    bio: 'Orders mie ayam every morning. Quiet, thoughtful, still figuring life out — but this broth tastes like hope.',
  },
  regular: {
    label: 'Regular', patienceRate: 1.0, tipRate: 1.0,
    lines: ['The usual, please.', 'It smells amazing.', 'I am starving!', 'Thank you, Bu Rani!', 'Same as yesterday!', 'Rani remembers my order. Every time.', 'I dream about this broth.'],
    greet: ['Morning, Bu Rani!', 'The usual table, please.'],
    impatient: ['Getting hungry over here!', 'My stomach is growling…'],
    rainy: ['Came in from the rain — feed me!', 'Nothing beats soup in the rain.'],
    evening: ['Long day. This helps.', 'Evening regular, reporting for dinner.'],
    bio: 'A neighbour from down the street. Comes for the broth.',
  },
};

export const CUSTOMERS = [
  { name: 'Raka & Dina', type: 'group', skin: '#f2c89b', shirt: '#2e7d32' },
  { name: 'Sinta & Bimo', type: 'group', skin: '#e8b48a', shirt: '#c2185b' },
  { name: 'Mr Harto & Mrs Lastri', type: 'couple', skin: '#d9a066', shirt: '#1565c0' },
  // Mr & Mrs Grumpy are their own couple — a stern old man in a dark
  // grey shirt, his wife in a brown kebaya — NOT the cheerful Harto
  // couple (blue shirt + black peci cap, both laughing). Separate bios
  // and lines, so the two old couples never read as one.
  { name: 'Mr Grumpy', type: 'grumpy', skin: '#e8b48a', shirt: '#37474f',
    bio: "Grumpy, but the most loyal. He and his wife always dreamed of a child.",
    lines: ['So slow!', 'This is cold!', 'I do not like this!', 'A bit faster!', 'Hmm… not bad.', 'My soup is getting cold!', 'In my day, food came faster.'],
    impatient: ['So slow!', 'This is cold!', 'A bit faster!', 'This is taking forever!'] },
  { name: 'Mrs Grumpy', type: 'grumpy', skin: '#f2c89b', shirt: '#4e342e',
    bio: 'His wife of 40 years. She calms him down — and carries a quiet wish of her own.',
    lines: ['Shh, dear. Smile a little.', 'The broth is lovely today.', 'He means well, dear.', 'Eat slowly, dear.', 'He softens when children laugh.', 'Forty years, and he still taps the table.'],
    impatient: ['Patience, dear. The food is coming.', 'Breathe, dear. Smile a little.'] },
  { name: 'Ayu & Dedi & Nara', type: 'family', skin: '#f2c89b', shirt: '#ffd54f',
    bio: 'Brings her daughter here every Sunday. The warung is their little tradition.' },
  { name: 'Ale', type: 'ale', skin: '#8a5a3b', shirt: '#37474f' },
  { name: 'Mr Budi', type: 'regular', skin: '#f2c89b', shirt: '#2e7d32' },
  { name: 'Miss Sari', type: 'regular', skin: '#e8b48a', shirt: '#c2185b' },
  { name: 'Mr Joko', type: 'regular', skin: '#d9a066', shirt: '#1565c0' },
  { name: 'Mrs Ani', type: 'regular', skin: '#f2c89b', shirt: '#ef6c00' },
  { name: 'Rian', type: 'regular', skin: '#e8b48a', shirt: '#6a1b9a' },
  { name: 'Dewi', type: 'regular', skin: '#d9a066', shirt: '#00838f' },
];

// The wall-mounted TV's news ticker — English, neutral, verified from
// news reports (Reuters, 11–23 Nov 2026): Gibran resigned on 12 Nov
// after the Supreme Court voided his equivalency certificate (Decision
// 742 K/TUN/2026); 120 DPR members filed the impeachment motion;
// Prabowo nominated Amran Sulaiman and Sugiono on 23 Nov; the MPR
// elects the new VP on 11 Dec; the Asset Forfeiture Bill passed on
// 19 Nov amid an ICW ethics complaint. No invented scandals, no sides.
export const NEWS_HEADLINES = [
  'BREAKING: Vice President Gibran resigns amid diploma row',
  '120 DPR members push impeachment motion against VP Gibran',
  "Supreme Court voids Gibran's high-school equivalency certificate",
  'MPR to elect new VP on 11 December',
  'Prabowo names two VP candidates: Amran Sulaiman and Sugiono',
  'Asset Forfeiture Bill passed amid ethics complaint',
  'Gibran: resignation is a personal decision',
];

// Sam the Guard, the smiling security guard beside the door, greets
// every arriving customer. Behind his smile he carries a heavy load:
// his children need school fees to keep studying, and his wife is
// pregnant with their third child. He works hard and smiles because
// of his family — proud and hopeful, never pitiful.
export const GUARD_GREETINGS = ['Welcome in!', 'Come on in, sir!', 'Enjoy your lunch!', 'Good to see you again!', 'Make yourself at home!', 'Hungry? You came to the right place!'];
export const GUARD_BIO = "Smiles at every customer. His kids' school fees and a third baby on the way keep him standing tall.";
export const GUARD_LINES = [
  "My kids' school fees are due this month — every smile helps.",
  'My wife is expecting our third. I work so they can dream bigger.',
  'Tired? A little. But the warung feels like family.',
  'Every coin today is one step closer to their school.',
  'My wife says the baby kicks when I talk about the warung.',
  'One day my kids will eat here as grown-ups. I work for that.',
];
export const GUARD_NAME = 'Sam the Guard';

// Bu Rani's serving lines — she smiles when a customer is happy, and the
// serve message carries her voice so the player hears her, not just a
// score popup.
export const RANI_SERVE_LINES = ['Enjoy, dear!', 'Hot from the last wok!', 'Eat while it is warm!', 'Made with love, as always.', 'Come back tomorrow, dear!', 'Careful, it is still steaming!'];

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
