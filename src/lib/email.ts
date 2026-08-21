const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

/** Pulls the first email-shaped substring out of OCR'd text — plain regex, no LLM needed. */
export function extractEmailFromText(text: string): string | null {
  const match = text.match(EMAIL_REGEX)
  return match ? match[0] : null
}

/** Speech-to-text renders spoken emails as words ("ramesh at gmail dot com") — turn that back into an address. */
export function normalizeSpokenEmail(transcript: string): string {
  return transcript
    .toLowerCase()
    .trim()
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+underscore\s+/g, '_')
    .replace(/\s+dash\s+/g, '-')
    .replace(/\s+/g, '')
}
