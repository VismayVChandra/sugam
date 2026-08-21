import { applicant, scholarship, documentsRequired } from '../data/mockGov'
import ContactDetailsForm from '../components/ContactDetailsForm'
import './GovPortal.css'

// A second, unrelated "existing app" — different domain, different data,
// deliberately different visual design from Dashboard.tsx. Same
// DemoSiteLayout wrapping, same Sugam widget, no widget code changed.

export default function GovPortal() {
  return (
    <div className="gov-portal">
      <header className="gov-header">
        <span className="gov-emblem">GOVT</span>
        <span className="gov-title">National Scholarship Portal</span>
      </header>
      <div className="gov-stripe" />

      <main>
        <h1 className="sr-only">National Scholarship Portal — application overview</h1>

        <section id="app-status" className="gcard">
          <h2 className="gcard-label">Application {applicant.applicationId}</h2>
          <p className="gcard-value">{applicant.name}</p>
          <span className="gstatus-pill">{scholarship.status}</span>
        </section>

        <section id="scholarship-amount" className="gcard">
          <h2 className="gcard-label">{scholarship.name}</h2>
          <p className="gcard-value">₹{scholarship.amount.toLocaleString('en-IN')}</p>
          <p className="gcard-sub">Expected by {scholarship.expectedDate}</p>
        </section>

        <section id="documents" className="gcard">
          <h2 className="gcard-label">Documents required</h2>
          <ul className="gdoc-list">
            {documentsRequired.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>

        <section id="kyc-form" className="gcard">
          <h2 className="gcard-label">Update application details</h2>
          <ContactDetailsForm submitLabel="Update application" />
        </section>
      </main>
    </div>
  )
}
