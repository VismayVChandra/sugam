import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Volume2, VolumeX, Type, Contrast, LogOut, Gauge, SpellCheck, Settings, Users, Languages } from 'lucide-react'
import { useTargetSite } from '../context/TargetSiteContext'
import { useUiPrefs, SPEECH_RATE_OPTIONS } from '../context/UiPrefsContext'
import { useAuth } from '../context/AuthContext'
import { speak, stopSpeaking, SUPPORTED_LANGUAGES } from '../lib/speech'
import { useT } from '../lib/i18n'
import SugamWordmark from './SugamWordmark'
import EmergencyButton from './EmergencyButton'
import './AccessibilityBar.css'

// Always on screen, unlike the Sugam widget which is opt-in. These are the
// zero-friction accommodations: no mic, no camera, no waiting for a model —
// just an instant toggle or a single tap to have the page read aloud.

export default function AccessibilityBar() {
  const site = useTargetSite()
  const {
    largeText,
    highContrast,
    dyslexiaFont,
    speechRate,
    caregiverMode,
    siteLanguage,
    toggleLargeText,
    toggleHighContrast,
    toggleDyslexiaFont,
    toggleCaregiverMode,
    setSpeechRate,
    setSiteLanguage,
  } = useUiPrefs()
  const { logout } = useAuth()
  const [speaking, setSpeaking] = useState(false)
  const t = useT()

  function toggleReadPage() {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    speak(site.pageSummary(), siteLanguage).finally(() => setSpeaking(false))
  }

  function cycleSpeed() {
    const i = SPEECH_RATE_OPTIONS.indexOf(speechRate)
    const next = SPEECH_RATE_OPTIONS[(i + 1) % SPEECH_RATE_OPTIONS.length]
    setSpeechRate(next)
  }

  return (
    <div className="a11y-bar" role="region" aria-label="Accessibility toolbar">
      <SugamWordmark size={24} showWord={false} />

      <nav className="a11y-switcher" aria-label="Demo site switcher">
        <NavLink to="/bank" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('Bank demo')}
        </NavLink>
        <NavLink to="/gov" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('Government demo')}
        </NavLink>
        <NavLink to="/health" className={({ isActive }) => (isActive ? 'active' : '')}>
          {t('Health demo')}
        </NavLink>
      </nav>

      <div className="a11y-controls" role="region" aria-label="Accessibility settings">
        <label className="a11y-lang">
          <Languages size={15} aria-hidden="true" />
          <span className="a11y-lang-label">{t('Language')}</span>
          <select
            value={siteLanguage}
            onChange={(e) => setSiteLanguage(e.target.value)}
            aria-label="Language for read-aloud and the Sugam assistant"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <button onClick={toggleReadPage} aria-pressed={speaking}>
          {speaking ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
          {speaking ? t('Stop reading') : t('Read this page aloud')}
        </button>
        <button onClick={cycleSpeed} aria-label={`Reading speed: ${speechRate}x. Click to change.`}>
          <Gauge size={15} aria-hidden="true" />
          {speechRate}x {t('speed')}
        </button>
        <button aria-pressed={largeText} onClick={toggleLargeText}>
          <Type size={15} aria-hidden="true" />
          {t('Large text')}
        </button>
        <button aria-pressed={highContrast} onClick={toggleHighContrast}>
          <Contrast size={15} aria-hidden="true" />
          {t('High contrast')}
        </button>
        <button aria-pressed={dyslexiaFont} onClick={toggleDyslexiaFont}>
          <SpellCheck size={15} aria-hidden="true" />
          {t('Dyslexia font')}
        </button>
        <button aria-pressed={caregiverMode} onClick={toggleCaregiverMode}>
          <Users size={15} aria-hidden="true" />
          {t('Caregiver mode')}
        </button>
        <EmergencyButton />
        <NavLink to="/preferences" className="a11y-logout">
          <Settings size={15} aria-hidden="true" />
          {t('Preferences')}
        </NavLink>
        <NavLink to="/" onClick={logout} className="a11y-logout">
          <LogOut size={15} aria-hidden="true" />
          {t('Log out')}
        </NavLink>
      </div>
    </div>
  )
}
