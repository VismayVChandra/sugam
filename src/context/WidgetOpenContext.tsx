import { createContext, useContext, useState, type ReactNode } from 'react'

// Whether the Sugam widget panel is currently open. Switch-scan reads this
// to pause itself — scanning and auto-scrolling the main page while someone
// is actively using Voice/Simplify/Fill-form/Sign inside the widget is
// disruptive, not helpful, and the two compete for CPU (scanning's DOM
// requeries vs. the Sign tab's real-time video loop).

interface WidgetOpenContextValue {
  widgetOpen: boolean
  setWidgetOpen: (v: boolean) => void
}

const WidgetOpenContext = createContext<WidgetOpenContextValue | null>(null)

export function WidgetOpenProvider({ children }: { children: ReactNode }) {
  const [widgetOpen, setWidgetOpen] = useState(false)
  return <WidgetOpenContext.Provider value={{ widgetOpen, setWidgetOpen }}>{children}</WidgetOpenContext.Provider>
}

export function useWidgetOpen() {
  const ctx = useContext(WidgetOpenContext)
  if (!ctx) throw new Error('useWidgetOpen must be used within WidgetOpenProvider')
  return ctx
}
