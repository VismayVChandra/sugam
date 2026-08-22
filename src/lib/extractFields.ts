// Pulls form fields out of an OCR'd ID document, in two deliberately
// separate passes:
//
//   1. On-device regex (documentFields.ts) for the document type, ID
//      number and date of birth — strict formats, and government ID
//      numbers should not be posted to a third-party API to be parsed.
//   2. This file's LLM call for the fuzzy remainder — names and addresses,
//      which have no reliable pattern and genuinely need judgement. The
//      text is redacted first, so the ID number and DOB are already gone
//      before anything is sent.
//
// Used by the guided form-fill flow when the user photographs an ID
// instead of speaking each field.

import {
  extractDocumentFields,
  redactSensitive,
  type DocumentType,
} from './documentFields'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-20b'

export interface ExtractedKycFields {
  fullName: string | null
  phone: string | null
  address: string | null
  documentType: DocumentType
  idNumber: string | null
  dateOfBirth: string | null
}

async function extractNameAndAddress(
  redactedText: string,
): Promise<{ fullName: string | null; phone: string | null; address: string | null }> {
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
            'Extract the person\'s full name, phone number, and postal address from the OCR text of an Indian ' +
            'identity document (Aadhaar card, ration card, PAN card, or school mark sheet). ' +
            'The text may contain [ID NUMBER REDACTED] or [DATE REDACTED] placeholders — ignore those entirely. ' +
            'Ignore issuing authority names, headings, and slogans; return the document holder\'s own details. ' +
            'Respond with ONLY a JSON object: {"fullName": string|null, "phone": string|null, "address": string|null}. ' +
            'Use null for any field not clearly present. Do not invent data.',
        },
        { role: 'user', content: redactedText },
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

export async function extractKycFields(rawText: string): Promise<ExtractedKycFields> {
  // Pass 1 — on-device, never leaves the browser.
  const docFields = extractDocumentFields(rawText)

  // Pass 2 — only the redacted remainder goes out over the network.
  const { fullName, phone, address } = await extractNameAndAddress(redactSensitive(rawText))

  return { fullName, phone, address, ...docFields }
}
