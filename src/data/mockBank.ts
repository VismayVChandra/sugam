// Fake target site data. Sugam is a layer that sits in front of a real
// banking/govt portal — this stands in for that portal during the demo.

export const account = {
  holder: 'Ramesh Kumar',
  number: 'XXXX XXXX 4821',
  balance: 12450.75,
}

export const subsidy = {
  scheme: 'LPG (PAHAL) Subsidy',
  status: 'Credited',
  amount: 300,
  date: '2026-08-14',
}

export const transactions = [
  { date: '2026-08-20', desc: 'UPI/Grocery Mart', amount: -840.0 },
  { date: '2026-08-18', desc: 'Salary Credit', amount: 32000.0 },
  { date: '2026-08-14', desc: 'LPG Subsidy Credit', amount: 300.0 },
  { date: '2026-08-10', desc: 'Electricity Bill', amount: -1120.5 },
]

export interface Intent {
  id: 'balance' | 'subsidy' | 'transactions'
  keywords: string[]
  answer: (lang: string) => string
}

const inr = (n: number) => `₹${Math.abs(n).toFixed(2)}`

export const intents: Intent[] = [
  {
    id: 'balance',
    keywords: ['balance', 'बैलेंस', 'बकाया', 'கணக்கு இருப்பு', 'ব্যালেন্স'],
    answer: () => `Your account balance is ${inr(account.balance)}.`,
  },
  {
    id: 'subsidy',
    keywords: ['subsidy', 'lpg', 'सब्सिडी', 'गैस', 'மானியம்', 'ভর্তুকি'],
    answer: () =>
      `Your ${subsidy.scheme} of ${inr(subsidy.amount)} was ${subsidy.status.toLowerCase()} on ${subsidy.date}.`,
  },
  {
    id: 'transactions',
    keywords: ['transaction', 'लेनदेन', 'history', 'இடபாடு', 'লেনদেন'],
    answer: () => {
      const last = transactions[0]
      return `Your most recent transaction was ${last.desc} for ${inr(last.amount)} on ${last.date}.`
    },
  },
]

export function matchIntent(transcript: string): Intent | null {
  const lower = transcript.toLowerCase()
  return intents.find((intent) => intent.keywords.some((k) => lower.includes(k.toLowerCase()))) ?? null
}
