import { account, subsidy, transactions } from '../data/mockBank'
import ContactDetailsForm from '../components/ContactDetailsForm'
import { useT } from '../lib/i18n'
import './Dashboard.css'

// The "existing app" from the architecture diagram — a stand-in bank portal
// that Sugam's widget layers in front of. Element ids here are the scroll
// targets the voice pipeline highlights.

export default function Dashboard() {
  const t = useT()
  return (
    <div className="dashboard">
      <header className="bank-header">
        <span className="bank-logo">सा॑थी Bank</span>
        <span className="bank-user">{account.holder}</span>
      </header>

      <main>
        <h1 className="sr-only">सा॑थी Bank account overview</h1>

        <section id="balance" className="card">
          <h2 className="card-label">{t('Account')} {account.number}</h2>
          <p className="card-balance">₹{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </section>

        <section id="subsidy" className="card">
          <h2 className="card-label">{subsidy.scheme}</h2>
          <p className="card-status">
            <span className="status-pill">{subsidy.status}</span> ₹{subsidy.amount} on {subsidy.date}
          </p>
        </section>

        <section id="transactions" className="card" aria-label="Recent transactions">
          <h2 className="card-label">{t('Recent transactions')}</h2>
          <table>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.date + t.desc}>
                  <td>{t.date}</td>
                  <td>{t.desc}</td>
                  <td className={t.amount < 0 ? 'neg' : 'pos'}>
                    {t.amount < 0 ? '-' : '+'}₹{Math.abs(t.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="kyc-form" className="card">
          <h2 className="card-label">{t('Update KYC details')}</h2>
          <ContactDetailsForm />
        </section>
      </main>
    </div>
  )
}
