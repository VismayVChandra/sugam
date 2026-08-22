import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Landmark, GraduationCap, Cross, LogOut, ArrowRight, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { TargetSiteProvider } from '../context/TargetSiteContext'
import { buildHomeSite } from '../data/homeSite'
import { useT } from '../lib/i18n'
import SugamWordmark from '../components/SugamWordmark'
import AccessibilityBar from '../components/AccessibilityBar'
import CaregiverBanner from '../components/CaregiverBanner'
import SugamWidget from '../components/SugamWidget'
import LoginScreen from './LoginScreen'
import AccessibilityOnboarding from './AccessibilityOnboarding'
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
  const { isAuthenticated, userEmail, loading, logout, accessibilityNeeds } = useAuth()
  const navigate = useNavigate()
  const homeSite = useMemo(() => buildHomeSite(navigate), [navigate])
  const t = useT()

  if (loading) return null
  if (!isAuthenticated) return <LoginScreen />
  if (accessibilityNeeds === undefined) return <AccessibilityOnboarding />

  return (
    <TargetSiteProvider site={homeSite}>
      <div className="home-screen">
        <AccessibilityBar />
        <CaregiverBanner />
        <header className="home-header">
          <SugamWordmark size={30} />
          <div className="home-header-right">
            <p className="home-signed-in">
              {t('Signed in as')} <strong>{userEmail}</strong>
            </p>
            <button className="home-logout" onClick={logout}>
              <LogOut size={15} aria-hidden="true" />
              {t('Log out')}
            </button>
          </div>
        </header>

        <main>
          <div className="home-intro">
            <h1>{t('Choose a service to open')}</h1>
            <p>
              {t(
                'Sugam adds voice navigation, document help and guided form-filling on top of each site below. The accessibility tools stay with you as you move between them.',
              )}
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
                  <span className="home-site-eyebrow">{t(eyebrow)}</span>
                  <h2>{name}</h2>
                  <p>{t(desc)}</p>
                  <span className="home-enter">
                    {t('Open')} <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>

        <SugamWidget tabs={['voice', 'read', 'sign']} autoOpen />
      </div>
    </TargetSiteProvider>
  )
}
