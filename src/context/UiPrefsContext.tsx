import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface UiPrefsValue {
  largeText: boolean
  highContrast: boolean
  switchScan: boolean
  toggleLargeText: () => void
  toggleHighContrast: () => void
  toggleSwitchScan: () => void
  setLargeText: (v: boolean) => void
  setHighContrast: (v: boolean) => void
  setSwitchScan: (v: boolean) => void
}

const UiPrefsContext = createContext<UiPrefsValue | null>(null)

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [switchScan, setSwitchScan] = useState(false)

  // Toggled on <html> rather than a wrapper div: most of the app's sizing
  // uses rem units, which only respond to the root font-size, not an
  // ancestor's. Keeping this on documentElement is what makes the toggle
  // actually scale everything, widget included.
  useEffect(() => {
    document.documentElement.classList.toggle('pref-large-text', largeText)
  }, [largeText])

  useEffect(() => {
    document.documentElement.classList.toggle('pref-high-contrast', highContrast)
  }, [highContrast])

  return (
    <UiPrefsContext.Provider
      value={{
        largeText,
        highContrast,
        switchScan,
        toggleLargeText: () => setLargeText((v) => !v),
        toggleHighContrast: () => setHighContrast((v) => !v),
        toggleSwitchScan: () => setSwitchScan((v) => !v),
        setLargeText,
        setHighContrast,
        setSwitchScan,
      }}
    >
      {children}
    </UiPrefsContext.Provider>
  )
}

export function useUiPrefs() {
  const ctx = useContext(UiPrefsContext)
  if (!ctx) throw new Error('useUiPrefs must be used within UiPrefsProvider')
  return ctx
}
