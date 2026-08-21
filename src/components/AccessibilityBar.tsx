import { NavLink } from 'react-router-dom'
import { useTargetSite } from '../context/TargetSiteContext'
import { useUiPrefs } from '../context/UiPrefsContext'
import { speak } from '../lib/speech'
import './AccessibilityBar.css'

// Always on screen, unlike the Sugam widget which is opt-in. These are the
// zero-friction accommodations: no mic, no camera, no waiting for a model —
// just an instant toggle or a single tap to have the page read aloud.

export default function AccessibilityBar() {
  const site = useTargetSite()
  const { largeText, highContrast, toggleLargeText, toggleHighContrast } = useUiPrefs()

  return (
    <div className="a11y-bar">
      <nav className="a11y-switcher" aria-label="Demo site switcher">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Bank demo
        </NavLink>
        <NavLink to="/gov" className={({ isActive }) => (isActive ? 'active' : '')}>
          Government demo
        </NavLink>
      </nav>

      <div className="a11y-controls">
        <button onClick={() => speak(site.pageSummary(), 'en-IN')}>🔊 Read this page aloud</button>
        <button aria-pressed={largeText} onClick={toggleLargeText}>
          {largeText ? 'Aa ✓' : 'Aa Large text'}
        </button>
        <button aria-pressed={highContrast} onClick={toggleHighContrast}>
          {highContrast ? '◐ ✓' : '◐ High contrast'}
        </button>
      </div>
    </div>
  )
}
