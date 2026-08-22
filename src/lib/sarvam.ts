// Real Indian-language speech, via Sarvam AI — swapped in for Web Speech
// API's uneven regional accuracy. speech.ts tries this first when
// configured and falls back to Web Speech API on any failure, so nothing
// in the UI needs to know which engine actually ran.
//
// Unlike Web Speech API's streaming recognition, Sarvam's STT takes an
// uploaded audio file — so listening here means "record for a fixed
// window, then transcribe," not "stop as soon as you pause." Known
// tradeoff, documented in the README.

const STT_URL = 'https://api.sarvam.ai/speech-to-text'
const TTS_URL = 'https://api.sarvam.ai/text-to-speech'
export const RECORD_MS = 4500
const REQUEST_TIMEOUT_MS = 12000

export class SarvamError extends Error {}

function getApiKey(): string | undefined {
  return import.meta.env.VITE_SARVAM_API_KEY as string | undefined
}

export const isSarvamConfigured = Boolean(getApiKey())

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new SarvamError('Sarvam request timed out.')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

function recordAudio(ms: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop())
          resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
        }
        recorder.onerror = () => {
          stream.getTracks().forEach((t) => t.stop())
          reject(new SarvamError('Recording failed.'))
        }
        recorder.start()
        setTimeout(() => recorder.stop(), ms)
      })
      .catch(() => reject(new SarvamError('Microphone permission was denied.')))
  })
}

export async function transcribeWithSarvam(lang: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new SarvamError('Sarvam is not configured.')

  const audioBlob = await recordAudio(RECORD_MS)
  const form = new FormData()
  form.append('file', audioBlob, 'speech.webm')
  form.append('language_code', lang)
  form.append('model', 'saaras:v3')
  form.append('mode', 'transcribe')

  const res = await fetchWithTimeout(STT_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: form,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new SarvamError(`Sarvam STT failed (${res.status}): ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  if (typeof json.transcript !== 'string') throw new SarvamError('Sarvam STT response missing transcript.')
  return json.transcript
}

let currentAudio: HTMLAudioElement | null = null
// Bumped at the start of every speakWithSarvam call. A response that comes
// back after a *newer* call has already started is stale and must not
// play — otherwise two speak() calls close together (e.g. the
// accessibility bar's read-aloud firing while the Sign tab's gesture
// trigger is also in flight) each finish their own fetch independently and
// both end up playing, since neither request knew about the other.
let speakGeneration = 0

export function stopSarvamAudio() {
  speakGeneration++
  currentAudio?.pause()
  currentAudio = null
}

export async function speakWithSarvam(text: string, lang: string): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) throw new SarvamError('Sarvam is not configured.')

  const myGeneration = ++speakGeneration
  currentAudio?.pause()
  currentAudio = null

  const res = await fetchWithTimeout(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
    body: JSON.stringify({ text, language_code: lang, model: 'bulbul:v3' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new SarvamError(`Sarvam TTS failed (${res.status}): ${body.slice(0, 200)}`)
  }
  const json = await res.json()
  const b64 = json.audios?.[0]
  if (typeof b64 !== 'string') throw new SarvamError('Sarvam TTS response missing audio.')

  // A newer speak() call started while this one was in flight — drop this
  // response silently instead of playing over whatever's current now.
  if (myGeneration !== speakGeneration) return

  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }))
  const audio = new Audio(url)
  currentAudio = audio

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      if (currentAudio === audio) currentAudio = null
      reject(new SarvamError('Audio playback failed.'))
    }
    if (myGeneration !== speakGeneration) {
      // Superseded again in the brief window before we could start playing.
      URL.revokeObjectURL(url)
      resolve()
      return
    }
    audio.play().catch(reject)
  })
}
