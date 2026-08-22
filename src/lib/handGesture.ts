// Deliberately not a trained classifier — the ISL pillar was scoped as an
// honest, small proof-of-concept, not "solved sign language." This is pure
// landmark geometry: for each of 4 fingers, is the tip clearly above its
// middle knuckle (extended) or not (curled)? Requires ALL 4 fingers to
// agree — not a majority — and a margin scaled to hand size, not a fixed
// pixel gap, to cut down on the false triggers borderline/noisy tracking
// caused with a looser majority-vote version.

export type Gesture = 'open' | 'fist' | 'unclear'

interface Point {
  x: number
  y: number
}

const FINGER_JOINTS: { tip: number; pip: number }[] = [
  { tip: 8, pip: 6 }, // index
  { tip: 12, pip: 10 }, // middle
  { tip: 16, pip: 14 }, // ring
  { tip: 20, pip: 18 }, // pinky
]

export function classifyGesture(landmarks: Point[]): Gesture {
  if (landmarks.length < 21) return 'unclear'

  // Wrist-to-middle-knuckle distance as a scale reference, so the required
  // margin adapts to how close/far the hand is from the camera.
  const wrist = landmarks[0]
  const middleMcp = landmarks[9]
  const handScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y) || 1
  const margin = handScale * 0.15

  let extended = 0
  for (const { tip, pip } of FINGER_JOINTS) {
    // Image y grows downward — an extended (pointing-up) finger has its tip
    // meaningfully above (smaller y than) its pip joint, not just barely.
    if (landmarks[pip].y - landmarks[tip].y > margin) extended++
  }

  if (extended === 4) return 'open'
  if (extended === 0) return 'fist'
  return 'unclear'
}
