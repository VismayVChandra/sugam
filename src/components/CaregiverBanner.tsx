import { useState } from 'react'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useUiPrefs } from '../context/UiPrefsContext'
import { useT } from '../lib/i18n'
import './CaregiverBanner.css'

// Makes the "someone else is operating this on my behalf" case a first-class
// state instead of an invisible workaround: a visible banner while active,
// plus a running log of what's been read aloud or filled in, so the
// caregiver can show the actual account holder what happened.

export default function CaregiverBanner() {
  const { caregiverMode, caregiverLog } = useUiPrefs()
  const [showLog, setShowLog] = useState(false)
  const t = useT()

  if (!caregiverMode) return null

  return (
    <div className="caregiver-banner" role="region" aria-label="Caregiver mode status">
      <div className="caregiver-banner-row">
        <Users size={16} aria-hidden="true" />
        <span>{t('Caregiver mode — helping someone else today')}</span>
        <button type="button" className="caregiver-log-toggle" onClick={() => setShowLog((v) => !v)} aria-expanded={showLog}>
          {t('Activity log')} ({caregiverLog.length})
          {showLog ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      </div>
      {showLog && (
        <ul className="caregiver-log" aria-label="What's been read or filled in this session">
          {caregiverLog.length === 0 && <li className="caregiver-log-empty">{t('Nothing logged yet this session.')}</li>}
          {caregiverLog.map((entry) => (
            <li key={entry.id}>
              <span className="caregiver-log-time">{entry.time}</span> {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
