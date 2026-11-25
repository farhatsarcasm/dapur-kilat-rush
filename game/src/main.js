// The Last Wok — entry point for the browser game.
// Boots the canvas, runs the loop, wires mouse/touch and keyboard.
// The game is static files only: no network requests, no cookies, no
// service worker, nothing to download at run time.
// PIXEL ART: the game is drawn at full size onto an offscreen canvas,
// then downscaled to a low-res 640x360 buffer and upscaled with
// smoothing OFF — every frame gets a chunky 16-bit pixel look. The
// character art is the author's own generated pixel sprites
// (game/sprites/*.png, local files); anything else is code-drawn.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createState, update, dayClock } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey, handleKeyDown, handleKeyUp } from './input.js';
import { applyShot } from './shots.js';
import { sounds, startAmbience, setRain } from './audio.js';
import { loadSprites, spritesSettled, spritesLoadedCount } from './sprites.js';

loadSprites();

const PIXEL_W = 640;
const PIXEL_H = 360;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

// Offscreen full-size canvas the game draws on, then the low-res pixel buffer.
const full = document.createElement('canvas');
full.width = CANVAS_W;
full.height = CANVAS_H;
const fullCtx = full.getContext('2d');
const low = document.createElement('canvas');
low.width = PIXEL_W;
low.height = PIXEL_H;
const lowCtx = low.getContext('2d');

const state = createState();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const isShot = applyShot(state, shot);

let lastTime = performance.now();
let lastPlacedCount = 0;

function frame(now) {
  const delta = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!isShot) {
    update(state, delta);
    if (state.tickNow) { state.tickNow = false; sounds.tick(); }
    // A finished ingredient lands on the plate with a ding.
    const placedCount = state.orders.reduce((n, o) => n + o.placed.length, 0)
      + state.departing.reduce((n, o) => n + o.placed.length, 0);
    if (placedCount > lastPlacedCount) sounds.ready();
    lastPlacedCount = placedCount;
    // Rain sound on rainy days, quieter and calmer — mute silences it.
    setRain(state.screen === 'playing' && state.weather === 'rainy');
  }
  render(fullCtx, state);
  // Pixelate: downscale to the low-res buffer, upscale with no smoothing.
  lowCtx.imageSmoothingEnabled = false;
  lowCtx.drawImage(full, 0, 0, PIXEL_W, PIXEL_H);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(low, 0, 0, CANVAS_W, CANVAS_H);
  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (CANVAS_W / rect.width),
    y: (event.clientY - rect.top) * (CANVAS_H / rect.height),
  };
}

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  startAmbience();
  handleClick(state, canvasPoint(event));
});

window.addEventListener('keydown', (event) => {
  if (event.key === ' ') event.preventDefault();
  startAmbience();
  handleKeyDown(state, event.key);
  handleKey(state, event.key);
});

window.addEventListener('keyup', (event) => {
  handleKeyUp(state, event.key);
});

// Expose the state for play-testing and for the screenshot script.
window.__lastWok = { state, applyShot, spritesReady: spritesSettled, spritesLoaded: spritesLoadedCount, dayClock: () => dayClock(state) };

requestAnimationFrame(frame);
