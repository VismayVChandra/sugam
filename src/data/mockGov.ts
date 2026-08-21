import type { TargetSite, VoiceIntent } from '../context/TargetSiteContext'

// A second, unrelated portal — deliberately different domain, different
// data shape, different visual design — to prove the Sugam layer isn't
// secretly banking-specific.

export const applicant = {
  name: 'Ramesh Kumar',
  applicationId: 'NSP-2026-0417332',
}

export const scholarship = {
  name: 'Post-Matric Scholarship for Minorities',
  status: 'Under verification',
  amount: 12000,
  expectedDate: '2026-09-05',
}

export const documentsRequired = ['Aadhaar card', 'Income certificate', 'Bank passbook copy', "Previous year's marksheet"]

const govIntents: VoiceIntent[] = [
  {
    id: 'app-status',
    keywords: ['status', 'आवेदन', 'स्थिति', 'விண்ணப்ப நிலை'],
    answer: () => `Your application ${applicant.applicationId} is currently ${scholarship.status.toLowerCase()}.`,
  },
  {
    id: 'scholarship-amount',
    keywords: ['amount', 'scholarship', 'राशि', 'தொகை'],
    answer: () =>
      `Your ${scholarship.name} is ₹${scholarship.amount}, expected by ${scholarship.expectedDate}, pending verification.`,
  },
  {
    id: 'documents',
    keywords: ['document', 'दस्तावेज़', 'papers', 'ஆவணங்கள்'],
    answer: () => `You need to submit: ${documentsRequired.join(', ')}.`,
  },
]

export const govSite: TargetSite = {
  siteName: 'National Scholarship Portal',
  intents: govIntents,
  pageSummary: () =>
    `National Scholarship Portal, application overview for ${applicant.name}. ` +
    `Application ${applicant.applicationId} is ${scholarship.status.toLowerCase()}. ` +
    `${scholarship.name}: ₹${scholarship.amount}, expected by ${scholarship.expectedDate}. ` +
    `Documents required: ${documentsRequired.join(', ')}.`,
}
