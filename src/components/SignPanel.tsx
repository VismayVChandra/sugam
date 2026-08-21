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
const HOLD_FRAMES = 10

export default function SignPanel() {
  const site = useTargetSite()
  const videoRef = useRef<HTMLVideoElement>(null)
  const landmarkerRef = useRef<MinimalHandLandmarker | null>(null)
  const rafRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)
  const stableGestureRef = useRef<Gesture>('unclear')
  const stableCountRef = useRef(0)
  const lastFiredRef = useRef<Gesture>('unclear')

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
    const video = videoRef.current
    const landmarker = landmarkerRef.current
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }

    const result = landmarker.detectForVideo(video, performance.now())
    const hand = result.landmarks?.[0]
    const g: Gesture = hand ? classifyGesture(hand) : 'unclear'

    if (g === stableGestureRef.current) {
      stableCountRef.current++
    } else {
      stableGestureRef.current = g
      stableCountRef.current = 0
    }
    setGesture(g)

    // Require the gesture to hold steady for a beat, and fire once per
    // transition — otherwise "open palm" re-triggers every single frame.
    if (stableCountRef.current === HOLD_FRAMES && g !== 'unclear' && g !== lastFiredRef.current) {
      lastFiredRef.current = g
      if (g === 'open') {
        setLastAction('🖐 Open palm — reading page aloud')
        speak(site.pageSummary(), 'en-IN').catch(() => {})
      } else if (g === 'fist') {
        setLastAction('✊ Fist — stopped reading')
        stopSpeaking()
      }
    }
    if (g === 'unclear') lastFiredRef.current = 'unclear'

    rafRef.current = requestAnimationFrame(loop)
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
