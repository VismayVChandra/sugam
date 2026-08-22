import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUiPrefs } from '../context/UiPrefsContext'

// Applies a signed-in user's saved accessibility needs as UI defaults once
// per session — not just the moment they're first chosen during onboarding,
// but every time they sign back in. Renders nothing.

export default function AccessibilityDefaultsApplier() {
  const { accessibilityNeeds } = useAuth()
  const { setLargeText, setHighContrast, setSwitchScan } = useUiPrefs()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    if (accessibilityNeeds === undefined || accessibilityNeeds.length === 0) return

    applied.current = true
    if (accessibilityNeeds.includes('vision')) {
      setLargeText(true)
      setHighContrast(true)
    }
    if (accessibilityNeeds.includes('cognitive')) {
      setLargeText(true)
    }
    if (accessibilityNeeds.includes('motor')) {
      setSwitchScan(true)
    }
  }, [accessibilityNeeds, setLargeText, setHighContrast, setSwitchScan])

  return null
}
