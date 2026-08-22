import { useEffect, useRef, useState } from 'react'
import { X, Mic, FileText, ClipboardList, Hand, Send } from 'lucide-react'
import { isSpeechSupported, listenOnce, speak, stopListening, SUPPORTED_LANGUAGES, APPROX_RECORD_MS } from '../lib/speech'
import { matchIntent } from '../lib/intentMatch'
import { buildUniversalIntents } from '../lib/universalIntents'
import { askAssistant, isAssistantConfigured, type ChatTurn } from '../lib/assistant'
import { extractText } from '../lib/ocr'
import { simplifyText, explainWord, SimplifyConfigError } from '../lib/simplify'
import { extractKycFields } from '../lib/extractFields'
import { DOCUMENT_TYPE_LABELS } from '../lib/documentFields'
import { normalizePhone } from '../lib/phone'
import { useTargetSite, type VoiceIntent } from '../context/TargetSiteContext'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useWidgetOpen } from '../context/WidgetOpenContext'
import { useAuth } from '../context/AuthContext'
import { KYC_FIELDS, useKycForm, type KycValues } from '../context/KycFormContext'
import { useT } from '../lib/i18n'
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

export default function SugamWidget({
  tabs = ['voice', 'read', 'form', 'sign'],
  autoOpen = false,
}: {
  tabs?: Tab[]
  /** Force-open regardless of accessibility needs — for screens like the home/site-chooser where speaking what you want beats reading and tapping, for everyone, not just vision-onboarded users. */
  autoOpen?: boolean
}) {
  const { accessibilityNeeds } = useAuth()
  // A vision-onboarded user shouldn't have to find and tap a floating
  // button on every single page — open it for them. Re-evaluated on every
  // mount (each portal navigation remounts this component), which is the
  // point: "every visit," not just the first.
  const [open, setOpen] = useState(() => autoOpen || (accessibilityNeeds?.includes('vision') ?? false))
  const [tab, setTab] = useState<Tab>(tabs[0])
  const { setWidgetOpen } = useWidgetOpen()
  const t = useT()
  const visibleTabs = TABS.filter((tb) => tabs.includes(tb.id))

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
                <p className="sugam-panel-title-main">{t('Sugam assistant')}</p>
                <p className="sugam-panel-title-sub">{t('Helping on this page')}</p>
              </div>
            </div>
            <button className="sugam-panel-close" onClick={() => setOpen(false)} aria-label="Close Sugam assistant">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="sugam-tabs">
            {visibleTabs.map(({ id, label, Icon }) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
                <Icon size={16} aria-hidden="true" />
                {t(label)}
              </button>
            ))}
          </div>

          {tab === 'voice' && <VoicePanel />}
          {tab === 'read' && tabs.includes('read') && <ReadPanel />}
          {tab === 'form' && tabs.includes('form') && <FormAssistPanel />}
          {tab === 'sign' && tabs.includes('sign') && <SignPanel />}
        </div>
      )}
    </>
  )
}

type VoiceStatus = 'idle' | 'recording' | 'thinking'

const WAKE_PHRASES = ['hey sugam', 'ok sugam', 'okay sugam', 'hey, sugam']

function VoicePanel() {
  const site = useTargetSite()
  const uiPrefs = useUiPrefs()
  const t = useT()
  const [lang, setLang] = useState<string>(uiPrefs.siteLanguage)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [handsFree, setHandsFree] = useState(false)
  const handsFreeRef = useRef(false)
  const logRef = useRef<HTMLDivElement>(null)

  const langLabel = SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label ?? 'English'

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, status])

  // Start a fresh conversation when the user moves to a different portal.
  // History is fed back to the model as context, so carrying bank answers
  // onto the health page would let it repeat facts the current page can't
  // actually support — the exact grounding leak the system prompt forbids.
  useEffect(() => {
    setTurns([])
    setError('')
  }, [site.siteName])

  /** Runs a matched page action: scroll to it, highlight it, fire any side effect. */
  function performAction(actionId: string, allIntents: VoiceIntent[]) {
    const intent = allIntents.find((i) => i.id === actionId)
    if (!intent) return
    highlight(intent.id)
    intent.run?.()
  }

  async function handleQuestion(question: string) {
    const q = question.trim()
    if (!q) return

    setError('')
    setTurns((t) => [...t, { role: 'user', content: q }])
    setStatus('thinking')

    const allIntents = [...site.intents, ...buildUniversalIntents(uiPrefs)]

    try {
      let reply: string
      if (isAssistantConfigured()) {
        const result = await askAssistant({
          question: q,
          siteName: site.siteName,
          facts: site.pageSummary(),
          intents: allIntents,
          history: turns,
          langLabel,
        })
        reply = result.reply
        if (result.actionId) performAction(result.actionId, allIntents)
      } else {
        // No LLM key configured — fall back to the original keyword matcher
        // so the demo still works, just less flexibly.
        const intent = matchIntent(q, allIntents)
        if (intent) {
          reply = intent.answer()
          performAction(intent.id, allIntents)
        } else {
          reply = "Sorry, I didn't catch a command I recognize. Try asking about what's on this page."
        }
      }

      setTurns((t) => [...t, { role: 'assistant', content: reply }])
      setStatus('idle')
      uiPrefs.logCaregiverAction(`Asked "${q}" → ${reply}`)
      await speak(reply, lang)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  async function handleMic() {
    setError('')
    if (!isSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    setStatus('recording')
    const toThinking = APPROX_RECORD_MS > 0 ? window.setTimeout(() => setStatus('thinking'), APPROX_RECORD_MS) : null
    try {
      const { transcript } = await listenOnce(lang)
      if (toThinking) window.clearTimeout(toThinking)
      await handleQuestion(transcript)
    } catch (e) {
      if (toThinking) window.clearTimeout(toThinking)
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  // "Hey Sugam" hands-free: one tap arms a loop that keeps re-listening on
  // its own — no further touches needed. Each turn waits out handleQuestion
  // (which itself awaits speak()) before listening again, so the mic is
  // never open while Sugam's own voice is playing and can't hear itself.
  // A phrase is required before anything is acted on, so ordinary room
  // noise/conversation picked up between turns is silently ignored rather
  // than sent to the assistant.
  async function runHandsFreeLoop() {
    handsFreeRef.current = true
    setHandsFree(true)
    // "no-speech" is expected and frequent — the mic sits open between
    // wake-word turns and often times out with nothing said. Only count
    // OTHER failures (no mic hardware, network) toward giving up, so a
    // genuinely broken mic surfaces an error instead of spinning forever
    // with the button stuck on "listening" and nothing ever happening.
    let consecutiveRealFailures = 0
    while (handsFreeRef.current) {
      setStatus('recording')
      let transcript = ''
      try {
        const result = await listenOnce(lang)
        transcript = result.transcript
        consecutiveRealFailures = 0
      } catch (e) {
        if (!handsFreeRef.current) break
        const code = e instanceof Error ? e.message : ''
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          setError('Microphone access was denied — hands-free mode needs it to listen for "Hey Sugam".')
          handsFreeRef.current = false
          setHandsFree(false)
          break
        }
        if (code !== 'no-speech') {
          consecutiveRealFailures++
          if (consecutiveRealFailures >= 5) {
            setError('Hands-free mode couldn’t keep listening — check your microphone and try turning it on again.')
            handsFreeRef.current = false
            setHandsFree(false)
            break
          }
        }
        continue
      }
      if (!handsFreeRef.current) break

      const lower = transcript.toLowerCase()
      const phrase = WAKE_PHRASES.find((p) => lower.includes(p))
      if (!phrase) continue

      let command = transcript
        .slice(lower.indexOf(phrase) + phrase.length)
        .trim()
        .replace(/^[,.:]\s*/, '')

      // Said just "Hey Sugam" and paused, the way you would with a real
      // assistant — not a request to stop. Acknowledge and listen once more
      // for the actual question, without requiring the wake phrase again.
      if (!command) {
        if (!handsFreeRef.current) break
        await speak('Yes?', lang).catch(() => {})
        if (!handsFreeRef.current) break
        setStatus('recording')
        try {
          const follow = await listenOnce(lang)
          command = follow.transcript.trim()
        } catch {
          if (!handsFreeRef.current) break
          continue
        }
        if (!command) continue
      }

      if (/^(stop( listening)?|that'?s all|turn off hands.?free)$/i.test(command)) {
        handsFreeRef.current = false
        setHandsFree(false)
        setStatus('idle')
        await speak('Hands-free mode off.', lang).catch(() => {})
        break
      }
      await handleQuestion(command)
    }
    setStatus('idle')
  }

  function toggleHandsFree() {
    setError('')
    if (handsFreeRef.current) {
      handsFreeRef.current = false
      setHandsFree(false)
      stopListening()
      setStatus('idle')
      return
    }
    if (!isSpeechSupported()) {
      setError('Speech recognition is not supported in this browser. Try Chrome.')
      return
    }
    runHandsFreeLoop()
  }

  // Don't leave the mic silently listening if the widget/tab closes mid-loop.
  useEffect(() => {
    return () => {
      handsFreeRef.current = false
      stopListening()
    }
  }, [])

  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = typed
    setTyped('')
    handleQuestion(q)
  }

  const busy = status !== 'idle'

  return (
    <div className="sugam-tabpanel">
      <label className="sugam-field">
        {t('Language')}
        <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={busy || handsFree}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <div className="sugam-chat-log" ref={logRef} role="log" aria-live="polite" aria-label="Conversation" tabIndex={0}>
        {turns.length === 0 && (
          <p className="sugam-hint">
            Ask me anything about this page — in your own words. Try “how much money do I have?” or “when is my
            appointment?”
          </p>
        )}
        {turns.map((t, i) => (
          <p key={i} className={t.role === 'user' ? 'sugam-chat-user' : 'sugam-chat-bot'}>
            {t.content}
          </p>
        ))}
        {status === 'thinking' && <p className="sugam-chat-bot sugam-chat-pending">…</p>}
      </div>

      <button className="sugam-mic" onClick={handleMic} disabled={busy || handsFree}>
        {!handsFree && status === 'recording'
          ? t('🔴 Listening — speak now…')
          : !handsFree && status === 'thinking'
            ? t('Thinking…')
            : t('🎙 Ask by voice')}
      </button>

      <button
        type="button"
        className={`sugam-mic sugam-handsfree${handsFree ? ' active' : ''}`}
        onClick={toggleHandsFree}
        aria-pressed={handsFree}
      >
        {handsFree
          ? status === 'recording'
            ? t('👂 Listening for "Hey Sugam"…')
            : status === 'thinking'
              ? t('Thinking…')
              : t('👂 Hands-free active — tap to stop')
          : t('🗣️ Turn on "Hey Sugam" hands-free')}
      </button>
      {handsFree && (
        <p className="sugam-hint">
          {t('Say “Hey Sugam” followed by your question — no need to touch the screen. Say “stop” to turn it off.')}
        </p>
      )}

      <form className="sugam-chat-form" onSubmit={handleTypedSubmit}>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="…or type your question"
          aria-label="Type your question"
          disabled={busy || handsFree}
        />
        <button type="submit" disabled={busy || handsFree || !typed.trim()} aria-label="Send question">
          <Send size={16} aria-hidden="true" />
        </button>
      </form>

      <details className="sugam-raw">
        <summary>What can I ask?</summary>
        <ul className="sugam-command-list">
          {site.intents.map((i) => (
            <li key={i.id}>{i.label ?? i.keywords[0]}</li>
          ))}
          {buildUniversalIntents(uiPrefs).map((i) => (
            <li key={i.id}>{i.label ?? i.keywords[0]}</li>
          ))}
        </ul>
      </details>

      {error && <p className="sugam-error">{error}</p>}
    </div>
  )
}

/** Splits on whitespace but keeps the separators, so tapping a word doesn't disturb layout/reflow. */
function splitWords(text: string): string[] {
  return text.split(/(\s+)/)
}

/** A short word/phrase a tap-to-explain lookup can act on — strips surrounding punctuation. */
function cleanWord(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
}

function ExplainableText({ text, langLabel }: { text: string; langLabel: string }) {
  const [active, setActive] = useState<{ word: string; explanation: string; loading: boolean; error: string } | null>(null)

  async function handleWordClick(token: string) {
    const word = cleanWord(token)
    if (!word) return
    setActive({ word, explanation: '', loading: true, error: '' })
    try {
      const explanation = await explainWord(word, text, langLabel)
      setActive({ word, explanation, loading: false, error: '' })
    } catch (e) {
      setActive({ word, explanation: '', loading: false, error: e instanceof Error ? e.message : 'Could not explain that word.' })
    }
  }

  return (
    <div>
      <p>
        {splitWords(text).map((token, i) =>
          cleanWord(token) ? (
            <button key={i} type="button" className="sugam-word" onClick={() => handleWordClick(token)}>
              {token}
            </button>
          ) : (
            <span key={i}>{token}</span>
          ),
        )}
      </p>
      {active && (
        <div className="sugam-explain-box" role="status">
          <p className="sugam-explain-word">{active.word}</p>
          {active.loading && <p className="sugam-hint">Explaining…</p>}
          {active.explanation && <p>{active.explanation}</p>}
          {active.error && <p className="sugam-error">{active.error}</p>}
        </div>
      )}
    </div>
  )
}

function ReadPanel() {
  const { addDocument, deleteDocument, documents } = useAuth()
  const uiPrefs = useUiPrefs()
  const t = useT()
  const [lang, setLang] = useState<string>(uiPrefs.siteLanguage)
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
      uiPrefs.logCaregiverAction(`Simplified a document (${langLabel})`)
      addDocument({ label: 'Document', lang, text: simple }).catch(() => {})
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

  function openSaved(doc: (typeof documents)[number]) {
    setRawText('')
    setSimplified(doc.text)
    setLang(doc.lang)
    setStatus('done')
    setError('')
  }

  return (
    <div className="sugam-tabpanel">
      <label className="sugam-field">
        {t('Language for the simplified text')}
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="sugam-field">
        {t('Photograph a form, bill or prescription')}
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
      </label>

      {status === 'ocr' && <p className="sugam-hint">{t('Reading text…')} {progress}%</p>}
      {status === 'simplifying' && <p className="sugam-hint">{t('Simplifying, in')} {langLabel}…</p>}

      {rawText && (
        <details className="sugam-raw">
          <summary>{t('Original text extracted')}</summary>
          <p>{rawText}</p>
        </details>
      )}

      {simplified && (
        <div className="sugam-simplified">
          <ExplainableText text={simplified} langLabel={langLabel} />
          <button onClick={() => speak(simplified, lang)}>{t('🔊 Read aloud')}</button>
          <p className="sugam-hint sugam-tap-hint">{t('Tap any word above to hear it explained more simply.')}</p>
        </div>
      )}

      {error && <p className="sugam-error">{error}</p>}

      {documents.length > 0 && (
        <details className="sugam-raw">
          <summary>{t('Past documents')} ({documents.length})</summary>
          <ul className="sugam-doc-list">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button type="button" className="sugam-doc-open" onClick={() => openSaved(doc)}>
                  {doc.label} — {new Date(doc.createdAt).toLocaleDateString()}
                </button>
                <button
                  type="button"
                  className="sugam-doc-delete"
                  aria-label={`Delete saved document from ${new Date(doc.createdAt).toLocaleDateString()}`}
                  onClick={() => deleteDocument(doc.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

type FormStage = 'idle' | 'listening' | 'reviewing' | 'confirming' | 'submitted'
type PendingField = { key: keyof KycValues; label: string; value: string }

function FormAssistPanel() {
  const { values, setField, submit } = useKycForm()
  const uiPrefs = useUiPrefs()
  const t = useT()
  const [lang, setLang] = useState<string>(uiPrefs.siteLanguage)
  const [stage, setStage] = useState<FormStage>('idle')
  const [log, setLog] = useState<{ who: 'sugam' | 'user'; text: string }[]>([])
  const [pending, setPending] = useState<PendingField | null>(null)
  const [error, setError] = useState('')
  const reviewResolver = useRef<((action: 'accept' | 'retry') => void) | null>(null)

  // The confirmation read-back runs in the same async flow that just filled
  // the fields, before React has re-rendered — so the closed-over `values`
  // is still the pre-fill version and would read back "phone not set" for a
  // form that is actually filled in. Someone relying on hearing that
  // confirmation would be told their details were missing.
  //
  // A ref synced in useEffect doesn't help (effects run after render), so
  // setFieldNow writes to the ref synchronously as well as to state. Always
  // use it instead of setField in these flows.
  const valuesRef = useRef(values)
  valuesRef.current = values

  function setFieldNow(key: keyof KycValues, value: string) {
    valuesRef.current = { ...valuesRef.current, [key]: value }
    setField(key, value)
  }

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
          setFieldNow(field.key, heard)
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
    // Read from the ref, not the closed-over `values` — see valuesRef above.
    const v = valuesRef.current
    const parts = [
      `name ${v.fullName || 'not set'}`,
      `phone ${v.phone || 'not set'}`,
      `address ${v.address || 'not set'}`,
      v.dateOfBirth && `date of birth ${v.dateOfBirth}`,
      v.idNumber && `ID number ${v.idNumber}`,
    ].filter(Boolean)
    const summary = `Please confirm: ${parts.join(', ')}.`
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

      if (extracted.documentType !== 'unknown') {
        const label = DOCUMENT_TYPE_LABELS[extracted.documentType]
        const article = /^[AEIOU]/i.test(label) ? 'an' : 'a'
        say(`Looks like ${article} ${label}.`)
      }

      if (extracted.fullName) setFieldNow('fullName', extracted.fullName)
      if (extracted.phone) setFieldNow('phone', extracted.phone)
      if (extracted.address) setFieldNow('address', extracted.address)
      if (extracted.idNumber) setFieldNow('idNumber', extracted.idNumber)
      if (extracted.dateOfBirth) setFieldNow('dateOfBirth', extracted.dateOfBirth)

      const filled = [
        extracted.fullName && 'name',
        extracted.dateOfBirth && 'date of birth',
        extracted.idNumber && 'ID number',
        extracted.phone && 'phone number',
        extracted.address && 'address',
      ].filter(Boolean)
      if (filled.length > 0) say(`Filled in your ${filled.join(', ')}.`)

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
    uiPrefs.logCaregiverAction(`Filled and submitted the form: name ${valuesRef.current.fullName || 'not set'}, phone ${valuesRef.current.phone || 'not set'}`)
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
            {t('Language')}
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <button className="sugam-mic" onClick={runVoiceFill}>
            {t('🎙 Fill by voice')}
          </button>
          <label className="sugam-field">
            {t('or snap your Aadhaar, ration card, PAN or mark sheet')}
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
          </label>
          <p className="sugam-hint">
            {t(
              'Walks through the KYC form field by field, checking each answer with you before moving on — or edit any field directly on the dashboard at any time.',
            )}
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
