// The Last Wok — character sprites (author-generated pixel art).
// Loads the 18 PNGs under game/sprites/ at boot. Everything is local
// files, no network. If any sprite fails to load, the caller falls back
// to the code-drawn character — the game never breaks on a missing image.

const FILES = {
  'ale': 'ale.png',
  'bu-rani': 'bu-rani.png',
  'chef-ai': 'chef-ai.png',
  'sam-guard': 'sam-guard.png',
  'mr-grumpy': 'mr-grumpy.png',
  'mrs-grumpy': 'mrs-grumpy.png',
  'mr-harto': 'mr-harto.png',
  'mrs-lastri': 'mrs-lastri.png',
  'raka': 'raka.png',
  'dina': 'dina.png',
  'sinta': 'sinta.png',
  'bimo': 'bimo.png',
  'mr-budi': 'mr-budi.png',
  'miss-sari': 'miss-sari.png',
  'mr-joko': 'mr-joko.png',
  'mrs-ani': 'mrs-ani.png',
  'rian': 'rian.png',
  'dewi': 'dewi.png',
  'mrs-ayu': 'mrs-ayu.png',
  'mr-dedi': 'mr-dedi.png',
  'nara': 'nara.png',
};

export const SPRITE_TOTAL = Object.keys(FILES).length;

const images = {};
let settled = 0;
let loaded = 0;

export function loadSprites() {
  for (const [key, file] of Object.entries(FILES)) {
    const img = new Image();
    img.onload = () => { settled += 1; loaded += 1; };
    img.onerror = () => { settled += 1; };
    img.src = `sprites/${file}`;
    images[key] = img;
  }
}

// True once every sprite has either loaded or failed — the game never
// waits forever on a missing file.
export function spritesSettled() {
  return settled >= SPRITE_TOTAL;
}

// How many sprites actually loaded (for smoke tests and screenshots).
export function spritesLoadedCount() {
  return loaded;
}

export function spriteFor(key) {
  const img = images[key];
  if (!img || !img.complete || !img.naturalWidth) return null;
  return img;
}

// Draw a sprite centered at (x, y) with the given height, keeping its
// aspect ratio and the chunky pixel look. Returns false if the sprite
// is not available, so the caller can fall back to code-drawn art.
// squash < 1 squashes the sprite slightly (sitting down).
export function drawSprite(ctx, key, x, y, h, squash = 1) {
  const img = spriteFor(key);
  if (!img) return false;
  const w = (h * img.naturalWidth) / img.naturalHeight;
  const hh = h * squash;
  const ww = w * (2 - squash);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x - ww / 2, y - hh / 2, ww, hh);
  return true;
}

// Which sprite(s) a customer uses. Pairs (young group, old couple) use
// two sprites side by side; everyone else uses one.
export function customerSprites(customer) {
  const name = customer.name || '';
  if (name.startsWith('Raka')) return ['raka', 'dina'];
  if (name.startsWith('Sinta')) return ['sinta', 'bimo'];
  if (name.startsWith('Mr Harto')) return ['mr-harto', 'mrs-lastri'];
  if (name === 'Ale') return ['ale'];
  if (name === 'Mr Grumpy') return ['mr-grumpy'];
  if (name === 'Mrs Grumpy') return ['mrs-grumpy'];
  if (name === 'Mr Budi') return ['mr-budi'];
  if (name === 'Miss Sari') return ['miss-sari'];
  if (name === 'Mr Joko') return ['mr-joko'];
  if (name === 'Mrs Ani') return ['mrs-ani'];
  if (name === 'Rian') return ['rian'];
  if (name === 'Dewi') return ['dewi'];
  // The Ayu family: mum, dad and little Nara, three sprites at one table.
  if (name === 'Ayu & Dedi & Nara') return ['mrs-ayu', 'mr-dedi', 'nara'];
  return [];
}
