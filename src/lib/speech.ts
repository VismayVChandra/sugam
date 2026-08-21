// Voice pipeline — Web Speech API baseline (Hr 1–7 of the build plan).
// Swap `listenOnce`/`speak` internals for Bhashini/Sarvam calls later without
// touching call sites; the signature is the adapter boundary.

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

/** Listens for a single utterance and resolves with the transcript. */
export function listenOnce(lang: string): Promise<SpeechResult> {
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

/** Speaks text aloud in the given language, if a matching voice exists. */
export function speak(text: string, lang: string): Promise<void> {
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

export function stopSpeaking() {
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
