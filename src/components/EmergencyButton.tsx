import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Phone, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useT } from '../lib/i18n'
import './EmergencyButton.css'

// One tap to reach a saved contact — relevant specifically in banking/health
// contexts where something going wrong (fraud, a medical concern) needs a
// fast, low-effort escalation path. First tap with nothing saved yet prompts
// for a name/phone once; every tap after that goes straight to the call.
//
// The overlay is portaled to document.body rather than rendered in place:
// the accessibility bar has `backdrop-filter`, which (like `transform`)
// creates a new containing block for `position: fixed` descendants — left
// in place, this dialog would anchor to the bar instead of the viewport.

export default function EmergencyButton() {
  const { emergencyContactName, emergencyContactPhone, saveEmergencyContact } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const t = useT()

  const hasContact = Boolean(emergencyContactName && emergencyContactPhone)
  const showForm = !hasContact || editing

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setSaving(true)
    await saveEmergencyContact(name.trim(), phone.trim())
    setSaving(false)
    setEditing(false)
  }

  return (
    <>
      <button type="button" className="emergency-fab" onClick={() => setOpen(true)} aria-label="Emergency contact">
        <AlertTriangle size={16} aria-hidden="true" />
        {t('Emergency')}
      </button>

      {open && createPortal(
        <div className="emergency-overlay" role="dialog" aria-label="Emergency contact">
          <div className="emergency-card">
            <button className="emergency-close" onClick={() => { setOpen(false); setEditing(false) }} aria-label="Close">
              <X size={18} aria-hidden="true" />
            </button>

            {!showForm ? (
              <>
                <AlertTriangle size={28} aria-hidden="true" className="emergency-icon" />
                <h2>
                  {t('Call')} {emergencyContactName} {t('now?')}
                </h2>
                <p className="emergency-sub">{emergencyContactPhone}</p>
                <a className="emergency-call" href={`tel:${emergencyContactPhone}`}>
                  <Phone size={16} aria-hidden="true" />
                  {t('Call now')}
                </a>
                <button
                  type="button"
                  className="emergency-edit"
                  onClick={() => {
                    setName(emergencyContactName ?? '')
                    setPhone(emergencyContactPhone ?? '')
                    setEditing(true)
                  }}
                >
                  {t('Change saved contact')}
                </button>
              </>
            ) : (
              <>
                <h2>
                  {hasContact ? t('Update') : t('Save')} {t('an emergency contact')}
                </h2>
                <p className="emergency-sub">{t('A saved contact gets you a one-tap call from anywhere in Sugam.')}</p>
                <form className="emergency-form" onSubmit={handleSave}>
                  <label>
                    {t('Name')}
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya (daughter)" required />
                  </label>
                  <label>
                    {t('Phone number')}
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="e.g. 9876543210" required />
                  </label>
                  <button type="submit" className="emergency-call" disabled={saving}>
                    {saving ? t('Saving…') : t('Save contact')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
