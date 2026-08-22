import type { NavigateFunction } from 'react-router-dom'
import type { TargetSite, VoiceIntent } from '../context/TargetSiteContext'

// The site-chooser screen isn't a real portal, but wrapping it in its own
// TargetSite lets the Sugam widget mount here too — so the assistant is
// available from the moment someone signs in, not just once they've
// already picked a service. Intents here navigate instead of answering a
// balance/appointment-style question.

export function buildHomeSite(navigate: NavigateFunction): TargetSite {
  const intents: VoiceIntent[] = [
    {
      id: 'open-bank',
      label: 'Open the bank demo',
      keywords: ['bank', 'बैंक', 'வங்கி', 'ব্যাংক', 'balance'],
      answer: () => 'Opening साथी Bank.',
      run: () => navigate('/bank'),
    },
    {
      id: 'open-gov',
      label: 'Open the government demo',
      keywords: ['government', 'scholarship', 'सरकार', 'छात्रवृत्ति', 'gov'],
      answer: () => 'Opening the National Scholarship Portal.',
      run: () => navigate('/gov'),
    },
    {
      id: 'open-health',
      label: 'Open the health demo',
      keywords: ['health', 'hospital', 'clinic', 'स्वास्थ्य', 'appointment', 'prescription'],
      answer: () => 'Opening Community Health Centre.',
      run: () => navigate('/health'),
    },
  ]

  return {
    siteName: 'Sugam',
    intents,
    pageSummary: () =>
      'This is the Sugam home screen. Three services are available: साथी Bank for banking, the National ' +
      'Scholarship Portal for government services, and Community Health Centre for healthcare. Say "open bank", ' +
      '"open government", or "open health" to go to one, or use the cards on screen.',
  }
}
