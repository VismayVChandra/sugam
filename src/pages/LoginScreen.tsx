import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSpeechSupported, listenOnce, speak } from '../lib/speech'
import { extractText } from '../lib/ocr'
import { extractEmailFromText, normalizeSpokenEmail } from '../lib/email'
import { TargetSiteProvider } from '../context/TargetSiteContext'
import { buildLoginSite } from '../data/loginSite'
import SugamWordmark from '../components/SugamWordmark'
import AccessibilityBar from '../components/AccessibilityBar'
import SugamWidget from '../components/SugamWidget'
import './LoginScreen.css'

// Real authentication: Supabase verifies the password server-side and
// issues the session (see AuthContext.tsx). Nothing here decides who's
// "authenticated" — this file only collects credentials.
//
// The voice/photo helpers below fill the EMAIL field only. The password is
// always typed, masked, and never spoken or photographed — dictating or
// photographing a password would defeat the point of having one.

type Mode = 'signin' | 'signup'

export default function LoginScreen() {
  const { signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const loginSite = buildLoginSite(mode, () => setMode((m) => (m === 'signin' ? 'signup' : 'signin')))

  async function submit() {
    if (!email || !password) {
      setError('Please fill in both email and password first.')
      return
    }
    setError('')
    setInfo('')
    setSubmitting(true)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else if (mode === 'signup') {
      setInfo(
        'Account created. If email confirmation is enabled on this Supabase project, check your inbox and confirm before signing in — otherwise you may already be signed in.',
      )
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit()
  }

  return (
    <TargetSiteProvider site={loginSite}>
      <div>
        <AccessibilityBar />
        <div className="login-screen">
          <main className="login-card">
            <SugamWordmark size={34} />
            <p className="login-eyebrow">{mode === 'signin' ? 'Sign in' : 'Create an account'}</p>
            <h1>Sign in the way that works for you</h1>
            <p className="login-lede">
              Real authentication, via Supabase — your password is hashed and verified server-side, this app never
              sees or stores it. The helpers below just make the <em>email</em> field easier to fill; your password
              is always typed, never spoken or photographed.
            </p>

            {!configured && (
              <p className="login-hint-fail">
                Supabase isn't configured yet — add <code>VITE_SUPABASE_URL</code> and{' '}
                <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code>.
              </p>
            )}

            <GuidedSignIn mode={mode} email={email} onEmailFill={setEmail} onSubmit={submit} submitting={submitting} />

            <div className="login-helpers">
              <VoiceEmailHelper onFill={setEmail} />
              <PhotoEmailHelper onFill={setEmail} />
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </label>
              <button className="login-action" type="submit" disabled={submitting || !configured}>
                {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {error && <p className="login-hint-fail">{error}</p>}
            {info && <p className="login-hint-ok">{info}</p>}

            <button
              className="login-toggle-mode"
              onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </main>
          <SugamWidget tabs={['voice', 'read', 'sign']} />
        </div>
      </div>
    </TargetSiteProvider>
  )
}

function VoiceEmailHelper({ onFill }: { onFill: (v: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'fail'>('idle')
  const [heard, setHeard] = useState('')

  async function handleClick() {
    if (!isSpeechSupported()) {
      setStatus('fail')
      return
    }
    setStatus('listening')
    setHeard('')
    try {
      await speak('Please say your email address. Say "at" and "dot" for the symbols.', 'en-IN')
      const { transcript } = await listenOnce('en-IN')
      const normalized = normalizeSpokenEmail(transcript)
      setHeard(normalized)
      onFill(normalized)
      setStatus('idle')
    } catch {
      setStatus('fail')
    }
  }

  return (
    <div className="login-helper">
      <button className="login-helper-btn" onClick={handleClick} disabled={status === 'listening'}>
        🎙 {status === 'listening' ? 'Listening…' : 'Say your email'}
      </button>
      {heard && <p className="login-helper-hint">Filled: {heard} — check it's right before submitting.</p>}
      {status === 'fail' && <p className="login-hint-fail">Speech recognition isn't available here — try Chrome.</p>}
    </div>
  )
}

function PhotoEmailHelper({ onFill }: { onFill: (v: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'reading' | 'fail'>('idle')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('reading')
    try {
      const text = await extractText(file)
      const found = extractEmailFromText(text)
      if (found) {
        onFill(found)
        setStatus('idle')
      } else {
        setStatus('fail')
      }
    } catch {
      setStatus('fail')
    }
  }

  return (
    <div className="login-helper">
      <label className="login-helper-btn login-file">
        📷 {status === 'reading' ? 'Reading…' : 'Autofill email from a photo'}
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
      </label>
      {status === 'fail' && <p className="login-hint-fail">Couldn't find an email address in that photo.</p>}
    </div>
  )
}

type GuideStage = 'idle' | 'listening-email' | 'confirm-email' | 'awaiting-password'

// A full walkthrough for someone who can't read the form well enough to
// use it unassisted: Sugam speaks each step instead of expecting them to
// already know a "say your email" button exists. Password stays typed —
// same security boundary as the plain voice helper above — but the
// instruction to do so is spoken, not just printed in small text.
function GuidedSignIn({
  mode,
  email,
  onEmailFill,
  onSubmit,
  submitting,
}: {
  mode: Mode
  email: string
  onEmailFill: (v: string) => void
  onSubmit: () => void
  submitting: boolean
}) {
  const [stage, setStage] = useState<GuideStage>('idle')
  const [heardEmail, setHeardEmail] = useState('')
  const [error, setError] = useState('')

  async function start() {
    setError('')
    if (!isSpeechSupported()) {
      setError('Voice guidance needs a browser with speech recognition — try Chrome.')
      return
    }
    setStage('listening-email')
    try {
      await speak(
        mode === 'signin'
          ? 'Let’s sign in together. First, please say your email address. Say "at" and "dot" for the symbols.'
          : 'Let’s create your account together. First, please say the email address you want to use.',
        'en-IN',
      )
      const { transcript } = await listenOnce('en-IN')
      const normalized = normalizeSpokenEmail(transcript)
      setHeardEmail(normalized)
      setStage('confirm-email')
      await speak(`I heard ${normalized}. Is that right?`, 'en-IN').catch(() => {})
    } catch {
      setError("I couldn't hear that clearly. Try again, or type your email directly below.")
      setStage('idle')
    }
  }

  function acceptEmail() {
    onEmailFill(heardEmail)
    setStage('awaiting-password')
    speak(
      'Good. Now please type your password in the box below using the keyboard — it stays private, I never ' +
        'hear or see it. Then press the button here when you’re ready.',
      'en-IN',
    ).catch(() => {})
  }

  function retryEmail() {
    setStage('idle')
    setHeardEmail('')
    start()
  }

  return (
    <div className="login-guide">
      {stage === 'idle' && (
        <button type="button" className="login-guide-btn" onClick={start}>
          🧭 Let Sugam guide me through {mode === 'signin' ? 'signing in' : 'creating an account'}
        </button>
      )}
      {stage === 'listening-email' && <p className="login-helper-hint">🎙 Listening for your email…</p>}
      {stage === 'confirm-email' && (
        <div className="login-guide-confirm">
          <p className="login-helper-hint">
            I heard: <strong>{heardEmail}</strong>
          </p>
          <div className="login-guide-actions">
            <button type="button" className="login-guide-btn" onClick={acceptEmail}>
              ✅ Sounds right
            </button>
            <button type="button" className="login-guide-btn-secondary" onClick={retryEmail}>
              🔁 Try again
            </button>
          </div>
        </div>
      )}
      {stage === 'awaiting-password' && (
        <div className="login-guide-confirm">
          <p className="login-helper-hint">Email set to {email}. Type your password below, then press:</p>
          <button type="button" className="login-guide-btn" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Signing in…' : `✅ I've typed my password — ${mode === 'signin' ? 'sign in' : 'create account'}`}
          </button>
        </div>
      )}
      {error && <p className="login-hint-fail">{error}</p>}
    </div>
  )
}
