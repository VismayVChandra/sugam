import { createContext, useContext, type ReactNode } from 'react'

// The whole pitch is "one Sugam layer, any portal underneath." This context
// is what makes that literal in code: SugamWidget never imports a specific
// site's data — every page it sits in front of registers its own intents
// and read-aloud summary here, and the widget just consumes whichever
// page currently has it mounted.

export interface VoiceIntent {
  id: string
  keywords: string[]
  answer: () => string
  /** Optional side effect beyond speaking an answer — e.g. scroll, submit, resize text. */
  run?: () => void
}

export interface TargetSite {
  siteName: string
  intents: VoiceIntent[]
  /** Full-page summary read aloud by the "read this page aloud" control. */
  pageSummary: () => string
}

const TargetSiteContext = createContext<TargetSite | null>(null)

export function TargetSiteProvider({ site, children }: { site: TargetSite; children: ReactNode }) {
  return <TargetSiteContext.Provider value={site}>{children}</TargetSiteContext.Provider>
}

export function useTargetSite(): TargetSite {
  const ctx = useContext(TargetSiteContext)
  if (!ctx) throw new Error('useTargetSite must be used within a TargetSiteProvider')
  return ctx
}
