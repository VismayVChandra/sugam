// Deliberately not a trained classifier — the ISL pillar was scoped as an
// honest, small proof-of-concept, not "solved sign language." This is pure
// landmark geometry: for each of 4 fingers, is the tip above its middle
// knuckle (extended) or not (curled)? Count extended fingers to call it
// open-palm vs fist. No ML, no training data, works from MediaPipe's 21
// hand landmarks alone.

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

  let extended = 0
  for (const { tip, pip } of FINGER_JOINTS) {
    // Image y grows downward, so an extended (pointing-up) finger has a
    // smaller y at the tip than at its pip joint.
    if (landmarks[tip].y < landmarks[pip].y) extended++
  }

  if (extended >= 3) return 'open'
  if (extended <= 1) return 'fist'
  return 'unclear'
}
