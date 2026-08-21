import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginScreen from './LoginScreen'
import './HomePage.css'

const SITES = [
  { to: '/bank', name: 'साथी Bank', desc: 'A mock banking portal — balance, subsidy status, transactions.' },
  { to: '/gov', name: 'National Scholarship Portal', desc: 'A mock government scholarship application tracker.' },
  { to: '/health', name: 'Community Health Centre', desc: 'A mock hospital appointment & prescription portal.' },
]

export default function HomePage() {
  const { isAuthenticated, userEmail, loading, logout } = useAuth()

  if (loading) return null
  if (!isAuthenticated) return <LoginScreen />

  return (
    <div className="home-screen">
      <main className="home-card">
        <div className="home-top">
          <div>
            <p className="home-eyebrow">Signed in as {userEmail}</p>
            <h1>Choose a demo site</h1>
          </div>
          <button className="home-logout" onClick={logout}>
            Log out
          </button>
        </div>
        <p className="home-lede">
          Three unrelated portals. Same Sugam layer, unmodified, mounted on each — that's the entire point.
        </p>
        <div className="home-sites">
          {SITES.map((s) => (
            <Link key={s.to} to={s.to} className="home-site-card">
              <h2>{s.name}</h2>
              <p>{s.desc}</p>
              <span className="home-enter">Enter →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
