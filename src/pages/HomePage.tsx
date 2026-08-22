import { Link } from 'react-router-dom'
import { Landmark, GraduationCap, Cross, LogOut, ArrowRight, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import SugamWordmark from '../components/SugamWordmark'
import LoginScreen from './LoginScreen'
import './HomePage.css'

const SITES: {
  to: string
  eyebrow: string
  name: string
  desc: string
  Icon: LucideIcon
  variant: 'bank' | 'gov' | 'health'
}[] = [
  {
    to: '/bank',
    eyebrow: 'Banking',
    name: 'साथी Bank',
    desc: 'Check your balance, subsidy status and recent transactions.',
    Icon: Landmark,
    variant: 'bank',
  },
  {
    to: '/gov',
    eyebrow: 'Government',
    name: 'National Scholarship Portal',
    desc: 'Track your application status and required documents.',
    Icon: GraduationCap,
    variant: 'gov',
  },
  {
    to: '/health',
    eyebrow: 'Healthcare',
    name: 'Community Health Centre',
    desc: 'View your next appointment and current prescription.',
    Icon: Cross,
    variant: 'health',
  },
]

export default function HomePage() {
  const { isAuthenticated, userEmail, loading, logout } = useAuth()

  if (loading) return null
  if (!isAuthenticated) return <LoginScreen />

  return (
    <div className="home-screen">
      <header className="home-header">
        <SugamWordmark size={30} />
        <div className="home-header-right">
          <p className="home-signed-in">
            Signed in as <strong>{userEmail}</strong>
          </p>
          <button className="home-logout" onClick={logout}>
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      </header>

      <main>
        <div className="home-intro">
          <h1>Choose a service to open</h1>
          <p>
            Sugam adds voice navigation, document help and guided form-filling on top of each site below. The
            accessibility tools stay with you as you move between them.
          </p>
        </div>

        <div className="home-sites">
          {SITES.map(({ to, eyebrow, name, desc, Icon, variant }) => (
            <Link key={to} to={to} className="home-site-card">
              <div className={`home-site-banner home-site-banner--${variant}`}>
                {variant === 'gov' && <span className="home-site-tricolour" aria-hidden="true" />}
                <Icon size={40} strokeWidth={1.6} aria-hidden="true" />
              </div>
              <div className="home-site-body">
                <span className="home-site-eyebrow">{eyebrow}</span>
                <h2>{name}</h2>
                <p>{desc}</p>
                <span className="home-enter">
                  Open <ArrowRight size={15} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
