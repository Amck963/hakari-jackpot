import {
  FilesetResolver,
  HandLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "assets/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.65,
    minHandPresenceConfidence: 0.65,
    minTrackingConfidence: 0.65
  });

  return handLandmarker;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isCircleSign(handLandmarks) {
  const thumbTip = handLandmarks[4];
  const indexTip = handLandmarks[8];
  const middleTip = handLandmarks[12];
  const ringTip = handLandmarks[16];
  const pinkyTip = handLandmarks[20];
  const wrist = handLandmarks[0];

  const thumbIndexClose = distance(thumbTip, indexTip) < 0.08;

  const handIsVisible =
    wrist.x > 0.02 &&
    wrist.x < 0.98 &&
    wrist.y > 0.02 &&
    wrist.y < 0.98;

  const fingersOutEnough =
    middleTip.y < wrist.y + 0.08 &&
    ringTip.y < wrist.y + 0.12 &&
    pinkyTip.y < wrist.y + 0.16;

  return thumbIndexClose && handIsVisible && fingersOutEnough;
}

export function detectHakariSign(result) {
  if (!result || !result.landmarks || result.landmarks.length < 2) {
    return false;
  }

  let valid = 0;
  for (const hand of result.landmarks.slice(0, 2)) {
    if (isCircleSign(hand)) valid++;
  }

  return valid === 2;
}

export function getHandCenters(result, width, height) {
  if (!result || !result.landmarks) return [];

  return result.landmarks.map((hand) => {
    const wrist = hand[0];
    return {
      x: wrist.x * width,
      y: wrist.y * height
    };
  });
}