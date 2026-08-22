import { useKycForm } from '../context/KycFormContext'
import { useT } from '../lib/i18n'
import './ContactDetailsForm.css'

// Reused as-is on both demo sites (bank KYC update, government application
// details) — the same fields, the same voice-fill flow in SugamWidget,
// no per-site code. That reuse is itself part of the "one layer" proof.

export default function ContactDetailsForm({ submitLabel }: { submitLabel?: string }) {
  const { values, setField, submitted, submit, reset } = useKycForm()
  const t = useT()

  if (submitted) {
    return (
      <div className="kyc-success">
        <p>{t('✔ Details submitted.')}</p>
        <button onClick={reset}>{t('Edit again')}</button>
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
        {t('Full name')}
        <input name="fullName" value={values.fullName} onChange={(e) => setField('fullName', e.target.value)} />
      </label>
      <label>
        {t('Phone number')}
        <input
          name="phone"
          type="tel"
          placeholder="10-digit mobile number"
          value={values.phone}
          onChange={(e) => setField('phone', e.target.value)}
        />
      </label>
      <label>
        {t('Address')}
        <textarea
          name="address"
          rows={2}
          placeholder="House no., street, city, PIN"
          value={values.address}
          onChange={(e) => setField('address', e.target.value)}
        />
      </label>
      <div className="kyc-row">
        <label>
          {t('Date of birth')}
          <input
            name="dateOfBirth"
            placeholder="DD/MM/YYYY"
            value={values.dateOfBirth}
            onChange={(e) => setField('dateOfBirth', e.target.value)}
          />
        </label>
        <label>
          {t('ID number')}
          <input
            name="idNumber"
            placeholder="From your ID document"
            value={values.idNumber}
            onChange={(e) => setField('idNumber', e.target.value)}
          />
        </label>
      </div>
      <button type="submit">{submitLabel ?? t('Submit')}</button>
    </form>
  )
}
