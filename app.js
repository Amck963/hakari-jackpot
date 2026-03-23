import { createHandLandmarker, detectHakariSign, getHandCenters } from "./handdetection.js";
import { SlotMachine } from "./slots.js";
import { AudioManager } from "./audio.js";
import {
  clearCanvas,
  drawLandmarks,
  drawDarkOverlay,
  drawBlueAura,
  drawText,
  drawDomainBanner,
  drawSlotMachine,
  drawHandGlow,
  drawStatus,
  drawParticleField
} from "./effects.js";

const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const statusText = document.getElementById("statusText");
const flashLayer = document.getElementById("flashLayer");

const leftRail = document.getElementById("leftRail");
const rightRail = document.getElementById("rightRail");

const slotGif1 = document.getElementById("slotGif1");
const slotGif2 = document.getElementById("slotGif2");
const slotGif3 = document.getElementById("slotGif3");

const rails = [leftRail, rightRail];
const slotGifs = [slotGif1, slotGif2, slotGif3];

let handLandmarker = null;
let running = false;
let lastVideoTime = -1;
let result = null;

const audio = new AudioManager();
const slotMachine = new SlotMachine();

const STATE = {
  IDLE: "idle",
  DETECTED: "detected",
  DOMAIN_INTRO: "domain_intro",
  ROLLING: "rolling",
  RESULT: "result",
  JACKPOT: "jackpot"
};

let state = STATE.IDLE;
let stateStart = 0;
let lastTrigger = 0;

const DETECTION_COOLDOWN = 5000;
const DETECTED_DURATION = 450;
const DOMAIN_INTRO_DURATION = 1600;
const RESULT_DURATION = 1800;

let particles = [];

function triggerFlash() {
  flashLayer.classList.remove("active");
  void flashLayer.offsetWidth;
  flashLayer.classList.add("active");
}

function setState(nextState, now) {
  state = nextState;
  stateStart = now;
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 1280,
      height: 720,
      facingMode: "user"
    },
    audio: false
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  resetParticles();
}

function resetParticles() {
  particles = Array.from({ length: 85 }, () => makeParticle());
}

function makeParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vy: 0.6 + Math.random() * 1.8,
    r: 1 + Math.random() * 3,
    alpha: 0.18 + Math.random() * 0.45
  };
}

function updateParticles(multiplier = 1) {
  for (const p of particles) {
    p.y -= p.vy * multiplier;
    p.x += Math.sin(p.y * 0.01) * 0.18;

    if (p.y < -10) {
      p.y = canvas.height + 10;
      p.x = Math.random() * canvas.width;
    }
  }
}

async function init() {
  statusText.textContent = "Loading hand tracker...";
  handLandmarker = await createHandLandmarker();
  await setupCamera();
  audio.unlock();

  running = true;
  statusText.textContent = "Running";
  requestAnimationFrame(loop);
}

function processHands(now) {
  if (!handLandmarker) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    result = handLandmarker.detectForVideo(video, now);
  }
}

function updateState(now) {
  const matched = detectHakariSign(result);

  if (state === STATE.IDLE) {
    if (matched && now - lastTrigger > DETECTION_COOLDOWN) {
      lastTrigger = now;
      triggerFlash();
      setState(STATE.DETECTED, now);
    }
    return;
  }

  if (state === STATE.DETECTED) {
    if (now - stateStart >= DETECTED_DURATION) {
      audio.playDomain();
      setState(STATE.DOMAIN_INTRO, now);
    }
    return;
  }

  if (state === STATE.DOMAIN_INTRO) {
    if (now - stateStart >= DOMAIN_INTRO_DURATION) {
      slotMachine.start(now);
      setState(STATE.ROLLING, now);
    }
    return;
  }

  if (state === STATE.ROLLING) {
    slotMachine.update(now);

    if (slotMachine.finished) {
      if (slotMachine.jackpot) {
        audio.playJackpot();
        setState(STATE.JACKPOT, now);
      } else {
        setState(STATE.RESULT, now);
      }
    }
    return;
  }

  if (state === STATE.RESULT) {
    if (now - stateStart >= RESULT_DURATION) {
      slotMachine.reset();
      setState(STATE.IDLE, now);
    }
    return;
  }

  if (state === STATE.JACKPOT) {
    if (!audio.isJackpotPlaying()) {
      audio.stopJackpot();
      slotMachine.reset();
      setState(STATE.IDLE, now);
    }
  }
}

function updateVisualState() {
  rails.forEach((rail) => {
    rail.classList.remove("show", "domain", "rolling", "jackpot");
  });

  slotGifs.forEach((gif) => {
    gif.classList.remove("show", "jackpot");
  });

  if (state === STATE.DETECTED || state === STATE.DOMAIN_INTRO) {
    rails.forEach((rail) => rail.classList.add("show", "domain"));
    slotGifs.forEach((gif) => gif.classList.add("show"));
  }

  if (state === STATE.ROLLING) {
    rails.forEach((rail) => rail.classList.add("show", "rolling"));
    slotGifs.forEach((gif) => gif.classList.add("show"));
  }

  if (state === STATE.JACKPOT) {
    rails.forEach((rail) => rail.classList.add("show", "jackpot"));
    slotGifs.forEach((gif) => {
      gif.classList.add("show");
      gif.classList.add("jackpot");
    });
  }
}

function render(now) {
  clearCanvas(ctx, canvas);
  updateVisualState();

  const elapsed = now - stateStart;

  if (result) {
    const landmarkAlpha = state === STATE.IDLE ? 0.42 : 0.18;
    drawLandmarks(ctx, result, canvas, landmarkAlpha);
  }

  if (state === STATE.IDLE) {
    drawStatus(ctx, canvas, "Make Hakari sign on both hands");
    return;
  }

  if (state === STATE.DETECTED) {
    drawDarkOverlay(ctx, canvas, 0.38);
    drawText(ctx, "DETECTED", canvas.width / 2, canvas.height / 2 - 10, 44, "#ffffff");
    drawText(ctx, "DOMAIN INITIALIZING", canvas.width / 2, canvas.height / 2 + 38, 20, "#d7e6ff");
    return;
  }

  if (state === STATE.DOMAIN_INTRO) {
    updateParticles(1.2);
    drawDarkOverlay(ctx, canvas, 0.56);
    drawParticleField(ctx, canvas, particles, "rgba(145, 205, 255, 0.42)");
    drawDomainBanner(ctx, canvas, elapsed);
    drawText(ctx, "PRIVATE PURE LOVE TRAIN", canvas.width / 2, canvas.height - 70, 24, "#aecdff");
    return;
  }

  if (state === STATE.ROLLING) {
    updateParticles(1.8);
    drawDarkOverlay(ctx, canvas, 0.62);
    drawParticleField(ctx, canvas, particles, "rgba(150, 210, 255, 0.5)");
    drawText(ctx, "ROLLING...", canvas.width / 2, 138, 42, "white");
    drawText(ctx, "PROBABILITY SHIFT", canvas.width / 2, 180, 18, "#b9d4ff");
    drawSlotMachine(ctx, canvas, slotMachine.values, true);
    return;
  }

  if (state === STATE.RESULT) {
    drawDarkOverlay(ctx, canvas, 0.64);
    drawText(ctx, "NO JACKPOT", canvas.width / 2, 138, 44, "#ff5b78");
    drawText(ctx, "TRY AGAIN", canvas.width / 2, 180, 18, "#ffd3da");
    drawSlotMachine(ctx, canvas, slotMachine.values, false);
    return;
  }

  if (state === STATE.JACKPOT) {
    const centers = getHandCenters(result, canvas.width, canvas.height);
    updateParticles(3.2);

    drawBlueAura(ctx, canvas, now);
    drawParticleField(ctx, canvas, particles, "rgba(130, 205, 255, 0.62)");
    drawText(ctx, "JACKPOT", canvas.width / 2, 110, 62, "#90c8ff");
    drawText(ctx, "FEVER MODE", canvas.width / 2, 165, 26, "#d8ebff");
    drawSlotMachine(ctx, canvas, slotMachine.values, false);
    drawHandGlow(ctx, centers, canvas, now);
    drawText(ctx, "IMMORTALITY BONUS", canvas.width / 2, canvas.height - 42, 22, "#d7ebff");
  }
}

function loop(now) {
  if (!running) return;

  processHands(now);
  updateState(now);
  render(now);

  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;

  try {
    await init();
  } catch (err) {
    console.error("FULL ERROR:", err);
    statusText.textContent = err.message || "Error starting app";
    startBtn.disabled = false;
  }
});