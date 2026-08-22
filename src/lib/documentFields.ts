// Document-specific field extraction, done entirely on-device with regex —
// no network call, ever.
//
// Two reasons this isn't handed to the LLM along with everything else:
//   1. Privacy. An Aadhaar number is exactly the kind of data that should
//      not be posted to a third-party API just to be parsed. Formats here
//      are strict and predictable, so regex does the job without it ever
//      leaving the browser.
//   2. Reliability. "12 digits in 4-4-4 groups" is a rule, not a judgement
//      call — a deterministic match beats a model guess for a number that
//      must be exactly right.
//
// redactSensitive() below is then used to strip these out of the text
// before the remaining prose is sent off for name/address extraction.

export type DocumentType = 'aadhaar' | 'pan' | 'ration' | 'marksheet' | 'unknown'

export interface DocumentFields {
  documentType: DocumentType
  /** Masked for display — full value is deliberately never surfaced. */
  idNumber: string | null
  dateOfBirth: string | null
}

const AADHAAR_RE = /\b(\d{4})\s?-?\s?(\d{4})\s?-?\s?(\d{4})\b/
const PAN_RE = /\b([A-Z]{5}\d{4}[A-Z])\b/
// Ration card numbering varies by state; this is the common alphanumeric run.
const RATION_RE = /\b([A-Z]{2,3}[-/]?\d{6,12})\b/
const DOB_RE = /\b(\d{2})[-/.](\d{2})[-/.](\d{4})\b/
const DOB_YEAR_ONLY_RE = /\b(?:year of birth|birth year|yob)\s*:?\s*(\d{4})\b/i

function detectType(text: string): DocumentType {
  const t = text.toLowerCase()
  if (
    t.includes('aadhaar') ||
    t.includes('aadhar') ||
    t.includes('uidai') ||
    t.includes('unique identification') ||
    t.includes('आधार')
  ) {
    return 'aadhaar'
  }
  if (t.includes('income tax') || t.includes('permanent account')) return 'pan'
  if (t.includes('ration') || t.includes('public distribution') || t.includes('राशन')) return 'ration'
  if (t.includes('marks') || t.includes('marksheet') || t.includes('examination') || t.includes('board of')) {
    return 'marksheet'
  }
  return 'unknown'
}

/**
 * Masks all but the last 4 digits, the way Indian KYC forms and UIDAI's own
 * guidance handle Aadhaar. Also the right call for this app specifically:
 * someone helping a low-vision user read their screen shouldn't end up
 * reading their full ID number out loud.
 */
export function maskIdNumber(raw: string): string {
  const compact = raw.replace(/[\s-]/g, '')
  if (compact.length <= 4) return compact
  return 'XXXX XXXX ' + compact.slice(-4)
}

export function extractDocumentFields(text: string): DocumentFields {
  const documentType = detectType(text)

  let idNumber: string | null = null
  const aadhaar = text.match(AADHAAR_RE)
  const pan = text.match(PAN_RE)
  const ration = text.match(RATION_RE)

  if (documentType === 'pan' && pan) idNumber = pan[1]
  else if (aadhaar) idNumber = maskIdNumber(aadhaar[0])
  else if (pan) idNumber = pan[1]
  else if (documentType === 'ration' && ration) idNumber = ration[1]

  let dateOfBirth: string | null = null
  const dob = text.match(DOB_RE)
  if (dob) {
    dateOfBirth = `${dob[1]}/${dob[2]}/${dob[3]}`
  } else {
    const yearOnly = text.match(DOB_YEAR_ONLY_RE)
    if (yearOnly) dateOfBirth = yearOnly[1]
  }

  return { documentType, idNumber, dateOfBirth }
}

/** Strips ID numbers and dates out of text before any of it is sent off-device. */
export function redactSensitive(text: string): string {
  return text
    .replace(new RegExp(AADHAAR_RE, 'g'), '[ID NUMBER REDACTED]')
    .replace(new RegExp(PAN_RE, 'g'), '[ID NUMBER REDACTED]')
    .replace(new RegExp(RATION_RE, 'g'), '[ID NUMBER REDACTED]')
    .replace(new RegExp(DOB_RE, 'g'), '[DATE REDACTED]')
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  aadhaar: 'Aadhaar card',
  pan: 'PAN card',
  ration: 'Ration card',
  marksheet: 'Mark sheet',
  unknown: 'Document',
}
