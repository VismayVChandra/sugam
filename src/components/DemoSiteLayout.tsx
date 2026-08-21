import type { ReactNode } from 'react'
import { TargetSiteProvider, type TargetSite } from '../context/TargetSiteContext'
import { KycFormProvider } from '../context/KycFormContext'
import AccessibilityBar from './AccessibilityBar'
import SugamWidget from './SugamWidget'

// Every demo site is wrapped identically: register its intents/summary,
// give it its own isolated form state, show the accessibility bar, mount
// the Sugam widget. Nothing here is site-specific — that's the point.

export default function DemoSiteLayout({ site, children }: { site: TargetSite; children: ReactNode }) {
  return (
    <TargetSiteProvider site={site}>
      <KycFormProvider>
        <AccessibilityBar />
        {children}
        <SugamWidget />
      </KycFormProvider>
    </TargetSiteProvider>
  )
}
