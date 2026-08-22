import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUiPrefs } from '../context/UiPrefsContext'

// Applies a signed-in user's saved accessibility needs (and speech rate) as
// UI defaults once per session — not just the moment they're first chosen
// during onboarding, but every time they sign back in. Renders nothing.

export default function AccessibilityDefaultsApplier() {
  const { accessibilityNeeds, speechRate } = useAuth()
  const { setLargeText, setHighContrast, setSwitchScan, setDyslexiaFont, setSpeechRate } = useUiPrefs()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    if (accessibilityNeeds === undefined) return

    applied.current = true
    if (accessibilityNeeds.includes('vision')) {
      setLargeText(true)
      setHighContrast(true)
    }
    if (accessibilityNeeds.includes('cognitive')) {
      setLargeText(true)
      setDyslexiaFont(true)
    }
    if (accessibilityNeeds.includes('motor')) {
      setSwitchScan(true)
    }
    if (typeof speechRate === 'number') {
      setSpeechRate(speechRate)
    }
  }, [accessibilityNeeds, speechRate, setLargeText, setHighContrast, setSwitchScan, setDyslexiaFont, setSpeechRate])

  return null
}
