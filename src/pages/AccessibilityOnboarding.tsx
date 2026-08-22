import { useState } from 'react'
import { Eye, Ear, Accessibility, BookOpen } from 'lucide-react'
import { useAuth, type AccessibilityNeed } from '../context/AuthContext'
import { SPEECH_RATE_DEFAULT, SPEECH_RATE_OPTIONS } from '../context/UiPrefsContext'
import SugamWordmark from '../components/SugamWordmark'
import './AccessibilityOnboarding.css'

// Asked once, right after signing in for the first time — and reachable
// again anytime via "Preferences" in the accessibility bar (editMode),
// pre-filled with whatever's already saved. The answers aren't used to
// restrict anything — every tool stays available regardless — they only
// set better starting defaults. Skippable, because assuming everyone wants
// to self-identify a disability before using an app is its own kind of
// barrier.

const OPTIONS: { id: AccessibilityNeed; label: string; desc: string; Icon: typeof Eye }[] = [
  { id: 'vision', label: 'Vision', desc: 'Blind or low vision', Icon: Eye },
  { id: 'hearing', label: 'Hearing', desc: 'Deaf or hard of hearing', Icon: Ear },
  { id: 'motor', label: 'Motor', desc: 'Limited mobility or dexterity', Icon: Accessibility },
  { id: 'cognitive', label: 'Reading & cognitive', desc: 'Low literacy or reading difficulty', Icon: BookOpen },
]

export default function AccessibilityOnboarding({
  editMode = false,
  onDone,
}: {
  editMode?: boolean
  onDone?: () => void
}) {
  const { accessibilityNeeds, speechRate, savePreferences } = useAuth()
  const [selected, setSelected] = useState<Set<AccessibilityNeed>>(new Set(accessibilityNeeds ?? []))
  const [rate, setRate] = useState(speechRate ?? SPEECH_RATE_DEFAULT)
  const [saving, setSaving] = useState(false)

  function toggle(id: AccessibilityNeed) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Applying the defaults themselves is handled by AccessibilityDefaultsApplier,
  // which reacts to accessibilityNeeds/speechRate changing — this just saves.
  async function handleContinue(needs: AccessibilityNeed[]) {
    setSaving(true)
    await savePreferences(needs, rate)
    setSaving(false)
    onDone?.()
  }

  return (
    <div className="onboard-screen">
      <main className="onboard-card">
        <SugamWordmark size={32} />
        <p className="onboard-eyebrow">{editMode ? 'Accessibility preferences' : 'One quick question'}</p>
        <h1>{editMode ? 'Update your preferences' : 'Does anything here apply to you?'}</h1>
        <p className="onboard-lede">
          This just sets better starting defaults — large text, high contrast, switch-scan navigation, reading
          speed. Nothing is locked to your answer, and every tool stays available either way. You can change or
          clear this anytime{editMode ? '' : ' from the accessibility bar'}.
        </p>

        <div className="onboard-options">
          {OPTIONS.map(({ id, label, desc, Icon }) => {
            const active = selected.has(id)
            return (
              <button
                key={id}
                type="button"
                className={`onboard-option ${active ? 'active' : ''}`}
                aria-pressed={active}
                onClick={() => toggle(id)}
              >
                <Icon size={22} aria-hidden="true" />
                <div>
                  <span className="onboard-option-label">{label}</span>
                  <span className="onboard-option-desc">{desc}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="onboard-speed">
          <p className="onboard-speed-label">How fast should things be read aloud?</p>
          <div className="onboard-speed-options" role="radiogroup" aria-label="Reading speed">
            {SPEECH_RATE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={rate === s}
                className={`onboard-speed-btn ${rate === s ? 'active' : ''}`}
                onClick={() => setRate(s)}
              >
                {s === 1 ? 'Normal' : `${s}x`}
              </button>
            ))}
          </div>
        </div>

        <div className="onboard-actions">
          <button className="onboard-continue" onClick={() => handleContinue([...selected])} disabled={saving}>
            {saving ? 'Saving…' : editMode ? 'Save preferences' : selected.size > 0 ? 'Continue with these defaults' : 'Continue'}
          </button>
          {editMode ? (
            <button className="onboard-skip" onClick={onDone} disabled={saving}>
              Cancel
            </button>
          ) : (
            <button className="onboard-skip" onClick={() => handleContinue([])} disabled={saving}>
              None of these — skip
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
