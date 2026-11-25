// Dapur Kilat — small canvas drawings: every ingredient, customer faces,
// the chef and the Head Chef AI robot. All art is drawn in code: no image files,
// no network requests, nothing to download.

// Draw one ingredient's icon inside a circle of radius r at (x, y).
export function drawIngredientIcon(ctx, draw, x, y, r, color, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  if (draw === 'rice') {
    ctx.beginPath(); ctx.ellipse(0, 4, r * 0.85, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.25, r * 0.5, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent;
    for (const [gx, gy] of [[-6, -2], [2, 2], [7, -4], [-2, 6]]) {
      ctx.beginPath(); ctx.ellipse(gx * r / 14, gy * r / 14, 1.6, 1, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (draw === 'noodle') {
    ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, i * r * 0.35);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.35 - r * 0.35, r * 0.3, i * r * 0.35 + r * 0.35, r * 0.7, i * r * 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.4, r * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (draw === 'chicken') {
    ctx.fillStyle = '#f2b879';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.5, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f5f5f5'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.5, r * 0.3); ctx.lineTo(r * 0.9, r * 0.7); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.92, r * 0.72, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (draw === 'egg') {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.arc(r * 0.1, 0, r * 0.34, 0, Math.PI * 2); ctx.fill();
  } else if (draw === 'chili') {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.2);
    ctx.quadraticCurveTo(0, r * 0.9, r * 0.7, -r * 0.4);
    ctx.quadraticCurveTo(r * 0.2, r * 0.1, -r * 0.7, -r * 0.2);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#2f7d32'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r * 0.65, -r * 0.45); ctx.quadraticCurveTo(r * 0.9, -r * 0.8, r * 0.55, -r * 0.85); ctx.stroke();
  } else if (draw === 'veg') {
    ctx.fillStyle = '#58a34c';
    for (const angle of [0, 1.1, 2.2, 3.3, 4.4, 5.4]) {
      ctx.beginPath(); ctx.ellipse(Math.cos(angle) * r * 0.4, Math.sin(angle) * r * 0.4, r * 0.42, r * 0.2, angle, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#7bc96f';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
  } else if (draw === 'tofu') {
    ctx.fillStyle = '#fdf6d8';
    ctx.strokeStyle = '#b5892e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(-r * 0.6, -r * 0.45, r * 1.2, r * 0.9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.45); ctx.lineTo(-r * 0.3, -r * 0.7); ctx.lineTo(r * 0.9, -r * 0.7); ctx.lineTo(r * 0.6, -r * 0.45); ctx.stroke();
  } else if (draw === 'onion') {
    ctx.strokeStyle = '#b06ab3'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(0, 0, r * (0.75 - i * 0.2), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#e9b8ec';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (draw === 'meatball') {
    ctx.fillStyle = '#a0662c';
    for (const [bx, by, br] of [[-0.35, 0.15, 0.42], [0.35, 0.2, 0.42], [0, -0.35, 0.45]]) {
      ctx.beginPath(); ctx.arc(bx * r, by * r, br * r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a4b';
      ctx.beginPath(); ctx.arc(bx * r - br * r * 0.3, by * r - br * r * 0.3, br * r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a0662c';
    }
  } else if (draw === 'tea') {
    ctx.fillStyle = 'rgba(232,163,61,0.9)';
    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.5); ctx.lineTo(r * 0.5, -r * 0.5); ctx.lineTo(r * 0.35, r * 0.7); ctx.lineTo(-r * 0.35, r * 0.7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a4a00'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#d35400'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.5); ctx.lineTo(r * 0.45, -r * 0.95); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-r * 0.3, -r * 0.2, r * 0.18, r * 0.18);
  }
  ctx.restore();
}

// A round cartoon customer face.
export function drawCustomerFace(ctx, customer, x, y, r, mood) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = customer.skin;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = customer.shirt;
  ctx.beginPath(); ctx.arc(0, -r * 0.95, r * 0.55, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-r * 0.35, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.35, -r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (mood === 'grumpy') {
    // Angry slanted brows, flat mouth: the grumpy customer, mid-complaint.
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.42); ctx.lineTo(-r * 0.15, -r * 0.28);
    ctx.moveTo(r * 0.55, -r * 0.42); ctx.lineTo(r * 0.15, -r * 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.5); ctx.lineTo(r * 0.4, r * 0.5);
    ctx.stroke();
  } else if (mood === 'laugh') {
    // Laughing: closed happy eyes, open laughing mouth.
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.05, r * 0.14, Math.PI, 0);
    ctx.arc(r * 0.35, -r * 0.05, r * 0.14, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#7b2d26';
    ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.28, 0, Math.PI); ctx.fill();
  } else {
    ctx.beginPath();
    if (mood === 'happy') {
      ctx.arc(0, r * 0.15, r * 0.45, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (mood === 'angry') {
      ctx.moveTo(-r * 0.4, r * 0.55); ctx.lineTo(r * 0.4, r * 0.55);
    } else {
      ctx.arc(0, r * 0.55, r * 0.35, 1.15 * Math.PI, 1.85 * Math.PI);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Sam the Guard, the smiling security guard at the door, waving hello.
export function drawGuard(ctx, x, y, scale, waving) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Cap.
  ctx.fillStyle = '#1a237e';
  ctx.beginPath(); ctx.arc(0, -26, 13, Math.PI, 0); ctx.fill();
  ctx.fillRect(-14, -27, 28, 4);
  // Face.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -14, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-5, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -12, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Navy uniform, one arm raised in a wave.
  ctx.fillStyle = '#1a237e';
  ctx.beginPath(); ctx.moveTo(-14, 22); ctx.lineTo(14, 22); ctx.lineTo(10, 0); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a237e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(waving ? 26 : 20, -14); ctx.stroke();
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(-3, 8, 6, 6);
  ctx.restore();
}

// The warung cat, asleep in a corner, curled up with a "Z".
export function drawCat(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8a33d';
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-18, -8, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-26, -16); ctx.lineTo(-22, -26); ctx.lineTo(-18, -17); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(-10, -28); ctx.lineTo(-6, -17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-22, -8); ctx.quadraticCurveTo(-14, -4, -6, -8); ctx.stroke();
  ctx.fillStyle = '#8d5a2b';
  ctx.beginPath(); ctx.moveTo(20, 2); ctx.quadraticCurveTo(34, 2, 34, -10); ctx.stroke();
  ctx.fillStyle = '#5d4037';
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Z', 28, -14);
  ctx.fillText('z', 34, -24);
  ctx.restore();
}

// A small potted plant: the warung's green, calm corner.
export function drawPlant(ctx, x, y, scale, sway) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#b5651d';
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(7, 14); ctx.lineTo(-7, 14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2f7d32'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const angle of [-0.5, -0.15, 0.2, 0.55]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.sin(angle) * 10 + sway, -14, Math.sin(angle) * 16 + sway, -26);
    ctx.stroke();
  }
  ctx.restore();
}

// Chef Rani, the player chef, standing at her counter.
export function drawChef(ctx, x, y, scale, mood) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(0, -38, 26, 12, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath(); ctx.arc(0, -22, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -30, 17, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-6, -24, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -24, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy' || mood === 'proud') ctx.arc(0, -18, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood === 'worried') ctx.arc(0, -12, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  else ctx.arc(0, -16, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(-22, 28); ctx.lineTo(22, 28); ctx.lineTo(16, -8); ctx.lineTo(-16, -8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-12, -2, 24, 16);
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('RANI', 0, 10);
  ctx.restore();
}

// Head Chef AI: a small friendly robot sous-chef with a glowing eye.
export function drawKokiRobot(ctx, x, y, scale, enabled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = enabled ? '#bfe3ff' : '#cfd8dc';
  ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-20, -28, 40, 34, 8); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -38); ctx.stroke();
  ctx.fillStyle = enabled ? '#ffeb3b' : '#90a4ae';
  ctx.beginPath(); ctx.arc(0, -40, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#263238';
  ctx.beginPath(); ctx.arc(-8, -16, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -16, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = enabled ? '#00e676' : '#90a4ae';
  ctx.beginPath(); ctx.roundRect(-8, -6, 16, 4, 2); ctx.fill();
  ctx.fillStyle = '#78909c';
  ctx.beginPath(); ctx.roundRect(-26, -22, 6, 18, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(20, -22, 6, 18, 3); ctx.fill();
  ctx.fillStyle = '#546e7a';
  ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CHEF AI', 0, 22);
  ctx.restore();
}
