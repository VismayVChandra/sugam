import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { setGlobalSpeechRate } from '../lib/speech'

export const SPEECH_RATE_DEFAULT = 1
export const SPEECH_RATE_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2]
export const SITE_LANGUAGE_DEFAULT = 'en-IN'

export interface CaregiverLogEntry {
  id: string
  time: string
  text: string
}

interface UiPrefsValue {
  largeText: boolean
  highContrast: boolean
  switchScan: boolean
  dyslexiaFont: boolean
  speechRate: number
  caregiverMode: boolean
  caregiverLog: CaregiverLogEntry[]
  /** BCP-47 code from speech.ts's SUPPORTED_LANGUAGES — what "read this page aloud" and the widget default to. */
  siteLanguage: string
  toggleLargeText: () => void
  toggleHighContrast: () => void
  toggleSwitchScan: () => void
  toggleDyslexiaFont: () => void
  toggleCaregiverMode: () => void
  setLargeText: (v: boolean) => void
  setHighContrast: (v: boolean) => void
  setSwitchScan: (v: boolean) => void
  setDyslexiaFont: (v: boolean) => void
  setSpeechRate: (v: number) => void
  setSiteLanguage: (v: string) => void
  /** No-op unless caregiverMode is on — call freely from any feature without checking first. */
  logCaregiverAction: (text: string) => void
}

const UiPrefsContext = createContext<UiPrefsValue | null>(null)

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [largeText, setLargeText] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [switchScan, setSwitchScan] = useState(false)
  const [dyslexiaFont, setDyslexiaFont] = useState(false)
  const [speechRate, setSpeechRate] = useState(SPEECH_RATE_DEFAULT)
  const [caregiverMode, setCaregiverMode] = useState(false)
  const [caregiverLog, setCaregiverLog] = useState<CaregiverLogEntry[]>([])
  const [siteLanguage, setSiteLanguage] = useState(SITE_LANGUAGE_DEFAULT)

  function logCaregiverAction(text: string) {
    setCaregiverLog((log) => {
      if (!caregiverMode) return log
      const entry = { id: crypto.randomUUID(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text }
      return [entry, ...log].slice(0, 30)
    })
  }

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

  useEffect(() => {
    document.documentElement.classList.toggle('pref-dyslexia-font', dyslexiaFont)
  }, [dyslexiaFont])

  useEffect(() => {
    setGlobalSpeechRate(speechRate)
  }, [speechRate])

  return (
    <UiPrefsContext.Provider
      value={{
        largeText,
        highContrast,
        switchScan,
        dyslexiaFont,
        speechRate,
        caregiverMode,
        caregiverLog,
        siteLanguage,
        toggleLargeText: () => setLargeText((v) => !v),
        toggleHighContrast: () => setHighContrast((v) => !v),
        toggleSwitchScan: () => setSwitchScan((v) => !v),
        toggleDyslexiaFont: () => setDyslexiaFont((v) => !v),
        toggleCaregiverMode: () => setCaregiverMode((v) => !v),
        setLargeText,
        setHighContrast,
        setSwitchScan,
        setDyslexiaFont,
        setSpeechRate,
        setSiteLanguage,
        logCaregiverAction,
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
