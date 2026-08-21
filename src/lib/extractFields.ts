// Pulls structured KYC fields out of OCR'd ID/document text via Groq.
// Used by the guided form-fill flow (Hr 13–17 stretch) when the user
// photographs an ID instead of speaking each field.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'

export interface ExtractedKycFields {
  fullName: string | null
  phone: string | null
  address: string | null
}

export async function extractKycFields(rawText: string): Promise<ExtractedKycFields> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY is not set — add it to .env.local.')
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract a full name, phone number, and address from the given OCR text of an ID document or form. ' +
            'Respond with ONLY a JSON object: {"fullName": string|null, "phone": string|null, "address": string|null}. ' +
            'Use null for any field not clearly present. Do not invent data.',
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

  try {
    const parsed = JSON.parse(content)
    return {
      fullName: parsed.fullName ?? null,
      phone: parsed.phone ?? null,
      address: parsed.address ?? null,
    }
  } catch {
    throw new Error('Could not parse extracted fields from the model response.')
  }
}
