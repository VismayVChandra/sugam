// Cleans up a spoken phone number transcript. Browser STT often renders
// digit strings as spaced groups ("98765 43210") or, less often, spelled
// out ("nine eight seven...") — normalize both to a plain digit string.

const NUMBER_WORDS: Record<string, string> = {
  zero: '0',
  oh: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
}

export function normalizePhone(transcript: string): string {
  const digitsOnly = transcript.replace(/\D/g, '')
  if (digitsOnly.length >= 10) return digitsOnly

  const words = transcript
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  let out = ''
  for (const w of words) {
    if (/^\d+$/.test(w)) out += w
    else if (w in NUMBER_WORDS) out += NUMBER_WORDS[w]
  }
  return out || digitsOnly
}
