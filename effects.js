export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawLandmarks(ctx, result, canvas, alpha = 0.45) {
  if (!result || !result.landmarks) return;

  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.fillStyle = `rgba(255,255,255,${Math.min(alpha + 0.1, 1)})`;

  const connections = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [5,9],[9,10],[10,11],[11,12],
    [9,13],[13,14],[14,15],[15,16],
    [13,17],[17,18],[18,19],[19,20],
    [0,17]
  ];

  for (const hand of result.landmarks) {
    for (const [a, b] of connections) {
      const p1 = hand[a];
      const p2 = hand[b];

      ctx.beginPath();
      ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
      ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    }

    for (const point of hand) {
      ctx.beginPath();
      ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawDarkOverlay(ctx, canvas, alpha = 0.55) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function drawBlueAura(ctx, canvas, t) {
  const pulse = 0.16 + Math.abs(Math.sin(t * 0.006)) * 0.2;

  ctx.save();
  ctx.fillStyle = `rgba(35, 105, 255, ${pulse})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    100,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.55
  );
  grad.addColorStop(0, "rgba(120, 190, 255, 0.12)");
  grad.addColorStop(0.35, "rgba(70, 120, 255, 0.08)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function drawText(ctx, text, x, y, size = 48, color = "white", align = "center") {
  ctx.save();
  ctx.font = `700 ${size}px Arial`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawDomainBanner(ctx, canvas, t) {
  const pulse = 0.7 + Math.abs(Math.sin(t * 0.01)) * 0.3;

  ctx.save();
  ctx.globalAlpha = pulse;
  drawText(ctx, "DOMAIN EXPANSION", canvas.width / 2, 115, 58, "white");
  drawText(ctx, "IDLE DEATH GAMBLE", canvas.width / 2, 175, 28, "#dbe7ff");
  ctx.restore();
}

export function drawSlotMachine(ctx, canvas, values, rolling = false) {
  const boxW = Math.min(145, canvas.width * 0.11);
  const boxH = Math.min(165, canvas.height * 0.2);
  const gap = Math.min(28, canvas.width * 0.02);
  const totalW = boxW * 3 + gap * 2;
  const startX = (canvas.width - totalW) / 2;
  const y = canvas.height / 2 - boxH / 2;

  ctx.save();
  ctx.fillStyle = "rgba(6, 12, 30, 0.45)";
  ctx.strokeStyle = "rgba(120, 170, 255, 0.35)";
  ctx.lineWidth = 4;
  roundRect(ctx, startX - 28, y - 30, totalW + 56, boxH + 60, 26, true, true);
  ctx.restore();

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (boxW + gap);

    ctx.save();

    const frameGrad = ctx.createLinearGradient(x, y, x, y + boxH);
    frameGrad.addColorStop(0, "rgba(18, 28, 58, 0.92)");
    frameGrad.addColorStop(1, "rgba(6, 10, 24, 0.95)");

    ctx.fillStyle = frameGrad;
    ctx.strokeStyle = rolling ? "rgba(180, 220, 255, 0.95)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 4;
    ctx.shadowColor = rolling ? "rgba(80, 170, 255, 0.75)" : "rgba(255,255,255,0.3)";
    ctx.shadowBlur = 22;

    roundRect(ctx, x, y, boxW, boxH, 18, true, true);

    const shine = ctx.createLinearGradient(x, y, x + boxW, y + boxH);
    shine.addColorStop(0, "rgba(255,255,255,0.16)");
    shine.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = shine;
    roundRect(ctx, x + 6, y + 6, boxW - 12, boxH * 0.38, 12, true, false);

    ctx.font = `700 ${Math.floor(boxH * 0.55)}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(120, 190, 255, 0.75)";
    ctx.shadowBlur = 18;
    ctx.fillText(String(values[i]), x + boxW / 2, y + boxH / 2 + 5);

    ctx.restore();
  }
}

export function drawHandGlow(ctx, centers, canvas, t) {
  const pulse = 55 + Math.abs(Math.sin(t * 0.01)) * 36;

  for (const c of centers) {
    const x = canvas.width - c.x;
    const y = c.y;

    const gradient = ctx.createRadialGradient(x, y, 8, x, y, pulse);
    gradient.addColorStop(0, "rgba(120, 200, 255, 0.96)");
    gradient.addColorStop(0.35, "rgba(70, 145, 255, 0.62)");
    gradient.addColorStop(1, "rgba(30, 85, 255, 0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawStatus(ctx, canvas, text) {
  drawText(ctx, text, canvas.width / 2, canvas.height - 42, 24, "#ffffff");
}

export function drawParticleField(ctx, canvas, particles, color = "rgba(150, 210, 255, 0.55)") {
  ctx.save();
  ctx.fillStyle = color;

  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}