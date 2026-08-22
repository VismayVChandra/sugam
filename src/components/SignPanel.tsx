import { useEffect, useRef, useState } from 'react'
import { useTargetSite } from '../context/TargetSiteContext'
import { speak, stopSpeaking } from '../lib/speech'
import { classifyGesture, type Gesture } from '../lib/handGesture'

// Pillar 3 (sign language bridge), deliberately scoped honest: not ISL
// translation, just two hand-landmark heuristics (open palm / fist) mapped
// to two page actions. See src/lib/handGesture.ts for why this isn't ML.

type Status = 'idle' | 'loading' | 'running' | 'error'

interface DetectResult {
  landmarks?: { x: number; y: number; z: number }[][]
}
interface MinimalHandLandmarker {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): DetectResult
  close?: () => void
}

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

// Detection is throttled rather than run on every animation frame (up to
// 60/sec) — that was pegging the CPU hard enough to starve the rest of the
// app, and made a held gesture take much longer in real time than intended
// to register. ~8 checks/sec is plenty for a held pose.
const DETECT_INTERVAL_MS = 120
// Time-based, not frame-count-based: a fixed number of *frames* takes
// wildly different amounts of real time depending on how fast the loop is
// actually running under load. A fixed duration doesn't have that problem.
const HOLD_MS = 850
const COOLDOWN_MS = 1800

export default function SignPanel() {
  const site = useTargetSite()
  const videoRef = useRef<HTMLVideoElement>(null)
  const landmarkerRef = useRef<MinimalHandLandmarker | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const lastDetectTimeRef = useRef(0)
  const stableGestureRef = useRef<Gesture>('unclear')
  const stableSinceRef = useRef(0)
  const lastFiredRef = useRef<Gesture>('unclear')
  const lastActionTimeRef = useRef(0)

  const [status, setStatus] = useState<Status>('idle')
  const [gesture, setGesture] = useState<Gesture>('unclear')
  const [lastAction, setLastAction] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    landmarkerRef.current?.close?.()
    landmarkerRef.current = null
    setStatus('idle')
  }

  function loop() {
    rafRef.current = requestAnimationFrame(loop)

    const now = performance.now()
    if (now - lastDetectTimeRef.current < DETECT_INTERVAL_MS) return
    lastDetectTimeRef.current = now

    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker || video.readyState < 2) return

    const result = landmarker.detectForVideo(video, now)
    const hand = result.landmarks?.[0]
    const g: Gesture = hand ? classifyGesture(hand) : 'unclear'

    if (g === stableGestureRef.current) {
      // still the same reading — stableSinceRef keeps its original timestamp
    } else {
      stableGestureRef.current = g
      stableSinceRef.current = now
    }
    setGesture(g)

    // Require the gesture to have read the same for a real stretch of wall
    // time, fire once per transition, and enforce a cooldown after any
    // trigger — otherwise a noisy blip (tracking flickers to "unclear" and
    // back) can re-fire the same gesture moments later.
    if (
      g !== 'unclear' &&
      g !== lastFiredRef.current &&
      now - stableSinceRef.current >= HOLD_MS &&
      now - lastActionTimeRef.current > COOLDOWN_MS
    ) {
      lastFiredRef.current = g
      lastActionTimeRef.current = now
      if (g === 'open') {
        setLastAction('🖐 Open palm — reading page aloud')
        speak(site.pageSummary(), 'en-IN').catch(() => {})
      } else if (g === 'fist') {
        setLastAction('✊ Fist — stopped reading')
        stopSpeaking()
      }
    }
    if (g === 'unclear') lastFiredRef.current = 'unclear'
  }

  async function startCamera() {
    setError('')
    setStatus('loading')
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
      landmarkerRef.current = (await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
      })) as unknown as MinimalHandLandmarker

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus('running')
      loop()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not start the camera or load the hand-tracking model. This needs a webcam and an internet connection.',
      )
      stopCamera()
      setStatus('error')
    }
  }

  return (
    <div className="sugam-tabpanel">
      <p className="sugam-hint">
        Proof-of-concept, not full ISL translation: two gestures only. 🖐 open palm reads the page aloud, ✊ fist
        stops it.
      </p>

      <video
        ref={videoRef}
        muted
        playsInline
        className="sugam-sign-video"
        style={{ display: status === 'loading' || status === 'running' ? 'block' : 'none' }}
      />

      {(status === 'idle' || status === 'error') && (
        <button className="sugam-mic" onClick={startCamera}>
          📷 {status === 'error' ? 'Try again' : 'Start camera'}
        </button>
      )}
      {status === 'loading' && <p className="sugam-hint">Loading hand-tracking model…</p>}

      {status === 'running' && (
        <>
          <p className="sugam-answer">
            Detected: {gesture === 'open' ? '🖐 open palm' : gesture === 'fist' ? '✊ fist' : '…'}
          </p>
          {lastAction && <p className="sugam-transcript">{lastAction}</p>}
          <button onClick={stopCamera}>Stop camera</button>
        </>
      )}

      {error && <p className="sugam-error">{error}</p>}
    </div>
  )
}
