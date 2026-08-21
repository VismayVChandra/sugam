import type { VoiceIntent } from '../context/TargetSiteContext'

export function matchIntent(transcript: string, intents: VoiceIntent[]): VoiceIntent | null {
  const lower = transcript.toLowerCase()
  return intents.find((intent) => intent.keywords.some((k) => lower.includes(k.toLowerCase()))) ?? null
}
