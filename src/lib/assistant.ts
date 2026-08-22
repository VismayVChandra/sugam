import type { VoiceIntent } from '../context/TargetSiteContext'

// The conversational brain behind the Voice tab. Replaces rigid keyword
// matching ("balance" had to appear literally) with an LLM that understands
// intent — "how much money do I have", "kitna paisa hai", "am I broke" all
// reach the same answer.
//
// Two hard rules shape the prompt, both about not lying to someone who may
// be relying on this to manage real money or medication:
//   1. It may ONLY use the facts passed in from the current page. It has no
//      other knowledge of the user and must never invent an account number,
//      balance, or appointment date.
//   2. If the answer isn't in those facts, it must say so plainly rather
//      than guessing.
//
// Reuses the same Groq endpoint/key as simplify.ts — no new service.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'
const REQUEST_TIMEOUT_MS = 15000
/** Turns of back-and-forth kept for follow-ups ("and the one before that?"). */
const HISTORY_TURNS = 6

export class AssistantConfigError extends Error {}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantReply {
  /** What to show and speak back to the user. */
  reply: string
  /** Id of a site action the assistant chose to run, if any. */
  actionId: string | null
}

export function isAssistantConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GROQ_API_KEY)
}

function buildSystemPrompt(siteName: string, facts: string, intents: VoiceIntent[], langLabel: string): string {
  const actionList = intents.map((i) => `- ${i.id}: ${i.label ?? i.keywords[0]}`).join('\n')

  return [
    `You are Sugam, an accessibility assistant helping someone use "${siteName}".`,
    `Many users have low literacy, low vision, or are not comfortable in English. Be warm, brief, and concrete.`,
    ``,
    `THE ONLY FACTS YOU KNOW ABOUT THIS USER:`,
    facts,
    ``,
    `Rules you must never break:`,
    `- Answer ONLY from the facts above. Never invent or guess an account number, amount, date, name, or status.`,
    `- If the answer is not in those facts, say plainly that you cannot see that on this page, and suggest what they could do instead.`,
    `- Never give financial, legal, or medical advice. You may read out and explain what is on the page; you must not tell someone what to do with their money or medication.`,
    `- Reply in ${langLabel}. Keep it to 1-2 short sentences — it will be read aloud.`,
    `- Do not use markdown, bullet points, or emoji. Plain spoken sentences only.`,
    ``,
    `You can also perform one of these page actions when the user asks for it:`,
    actionList || '(none available on this page)',
    ``,
    `Respond with ONLY a JSON object, no other text:`,
    `{"reply": "<what to say>", "actionId": "<one id from the list above, or null>"}`,
    `Set actionId only when the user actually wants that action performed. For a plain question, use null.`,
  ].join('\n')
}

export async function askAssistant(opts: {
  question: string
  siteName: string
  facts: string
  intents: VoiceIntent[]
  history: ChatTurn[]
  langLabel: string
}): Promise<AssistantReply> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!apiKey) {
    throw new AssistantConfigError('VITE_GROQ_API_KEY is not set — add it to .env.local to enable the assistant.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(opts.siteName, opts.facts, opts.intents, opts.langLabel) },
          ...opts.history.slice(-HISTORY_TURNS),
          { role: 'user', content: opts.question },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Assistant request failed (${res.status}): ${body.slice(0, 200)}`)
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('Assistant response missing content.')

    let parsed: { reply?: unknown; actionId?: unknown }
    try {
      parsed = JSON.parse(content)
    } catch {
      // Model ignored the JSON instruction — treat the raw text as the reply
      // rather than failing the whole turn on a formatting slip.
      return { reply: content.trim(), actionId: null }
    }

    const reply = typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : null
    if (!reply) throw new Error('Assistant response missing a reply.')

    // Only honour an actionId that actually exists on this page — the model
    // must not be able to trigger something that isn't really there.
    const actionId =
      typeof parsed.actionId === 'string' && opts.intents.some((i) => i.id === parsed.actionId)
        ? parsed.actionId
        : null

    return { reply, actionId }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('The assistant took too long to respond. Please try again.')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}
