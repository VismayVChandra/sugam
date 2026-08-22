import { useEffect, useRef, useState } from 'react'
import { X, Mic, FileText, ClipboardList, Hand } from 'lucide-react'
import { isSpeechSupported, listenOnce, speak, SUPPORTED_LANGUAGES, APPROX_RECORD_MS } from '../lib/speech'
import { matchIntent } from '../lib/intentMatch'
import { buildUniversalIntents } from '../lib/universalIntents'
import { extractText } from '../lib/ocr'
import { simplifyText, SimplifyConfigError } from '../lib/simplify'
import { extractKycFields } from '../lib/extractFields'
import { normalizePhone } from '../lib/phone'
import { useTargetSite } from '../context/TargetSiteContext'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useWidgetOpen } from '../context/WidgetOpenContext'
import { KYC_FIELDS, useKycForm, type KycValues } from '../context/KycFormContext'
import SignPanel from './SignPanel'
import SugamWordmark from './SugamWordmark'
import './SugamWidget.css'

type Tab = 'voice' | 'read' | 'form' | 'sign'

const TABS: { id: Tab; label: string; Icon: typeof Mic }[] = [
  { id: 'voice', label: 'Voice', Icon: Mic },
  { id: 'read', label: 'Simplify', Icon: FileText },
  { id: 'form', label: 'Fill form', Icon: ClipboardList },
  { id: 'sign', label: 'Sign', Icon: Hand },
]

function highlight(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('sugam-highlight')
  window.setTimeout(() => el.classList.remove('sugam-highlight'), 2200)
}

export default function SugamWidget() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('voice')
  const { setWidgetOpen } = useWidgetOpen()

  useEffect(() => {
    setWidgetOpen(open)
    return () => setWidgetOpen(false)
  }, [open, setWidgetOpen])

  return (
    <>
      {!open && (
        <button
          className="sugam-fab"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Open Sugam accessibility assistant"
        >
          <SugamWordmark showWord={false} size={30} />
        </button>
      )}

      {open && (
        <div className="sugam-panel" role="dialog" aria-label="Sugam accessibility assistant">
          <div className="sugam-panel-header">
            <div className="sugam-panel-title">
              <SugamWordmark showWord={false} size={26} />
              <div>
                <p className="sugam-panel-title-main">Sugam assistant</p>
                <p className="sugam-panel-title-sub">Helping on this page</p>
              </div>
            </div>
            <button className="sugam-panel-close" onClick={() => setOpen(false)} aria-label="Close Sugam assistant">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="sugam-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {tab === 'voice' && <VoicePanel />}
          {tab === 'read' && <ReadPanel />}
          {tab === 'form' && <FormAssistPanel />}
          {tab === 'sign' && <SignPanel />}
        </div>
      )}
    </>
  )
}

type VoiceStatus = 'idle' | 'recording' | 'thinking'

function VoicePanel() {
  const site = useTargetSite()
  const uiPrefs = useUiPrefs()
  const [lang, setLang] = useState<string>(SUPPORTED_LANGUAGES[0].code)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  async function handleMic() {
    setError('')
    setAnswer('')
    setTranscript('')
    if (!isSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    setStatus('recording')
    // Approximate progress cue only — the real STT call has its own timing
    // regardless of which engine actually ends up running underneath.
    const toThinking = APPROX_RECORD_MS > 0 ? window.setTimeout(() => setStatus('thinking'), APPROX_RECORD_MS) : null
    try {
      const { transcript: t } = await listenOnce(lang)
      setStatus('thinking')
      setTranscript(t)
      const allIntents = [...site.intents, ...buildUniversalIntents(uiPrefs)]
      const intent = matchIntent(t, allIntents)
      if (intent) {
        const response = intent.answer()
        setAnswer(response)
        highlight(intent.id)
        intent.run?.()
        await speak(response, lang)
      } else {
        const response = "Sorry, I didn't catch a command I recognize. Try asking about your balance, subsidy, or transactions."
        setAnswer(response)
        await speak(response, lang)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      if (toThinking) window.clearTimeout(toThinking)
      setStatus('idle')
    }
  }

  return (
    <div className="sugam-tabpanel">
      <label className="sugam-field">
        Language
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <button className="sugam-mic" onClick={handleMic} disabled={status !== 'idle'}>
        {status === 'recording' ? '🔴 Recording — speak now…' : status === 'thinking' ? 'Thinking…' : '🎙 Speak a command'}
      </button>

      <details className="sugam-raw">
        <summary>What can I say?</summary>
        <ul className="sugam-command-list">
          {site.intents.map((i) => (
            <li key={i.id}>{i.label ?? i.keywords[0]}</li>
          ))}
          {buildUniversalIntents(uiPrefs).map((i) => (
            <li key={i.id}>{i.label ?? i.keywords[0]}</li>
          ))}
        </ul>
      </details>

      {transcript && <p className="sugam-transcript">You said: “{transcript}”</p>}
      {answer && <p className="sugam-answer">{answer}</p>}
      {error && <p className="sugam-error">{error}</p>}
    </div>
  )
}

function ReadPanel() {
  const [lang, setLang] = useState<string>(SUPPORTED_LANGUAGES[0].code)
  const [rawText, setRawText] = useState('')
  const [simplified, setSimplified] = useState('')
  const [status, setStatus] = useState<'idle' | 'ocr' | 'simplifying' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label ?? 'English'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setRawText('')
    setSimplified('')
    setStatus('ocr')
    setProgress(0)
    try {
      const text = await extractText(file, setProgress)
      setRawText(text)
      setStatus('simplifying')
      const simple = await simplifyText(text, langLabel)
      setSimplified(simple)
      setStatus('done')
    } catch (err) {
      if (err instanceof SimplifyConfigError) {
        setError(err.message)
        setStatus('done')
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  return (
    <div className="sugam-tabpanel">
      <label className="sugam-field">
        Language for the simplified text
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="sugam-field">
        Photograph a form, bill or prescription
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
      </label>

      {status === 'ocr' && <p className="sugam-hint">Reading text… {progress}%</p>}
      {status === 'simplifying' && <p className="sugam-hint">Simplifying, in {langLabel}…</p>}

      {rawText && (
        <details className="sugam-raw">
          <summary>Original text extracted</summary>
          <p>{rawText}</p>
        </details>
      )}

      {simplified && (
        <div className="sugam-simplified">
          <p>{simplified}</p>
          <button onClick={() => speak(simplified, lang)}>🔊 Read aloud</button>
        </div>
      )}

      {error && <p className="sugam-error">{error}</p>}
    </div>
  )
}

type FormStage = 'idle' | 'listening' | 'reviewing' | 'confirming' | 'submitted'
type PendingField = { key: keyof KycValues; label: string; value: string }

function FormAssistPanel() {
  const { values, setField, submit } = useKycForm()
  const [lang, setLang] = useState<string>(SUPPORTED_LANGUAGES[0].code)
  const [stage, setStage] = useState<FormStage>('idle')
  const [log, setLog] = useState<{ who: 'sugam' | 'user'; text: string }[]>([])
  const [pending, setPending] = useState<PendingField | null>(null)
  const [error, setError] = useState('')
  const reviewResolver = useRef<((action: 'accept' | 'retry') => void) | null>(null)

  function say(text: string) {
    setLog((l) => [...l, { who: 'sugam', text }])
  }
  function hear(text: string) {
    setLog((l) => [...l, { who: 'user', text }])
  }

  function waitForReview(): Promise<'accept' | 'retry'> {
    return new Promise((resolve) => {
      reviewResolver.current = resolve
    })
  }

  async function listenForField(key: keyof KycValues, prompt: string) {
    say(prompt)
    await speak(prompt, lang)
    const { transcript } = await listenOnce(lang)
    return key === 'phone' ? normalizePhone(transcript) : transcript
  }

  /** Asks each field, but pauses after every answer for a "sounds right?" check before moving on. */
  async function runQueue(fields: typeof KYC_FIELDS) {
    for (const field of fields) {
      let accepted = false
      while (!accepted) {
        const heard = await listenForField(field.key, field.prompt)
        hear(heard)
        setPending({ key: field.key, label: field.label, value: heard })
        setStage('reviewing')
        const action = await waitForReview()
        if (action === 'accept') {
          setField(field.key, heard)
          setPending(null)
          accepted = true
          setStage('listening')
        } else {
          setPending(null)
          say(`Let's try ${field.label.toLowerCase()} again.`)
        }
      }
    }
    confirmAndOfferSubmit()
  }

  function confirmAndOfferSubmit() {
    setStage('confirming')
    const summary = `Please confirm: name ${values.fullName}, phone ${values.phone}, address ${values.address}.`
    say(summary)
    speak(summary, lang).catch(() => {})
  }

  async function runVoiceFill() {
    setError('')
    setLog([])
    if (!isSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    setStage('listening')
    highlight('kyc-form')
    try {
      await runQueue(KYC_FIELDS)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStage('idle')
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLog([])
    setStage('listening')
    highlight('kyc-form')
    say('Reading your document…')
    try {
      const text = await extractText(file)
      say('Pulling out your details…')
      const extracted = await extractKycFields(text)

      if (extracted.fullName) setField('fullName', extracted.fullName)
      if (extracted.phone) setField('phone', extracted.phone)
      if (extracted.address) setField('address', extracted.address)

      const missing = KYC_FIELDS.filter((f) => !extracted[f.key])
      if (missing.length > 0 && isSpeechSupported()) {
        await runQueue(
          missing.map((f) => ({ ...f, prompt: `I couldn't find your ${f.label.toLowerCase()} on the document. ${f.prompt}` })),
        )
      } else {
        confirmAndOfferSubmit()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStage('idle')
    }
  }

  function handleReviewAccept() {
    reviewResolver.current?.('accept')
  }
  function handleReviewRetry() {
    reviewResolver.current?.('retry')
  }

  function handleConfirm() {
    submit()
    setStage('submitted')
    speak('Submitted. Thank you.', lang).catch(() => {})
  }

  function handleRestart() {
    setStage('idle')
    setLog([])
    setPending(null)
    setError('')
  }

  return (
    <div className="sugam-tabpanel">
      {stage === 'idle' && (
        <>
          <label className="sugam-field">
            Language
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button className="sugam-mic" onClick={runVoiceFill}>
            🎙 Fill by voice
          </button>
          <label className="sugam-field">
            or photograph your ID
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
          </label>
          <p className="sugam-hint">
            Walks through the KYC form field by field, checking each answer with you before moving on — or edit any
            field directly on the dashboard at any time.
          </p>
        </>
      )}

      {stage !== 'idle' && (
        <div className="sugam-form-log">
          {log.map((entry, i) => (
            <p key={i} className={entry.who === 'sugam' ? 'sugam-answer' : 'sugam-transcript'}>
              {entry.who === 'sugam' ? entry.text : `You said: "${entry.text}"`}
            </p>
          ))}
        </div>
      )}

      {stage === 'reviewing' && pending && (
        <div className="sugam-review">
          <p className="sugam-answer">
            Got it — {pending.label.toLowerCase()}: <strong>{pending.value || '(nothing heard)'}</strong>
          </p>
          <div className="sugam-confirm-actions">
            <button className="sugam-mic" onClick={handleReviewAccept}>
              ✅ Sounds right
            </button>
            <button onClick={handleReviewRetry}>🔁 Try again</button>
          </div>
        </div>
      )}

      {stage === 'confirming' && (
        <div className="sugam-confirm-actions">
          <button className="sugam-mic" onClick={handleConfirm}>
            ✅ Confirm &amp; submit
          </button>
          <button onClick={handleRestart}>✏️ Start over</button>
        </div>
      )}

      {stage === 'submitted' && (
        <p className="sugam-answer">✔ Submitted. Scroll down to see it reflected on the form.</p>
      )}

      {error && <p className="sugam-error">{error}</p>}
    </div>
  )
}
