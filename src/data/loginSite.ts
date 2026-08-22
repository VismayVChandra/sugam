import type { TargetSite, VoiceIntent } from '../context/TargetSiteContext'

// Sugam is present even before you're signed in — someone who can't read
// small print or navigate a mouse well shouldn't have to get past a login
// form unassisted before the accessibility layer kicks in. Intents here
// answer questions about the sign-in process itself and can switch between
// sign-in/sign-up, rather than acting on account data (there isn't any yet).

export function buildLoginSite(mode: 'signin' | 'signup', toggleMode: () => void): TargetSite {
  const intents: VoiceIntent[] = [
    {
      id: 'switch-to-signup',
      label: 'I need to create an account',
      keywords: ['create account', 'sign up', 'new account', 'register', 'खाता बनाएं'],
      answer: () => (mode === 'signup' ? "You're already on the create-account screen." : 'Switching to create an account.'),
      run: () => {
        if (mode !== 'signup') toggleMode()
      },
    },
    {
      id: 'switch-to-signin',
      label: 'I already have an account',
      keywords: ['sign in', 'log in', 'already have an account', 'साइन इन'],
      answer: () => (mode === 'signin' ? "You're already on the sign-in screen." : 'Switching to sign in.'),
      run: () => {
        if (mode !== 'signin') toggleMode()
      },
    },
    {
      id: 'how-voice-helper-works',
      label: 'How does "Say your email" work?',
      keywords: ['say your email', 'voice email', 'speak email'],
      answer: () =>
        'Tap "Say your email," then speak your address clearly — say "at" and "dot" for the symbols, like ' +
        '"priya at gmail dot com." It fills the email field for you; you still type your password yourself.',
    },
    {
      id: 'how-photo-helper-works',
      label: 'How does the photo autofill work?',
      keywords: ['autofill email from a photo', 'photo email', 'scan email'],
      answer: () =>
        'Tap "Autofill email from a photo" and take a picture of anything with your email address printed on it — ' +
        'an ID card or a letter, for example. It only reads the email; nothing else on the page is sent anywhere.',
    },
    {
      id: 'is-password-safe',
      label: 'Is my password safe here?',
      keywords: ['password safe', 'is my password secure', 'password security'],
      answer: () =>
        'Your password is always typed, never spoken or photographed. It is checked by Supabase, not by this app, ' +
        'and this app never sees or stores it.',
    },
  ]

  return {
    siteName: 'Sugam',
    intents,
    pageSummary: () =>
      mode === 'signin'
        ? 'This is the Sugam sign-in screen. Enter your email and password, or say "I need to create an account" ' +
          'if you are new. You can also say "say your email" to fill the email field by voice.'
        : 'This is the Sugam account creation screen. Enter an email and a password of at least six characters, or ' +
          'say "I already have an account" to go back to signing in.',
  }
}
