export function clearCanvas(ctx, canvas) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawLandmarks(ctx, result, canvas) {
  if (!result || !result.landmarks) return;

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.fillStyle = "rgba(255,255,255,0.95)";

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
      ctx.arc((1 - point.x) * canvas.width, point.y * canvas.height, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawDarkOverlay(ctx, canvas, alpha = 0.6) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function drawBlueAura(ctx, canvas, t) {
  const pulse = 0.15 + Math.abs(Math.sin(t * 0.008)) * 0.18;

  ctx.save();
  ctx.fillStyle = `rgba(40, 120, 255, ${pulse})`;
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

export function drawDomainBanner(ctx, canvas) {
  drawText(ctx, "DOMAIN EXPANSION", canvas.width / 2, 90, 52, "white");
  drawText(ctx, "IDLE DEATH GAMBLE", canvas.width / 2, 145, 28, "#dbe7ff");
}

export function drawSlotMachine(ctx, canvas, values) {
  const boxW = 120;
  const boxH = 140;
  const gap = 28;
  const totalW = boxW * 3 + gap * 2;
  const startX = (canvas.width - totalW) / 2;
  const y = canvas.height / 2 - 70;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (boxW + gap);

    ctx.save();
    ctx.fillStyle = "rgba(10,10,18,0.7)";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(255,255,255,0.5)";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = "700 78px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(values[i]), x + boxW / 2, y + boxH / 2 + 5);
    ctx.restore();
  }
}

export function drawHandGlow(ctx, centers, canvas, t) {
  const pulse = 60 + Math.abs(Math.sin(t * 0.01)) * 30;

  for (const c of centers) {
    const x = canvas.width - c.x;
    const y = c.y;

    const gradient = ctx.createRadialGradient(x, y, 8, x, y, pulse);
    gradient.addColorStop(0, "rgba(80, 160, 255, 0.95)");
    gradient.addColorStop(0.4, "rgba(60, 130, 255, 0.55)");
    gradient.addColorStop(1, "rgba(40, 90, 255, 0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawStatus(ctx, canvas, text) {
  drawText(ctx, text, canvas.width / 2, canvas.height - 40, 24, "#ffffff");
}