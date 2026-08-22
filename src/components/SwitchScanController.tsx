import { useEffect, useRef, useState } from 'react'
import { MousePointerClick, X } from 'lucide-react'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useWidgetOpen } from '../context/WidgetOpenContext'
import './SwitchScanController.css'

// Switch/scan access: for motor impairment severe enough that even voice
// commands aren't reliable (or the mic isn't an option). The scanner cycles
// a highlight through every interactive element on the page; the user
// triggers ONE action — spacebar, or the on-screen button below, which is
// what a real external switch (sip-puff, big button) gets mapped to — to
// activate whatever's currently highlighted. No pointer, no keyboard
// navigation required beyond that one input.
//
// Paused entirely while the Sugam widget is open: scanning and
// auto-scrolling the main page while someone is using Voice/Sign/Fill-form
// inside the widget is pure noise, and the two compete for CPU (this
// scanner's DOM requeries vs. the Sign tab's real-time video loop).

const SCAN_INTERVAL_MS = 1600
const SCAN_SELECTOR = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden'
}

function getScanTargets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(SCAN_SELECTOR)].filter(
    (el) => isVisible(el) && !el.hasAttribute('data-scan-ignore'),
  )
}

function isEditingText(): boolean {
  const el = document.activeElement
  if (!el) return false
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable
}

/** A short, readable label — prefers a heading inside a rich card link over its full concatenated text. */
function describeElement(el: HTMLElement): string {
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label')!
  const heading = el.querySelector('h1, h2, h3, h4')
  if (heading?.textContent) return heading.textContent.trim().slice(0, 40)
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.placeholder || el.name || el.type || 'input'
  }
  const text = el.textContent?.trim().replace(/\s+/g, ' ')
  return text ? text.slice(0, 40) : el.tagName.toLowerCase()
}

export default function SwitchScanController() {
  const { switchScan } = useUiPrefs()
  const { widgetOpen } = useWidgetOpen()
  const scanning = switchScan && !widgetOpen
  const [index, setIndex] = useState(0)
  const [label, setLabel] = useState('')
  const currentElRef = useRef<HTMLElement | null>(null)

  // Advance the highlight on a fixed interval.
  useEffect(() => {
    if (!scanning) {
      currentElRef.current?.classList.remove('switch-scan-highlight')
      currentElRef.current = null
      return
    }

    setIndex(0)
    const timer = window.setInterval(() => {
      setIndex((i) => i + 1)
    }, SCAN_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [scanning])

  // Apply the highlight to whichever element is current, re-querying each
  // tick since the page's interactive elements change (route nav, widget
  // open/close) more often than it's worth wiring a MutationObserver for.
  useEffect(() => {
    if (!scanning) return

    currentElRef.current?.classList.remove('switch-scan-highlight')

    const targets = getScanTargets()
    if (targets.length === 0) {
      currentElRef.current = null
      setLabel('')
      return
    }

    const el = targets[index % targets.length]
    el.classList.add('switch-scan-highlight')
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    currentElRef.current = el
    setLabel(describeElement(el))
  }, [index, scanning])

  function select() {
    currentElRef.current?.click()
  }

  useEffect(() => {
    if (!scanning) return
    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack Space from someone actually typing — switch-scan users
      // aren't usually typing directly, but a mouse user testing/demoing
      // with it on still needs Space to type spaces normally.
      if (e.code === 'Space' && !isEditingText()) {
        e.preventDefault()
        select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [scanning])

  if (widgetOpen) return null

  return <SwitchScanBarOrToggle active={switchScan} label={label} onSelect={select} />
}

function SwitchScanBarOrToggle({ active, label, onSelect }: { active: boolean; label: string; onSelect: () => void }) {
  const { toggleSwitchScan } = useUiPrefs()

  if (!active) {
    return (
      <button className="switch-scan-enable" onClick={toggleSwitchScan} data-scan-ignore>
        <MousePointerClick size={16} aria-hidden="true" />
        Switch scan
      </button>
    )
  }

  return (
    <div className="switch-scan-bar" role="region" aria-label="Switch scan controls" data-scan-ignore>
      <div className="switch-scan-status">
        <span className="switch-scan-dot" aria-hidden="true" />
        Scanning: <strong>{label || '…'}</strong>
      </div>
      <button className="switch-scan-select" onClick={onSelect} data-scan-ignore>
        <MousePointerClick size={18} aria-hidden="true" />
        SELECT
      </button>
      <button className="switch-scan-exit" onClick={toggleSwitchScan} data-scan-ignore aria-label="Turn off switch scan">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
