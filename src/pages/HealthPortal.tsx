import { patient, appointment, prescription } from '../data/mockHealth'
import ContactDetailsForm from '../components/ContactDetailsForm'
import './HealthPortal.css'

// A third demo site, again reusing DemoSiteLayout + ContactDetailsForm +
// SugamWidget unmodified — healthcare rather than another form-heavy
// domain, to make the reuse claim harder to dismiss as a coincidence.

export default function HealthPortal() {
  return (
    <div className="health-portal">
      <header className="health-header">
        <span className="health-cross">+</span>
        <span className="health-title">Community Health Centre</span>
      </header>

      <main>
        <h1 className="sr-only">Community Health Centre — patient overview</h1>

        <section id="appointment" className="hcard">
          <h2 className="hcard-label">Next appointment</h2>
          <p className="hcard-value">{appointment.doctor}</p>
          <p className="hcard-sub">
            {appointment.department} · {appointment.date} at {appointment.time}
          </p>
        </section>

        <section id="prescription" className="hcard">
          <h2 className="hcard-label">Current prescription</h2>
          <p className="hcard-value">{prescription.medicine}</p>
          <p className="hcard-sub">{prescription.instructions}</p>
          <span className="hstatus-pill">Refill due {prescription.refillDue}</span>
        </section>

        <section id="doctor" className="hcard">
          <h2 className="hcard-label">Assigned doctor</h2>
          <p className="hcard-value">{appointment.doctor}</p>
          <p className="hcard-sub">{appointment.department} · Patient ID {patient.patientId}</p>
        </section>

        <section id="kyc-form" className="hcard">
          <h2 className="hcard-label">Update patient details</h2>
          <ContactDetailsForm submitLabel="Update details" />
        </section>
      </main>
    </div>
  )
}
