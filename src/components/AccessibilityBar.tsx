import { NavLink } from 'react-router-dom'
import { useTargetSite } from '../context/TargetSiteContext'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useAuth } from '../context/AuthContext'
import { speak } from '../lib/speech'
import './AccessibilityBar.css'

// Always on screen, unlike the Sugam widget which is opt-in. These are the
// zero-friction accommodations: no mic, no camera, no waiting for a model —
// just an instant toggle or a single tap to have the page read aloud.

export default function AccessibilityBar() {
  const site = useTargetSite()
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useUiPrefs()
  const { logout } = useAuth()

  return (
    <div className="a11y-bar">
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
        <button onClick={() => speak(site.pageSummary(), 'en-IN')}>🔊 Read this page aloud</button>
        <button aria-pressed={largeText} onClick={toggleLargeText}>
          {largeText ? 'Aa ✓' : 'Aa Large text'}
        </button>
        <button aria-pressed={highContrast} onClick={toggleHighContrast}>
          {highContrast ? '◐ ✓' : '◐ High contrast'}
        </button>
        <NavLink to="/" onClick={logout}>
          Log out
        </NavLink>
      </div>
    </div>
  )
}
