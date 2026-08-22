// Text simplification — Groq (Llama-family) chat completions, OpenAI-compatible
// endpoint, called directly via fetch so no extra SDK dependency is needed.
// Needs VITE_GROQ_API_KEY in .env.local; see .env.example.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'

export class SimplifyConfigError extends Error {}

export async function simplifyText(rawText: string, targetLangLabel = 'English'): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!apiKey) {
    throw new SimplifyConfigError('VITE_GROQ_API_KEY is not set — add it to .env.local to enable simplification.')
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            `You rewrite official documents (forms, bills, prescriptions) in ${targetLangLabel} at a plain-language, ` +
            'low-literacy reading level. Keep every fact, number, date and instruction. Use short sentences. ' +
            'Do not add information that is not in the source text. Output only the rewritten text.',
        },
        { role: 'user', content: rawText },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const json = await res.json()
  const content = json.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('Groq response missing content.')
  }
  return content.trim()
}

/** A second, even-simpler pass on a single word/phrase — for "tap a word to explain it" inside already-simplified text. */
export async function explainWord(word: string, sentence: string, targetLangLabel = 'English'): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!apiKey) {
    throw new SimplifyConfigError('VITE_GROQ_API_KEY is not set — add it to .env.local to enable simplification.')
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            `Explain a single word or short phrase from a document, in ${targetLangLabel}, in one short plain-language ` +
            'sentence a young child or first-time reader could understand. Use the surrounding sentence only for ' +
            'context — do not repeat it. Output only the explanation, nothing else.',
        },
        { role: 'user', content: `Sentence: "${sentence}"\nWord or phrase to explain: "${word}"` },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const explJson = await res.json()
  const explContent = explJson.choices?.[0]?.message?.content
  if (typeof explContent !== 'string') {
    throw new Error('Groq response missing content.')
  }
  return explContent.trim()
}
