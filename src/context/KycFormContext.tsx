import { createContext, useContext, useState, type ReactNode } from 'react'

export interface KycValues {
  fullName: string
  phone: string
  address: string
}

export const KYC_FIELDS: { key: keyof KycValues; label: string; prompt: string }[] = [
  { key: 'fullName', label: 'Full name', prompt: 'What is your full name?' },
  { key: 'phone', label: 'Phone number', prompt: 'What is your 10 digit phone number?' },
  { key: 'address', label: 'Address', prompt: 'What is your address?' },
]

interface KycFormContextValue {
  values: KycValues
  setField: (key: keyof KycValues, value: string) => void
  submitted: boolean
  submit: () => void
  reset: () => void
}

const KycFormContext = createContext<KycFormContextValue | null>(null)

const EMPTY: KycValues = { fullName: 'Ramesh Kumar', phone: '', address: '' }

export function KycFormProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<KycValues>(EMPTY)
  const [submitted, setSubmitted] = useState(false)

  const setField = (key: keyof KycValues, value: string) => setValues((v) => ({ ...v, [key]: value }))
  const submit = () => setSubmitted(true)
  const reset = () => {
    setValues(EMPTY)
    setSubmitted(false)
  }

  return (
    <KycFormContext.Provider value={{ values, setField, submitted, submit, reset }}>
      {children}
    </KycFormContext.Provider>
  )
}

export function useKycForm() {
  const ctx = useContext(KycFormContext)
  if (!ctx) throw new Error('useKycForm must be used within KycFormProvider')
  return ctx
}
