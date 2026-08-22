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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      resolve({ transcript, lang })
    }
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      reject(new Error(event.error))
    }
    recognition.onend = () => {
      // If no result fired before end, resolve empty rather than hang.
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
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Speech synthesis failed.'))
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

/** Speaks text aloud in the given language, if a matching voice exists. */
export async function speak(text: string, lang: string): Promise<void> {
  // Stop whatever's currently playing first — otherwise two speak() calls
  // close together (a double-click, or a rapid gesture re-trigger) stack
  // audio on top of each other instead of the second replacing the first.
  stopSpeaking()
  if ('speechSynthesis' in window) {
    try {
      await speakWebSpeech(text, lang)
      return
    } catch (e) {
      console.warn('Web Speech synthesis failed, trying Sarvam if configured', e)
    }
  }
  if (isSarvamConfigured) {
    await speakWithSarvam(text, lang)
    return
  }
  throw new Error('No speech synthesis available in this browser.')
}

export function stopSpeaking() {
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
