import type { TargetSite, VoiceIntent } from '../context/TargetSiteContext'
import { REGISTERED_USER } from './registeredUser'

// A third, unrelated portal — proving the reuse claim isn't a two-site
// fluke. Healthcare rather than another form-heavy domain, on purpose.

export const patient = {
  name: REGISTERED_USER.name,
  patientId: 'CHC-PT-88213',
}

export const appointment = {
  doctor: 'Dr. Anjali Nair',
  department: 'General Medicine',
  date: '2026-08-29',
  time: '11:30 AM',
}

export const prescription = {
  medicine: 'Metformin 500mg',
  instructions: 'One tablet, twice daily, after meals',
  refillDue: '2026-08-25',
}

const healthIntents: VoiceIntent[] = [
  {
    id: 'appointment',
    label: "When's my next appointment?",
    keywords: ['appointment', 'अपॉइंटमेंट', 'மருத்துவர் சந்திப்பு'],
    answer: () =>
      `Your next appointment is with ${appointment.doctor}, ${appointment.department}, on ${appointment.date} at ${appointment.time}.`,
  },
  {
    id: 'prescription',
    label: "What's my prescription?",
    keywords: ['prescription', 'medicine', 'दवा', 'மருந்து'],
    answer: () => `Your current prescription is ${prescription.medicine}. ${prescription.instructions}.`,
  },
  {
    id: 'doctor',
    label: "Who's my doctor?",
    keywords: ['doctor', 'डॉक्टर', 'மருத்துவர்'],
    answer: () => `Your assigned doctor is ${appointment.doctor}, ${appointment.department}.`,
  },
]

export const healthSite: TargetSite = {
  siteName: 'Community Health Centre',
  intents: healthIntents,
  pageSummary: () =>
    `Community Health Centre, patient overview for ${patient.name}. ` +
    `Next appointment: ${appointment.doctor}, ${appointment.department}, on ${appointment.date} at ${appointment.time}. ` +
    `Current prescription: ${prescription.medicine}, refill due ${prescription.refillDue}.`,
}
