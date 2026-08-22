import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isSpeechSupported, listenOnce, speak } from '../lib/speech'
import { extractText } from '../lib/ocr'
import { extractEmailFromText, normalizeSpokenEmail } from '../lib/email'
import SugamWordmark from '../components/SugamWordmark'
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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

  return (
    <div className="login-screen">
      <main className="login-card">
        <SugamWordmark size={34} />
        <p className="login-eyebrow">{mode === 'signin' ? 'Sign in' : 'Create an account'}</p>
        <h1>Sign in the way that works for you</h1>
        <p className="login-lede">
          Real authentication, via Supabase — your password is hashed and verified server-side, this app never sees
          or stores it. The helpers below just make the <em>email</em> field easier to fill; your password is always
          typed, never spoken or photographed.
        </p>

        {!configured && (
          <p className="login-hint-fail">
            Supabase isn't configured yet — add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            to <code>.env.local</code>.
          </p>
        )}

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

        <button className="login-toggle-mode" onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}>
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </main>
    </div>
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
