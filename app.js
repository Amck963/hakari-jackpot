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
  drawStatus
} from "./effects.js";

const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const statusText = document.getElementById("statusText");

let handLandmarker = null;
let running = false;
let lastVideoTime = -1;
let result = null;

const audio = new AudioManager();
const slotMachine = new SlotMachine();

const STATE = {
  IDLE: "idle",
  DOMAIN: "domain",
  ROLLING: "rolling",
  RESULT: "result",
  JACKPOT: "jackpot"
};

let state = STATE.IDLE;
let domainStart = 0;
let resultStart = 0;
let jackpotStart = 0;
let lastTrigger = 0;

const DETECTION_COOLDOWN = 5000;
const DOMAIN_DURATION = 1800;
const RESULT_DURATION = 2000;
const JACKPOT_DURATION = 9000;

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
      state = STATE.DOMAIN;
      domainStart = now;
      lastTrigger = now;
      audio.playDomain();
    }
  } else if (state === STATE.DOMAIN) {
    if (now - domainStart >= DOMAIN_DURATION) {
      state = STATE.ROLLING;
      slotMachine.start();
    }
  } else if (state === STATE.ROLLING) {
    slotMachine.update(now);

    if (slotMachine.finished) {
      if (slotMachine.jackpot) {
        state = STATE.JACKPOT;
        jackpotStart = now;
        audio.playJackpot();
      } else {
        state = STATE.RESULT;
        resultStart = now;
      }
    }
  } else if (state === STATE.RESULT) {
    if (now - resultStart >= RESULT_DURATION) {
      slotMachine.reset();
      state = STATE.IDLE;
    }
  } else if (state === STATE.JACKPOT) {
    if (now - jackpotStart >= JACKPOT_DURATION) {
      audio.stopJackpot();
      slotMachine.reset();
      state = STATE.IDLE;
    }
  }
}

function render(now) {
  clearCanvas(ctx, canvas);

  if (result) {
    drawLandmarks(ctx, result, canvas);
  }

  if (state === STATE.IDLE) {
    drawStatus(ctx, canvas, "Make Hakari sign on both hands");
  }

  if (state === STATE.DOMAIN) {
    drawDarkOverlay(ctx, canvas, 0.68);
    drawDomainBanner(ctx, canvas);
  }

  if (state === STATE.ROLLING) {
    drawDarkOverlay(ctx, canvas, 0.58);
    drawText(ctx, "ROLLING...", canvas.width / 2, 140, 42, "white");
    drawSlotMachine(ctx, canvas, slotMachine.values);
  }

  if (state === STATE.RESULT) {
    drawDarkOverlay(ctx, canvas, 0.58);
    drawSlotMachine(ctx, canvas, slotMachine.values);
    drawText(ctx, "NO JACKPOT", canvas.width / 2, 140, 42, "#ff4d6d");
  }

  if (state === STATE.JACKPOT) {
    const centers = getHandCenters(result, canvas.width, canvas.height);
    drawBlueAura(ctx, canvas, now - jackpotStart);
    drawSlotMachine(ctx, canvas, slotMachine.values);
    drawText(ctx, "JACKPOT", canvas.width / 2, 110, 58, "#8bc2ff");
    drawText(ctx, "FEVER MODE", canvas.width / 2, canvas.height - 40, 26, "#d8ebff");
    drawHandGlow(ctx, centers, canvas, now - jackpotStart);
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
    console.error(err);
    statusText.textContent = "Failed to start webcam or hand tracker";
    startBtn.disabled = false;
  }
});