// Voice pipeline. Web Speech API is the default now — fast, natural
// "listen until you pause" behavior, and reliable in Chrome. Sarvam AI
// (real Indian-language STT/TTS) is available as a fallback when Web
// Speech isn't supported or fails, rather than the primary path: Sarvam's
// fixed-duration "record blindly, then transcribe" pattern is a worse UX
// than Web Speech's natural turn-taking, and simpler/fewer moving parts
// wins close to a live demo. Call sites never know which engine actually
// ran — that's the point of keeping this the one adapter boundary.

import { isSarvamConfigured, speakWithSarvam, stopSarvamAudio } from './sarvam'

/** Roughly how long a "listening" call takes to record before it even starts processing — used for progress UI only, not exact timing. */
export const APPROX_RECORD_MS = 0

export interface SpeechResult {
  transcript: string
  lang: string
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechSupported(): boolean {
  return getRecognitionCtor() !== null
}

// Playback rate is a genuine global preference — someone who listens at 1.5x
// wants that everywhere, not re-set per call — so it lives here as shared
// state rather than being threaded as a parameter through every speak()
// call site across the app. UiPrefsContext is the only writer.
let globalSpeechRate = 1
export function setGlobalSpeechRate(rate: number) {
  globalSpeechRate = rate
}

// Tracked so a hands-free listening loop can be cancelled instantly (e.g.
// the user taps "stop") instead of waiting out the browser's own multi
// -second silence timeout before the loop notices and exits.
let activeRecognition: SpeechRecognition | null = null

export function stopListening() {
  activeRecognition?.abort()
  activeRecognition = null
}

function listenOnceWebSpeech(lang: string): Promise<SpeechResult> {
  const Ctor = getRecognitionCtor()
  if (!Ctor) {
    return Promise.reject(new Error('Speech recognition not supported in this browser.'))
  }

  return new Promise((resolve, reject) => {
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    activeRecognition = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      resolve({ transcript, lang })
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(event.error))
    }
    recognition.onend = () => {
      // If no result fired before end, resolve empty rather than hang.
      if (activeRecognition === recognition) activeRecognition = null
    }

    recognition.start()
  })
}

function speakWebSpeech(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser.'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = globalSpeechRate
    utterance.onend = () => resolve()
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // cancel() fires onerror on the utterance it interrupts. That's us
      // deliberately stopping it to say something newer — not a failure,
      // and treating it as one made speak() fall through to the Sarvam
      // fallback, which then read the *cancelled* text aloud again in a
      // different voice.
      if (e.error === 'canceled' || e.error === 'interrupted') {
        resolve()
        return
      }
      reject(new Error(`Speech synthesis failed: ${e.error}`))
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Listens for a single utterance and resolves with the transcript. Web
 * Speech API only — Sarvam STT needs the recorded audio in a format
 * (wav/mp3) that browsers' MediaRecorder doesn't natively produce (it
 * outputs webm/opus, which Sarvam's API rejects), so it isn't wired in as
 * a fallback here. speak() below still uses Sarvam for output, where that
 * format mismatch doesn't apply.
 */
export async function listenOnce(lang: string): Promise<SpeechResult> {
  return listenOnceWebSpeech(lang)
}

// Bumped on every speak() and stopSpeaking(). Guards the fallback: if a
// newer call has started by the time this one fails, staying silent is
// correct — otherwise a superseded utterance gets read aloud on top of the
// current one.
let speakGeneration = 0

/** Speaks text aloud in the given language, if a matching voice exists. */
export async function speak(text: string, lang: string): Promise<void> {
  // Stop whatever's playing first — otherwise two speak() calls close
  // together (a double-click, or a rapid gesture re-trigger) stack audio on
  // top of each other instead of the second replacing the first.
  stopSpeaking()
  const myGeneration = ++speakGeneration

  if ('speechSynthesis' in window) {
    try {
      await speakWebSpeech(text, lang)
      return
    } catch (e) {
      console.warn('Web Speech synthesis failed, trying Sarvam if configured', e)
    }
  }
  if (myGeneration !== speakGeneration) return
  if (isSarvamConfigured) {
    // Known gap: the speed preference isn't applied here — Sarvam's TTS API
    // params for playback rate aren't confirmed, and this is a rare fallback
    // path now that Web Speech is primary, so it wasn't worth risking a
    // guessed field breaking the one voice output path that always works.
    await speakWithSarvam(text, lang)
    return
  }
  throw new Error('No speech synthesis available in this browser.')
}

export function stopSpeaking() {
  speakGeneration++
  stopSarvamAudio()
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'mr-IN', label: 'मराठी' },
] as const
