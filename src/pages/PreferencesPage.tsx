import { useNavigate } from 'react-router-dom'
import AccessibilityOnboarding from './AccessibilityOnboarding'

// The "revisit anytime" path — reachable from the accessibility bar's
// Preferences link. Distinct from the first-run version rendered by
// HomePage: pre-filled with whatever's already saved, and returns to
// wherever the user came from instead of falling through to the site
// chooser.

export default function PreferencesPage() {
  const navigate = useNavigate()
  return <AccessibilityOnboarding editMode onDone={() => navigate(-1)} />
}
