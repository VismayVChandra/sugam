import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Volume2, VolumeX, Type, Contrast, LogOut } from 'lucide-react'
import { useTargetSite } from '../context/TargetSiteContext'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useAuth } from '../context/AuthContext'
import { speak, stopSpeaking } from '../lib/speech'
import SugamWordmark from './SugamWordmark'
import './AccessibilityBar.css'

// Always on screen, unlike the Sugam widget which is opt-in. These are the
// zero-friction accommodations: no mic, no camera, no waiting for a model —
// just an instant toggle or a single tap to have the page read aloud.

export default function AccessibilityBar() {
  const site = useTargetSite()
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useUiPrefs()
  const { logout } = useAuth()
  const [speaking, setSpeaking] = useState(false)

  function toggleReadPage() {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    speak(site.pageSummary(), 'en-IN').finally(() => setSpeaking(false))
  }

  return (
    <div className="a11y-bar">
      <SugamWordmark size={24} showWord={false} />

      <nav className="a11y-switcher" aria-label="Demo site switcher">
        <NavLink to="/bank" className={({ isActive }) => (isActive ? 'active' : '')}>
          Bank demo
        </NavLink>
        <NavLink to="/gov" className={({ isActive }) => (isActive ? 'active' : '')}>
          Government demo
        </NavLink>
        <NavLink to="/health" className={({ isActive }) => (isActive ? 'active' : '')}>
          Health demo
        </NavLink>
      </nav>

      <div className="a11y-controls" role="region" aria-label="Accessibility settings">
        <button onClick={toggleReadPage} aria-pressed={speaking}>
          {speaking ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
          {speaking ? 'Stop reading' : 'Read this page aloud'}
        </button>
        <button aria-pressed={largeText} onClick={toggleLargeText}>
          <Type size={15} aria-hidden="true" />
          Large text
        </button>
        <button aria-pressed={highContrast} onClick={toggleHighContrast}>
          <Contrast size={15} aria-hidden="true" />
          High contrast
        </button>
        <NavLink to="/" onClick={logout} className="a11y-logout">
          <LogOut size={15} aria-hidden="true" />
          Log out
        </NavLink>
      </div>
    </div>
  )
}
