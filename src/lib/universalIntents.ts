import type { VoiceIntent } from '../context/TargetSiteContext'

// Available on every target site without any per-site wiring — this is
// Pillar 4 (adaptive input): commands that act on the page itself rather
// than answering a question. Any new site gets these for free just by
// being wrapped in a TargetSiteProvider.

interface UiPrefsActions {
  toggleLargeText: () => void
  toggleHighContrast: () => void
}

export function buildUniversalIntents(prefs: UiPrefsActions): VoiceIntent[] {
  return [
    {
      id: '__scroll_down',
      keywords: ['scroll down', 'नीचे स्क्रॉल', 'नीचे जाओ'],
      answer: () => 'Scrolling down.',
      run: () => window.scrollBy({ top: 400, behavior: 'smooth' }),
    },
    {
      id: '__scroll_up',
      keywords: ['scroll up', 'ऊपर स्क्रॉल', 'ऊपर जाओ'],
      answer: () => 'Scrolling up.',
      run: () => window.scrollBy({ top: -400, behavior: 'smooth' }),
    },
    {
      id: '__submit_form',
      keywords: ['submit', 'सबमिट', 'जमा करो'],
      answer: () => {
        const btn = document.querySelector<HTMLButtonElement>('form button[type="submit"]')
        return btn ? 'Submitting the form.' : 'There is no form to submit right now.'
      },
      run: () => document.querySelector<HTMLButtonElement>('form button[type="submit"]')?.click(),
    },
    {
      id: '__large_text',
      keywords: ['large text', 'bigger text', 'बड़ा टेक्स्ट', 'increase text size'],
      answer: () => 'Toggling large text.',
      run: () => prefs.toggleLargeText(),
    },
    {
      id: '__high_contrast',
      keywords: ['high contrast', 'contrast mode', 'हाई कॉन्ट्रास्ट'],
      answer: () => 'Toggling high contrast.',
      run: () => prefs.toggleHighContrast(),
    },
  ]
}
