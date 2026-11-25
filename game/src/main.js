// Dapur Kilat — entry point for the browser game.
// Boots the canvas, runs the loop, wires mouse/touch and keyboard.
// The game is static files only: no network requests, no cookies, no
// service worker, nothing to download at run time.

import { CANVAS_W, CANVAS_H } from './config.js';
import { createState, update } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { applyShot } from './shots.js';
import { sounds, startAmbience } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const state = createState();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const isShot = applyShot(state, shot);

let lastTime = performance.now();
let lastReadyCount = 0;

function frame(now) {
  const delta = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!isShot) {
    update(state, delta);
    if (state.tickNow) { state.tickNow = false; sounds.tick(); }
    if (state.readyTray.length > lastReadyCount) sounds.ready();
    lastReadyCount = state.readyTray.length;
  }
  render(ctx, state);
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
  handleKey(state, event.key);
});

// Expose the state for play-testing and for the screenshot script.
window.__dapurKilat = { state, applyShot };

requestAnimationFrame(frame);
