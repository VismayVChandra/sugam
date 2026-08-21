import { useKycForm } from '../context/KycFormContext'
import './ContactDetailsForm.css'

// Reused as-is on both demo sites (bank KYC update, government application
// details) — the same fields, the same voice-fill flow in SugamWidget,
// no per-site code. That reuse is itself part of the "one layer" proof.

export default function ContactDetailsForm({ submitLabel = 'Submit' }: { submitLabel?: string }) {
  const { values, setField, submitted, submit, reset } = useKycForm()

  if (submitted) {
    return (
      <div className="kyc-success">
        <p>✔ Details submitted.</p>
        <button onClick={reset}>Edit again</button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="kyc-form"
    >
      <label>
        Full name
        <input name="fullName" value={values.fullName} onChange={(e) => setField('fullName', e.target.value)} />
      </label>
      <label>
        Phone number
        <input
          name="phone"
          type="tel"
          placeholder="10-digit mobile number"
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
        />
      </label>
      <label>
        Address
        <textarea
          name="address"
          rows={2}
          placeholder="House no., street, city, PIN"
          value={values.address}
          onChange={(e) => setField('address', e.target.value)}
        />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
