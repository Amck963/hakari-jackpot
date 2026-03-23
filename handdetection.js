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
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6
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

  const thumbIndexClose = distance(thumbTip, indexTip) < 0.08;
  const otherFingersVisible =
    middleTip.y < 0.9 &&
    ringTip.y < 0.95 &&
    pinkyTip.y < 1.0;

  return thumbIndexClose && otherFingersVisible;
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