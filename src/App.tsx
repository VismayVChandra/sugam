import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import GovPortal from './pages/GovPortal'
import HealthPortal from './pages/HealthPortal'
import DemoSiteLayout from './components/DemoSiteLayout'
import RequireAuth from './components/RequireAuth'
import { UiPrefsProvider } from './context/UiPrefsContext'
import { AuthProvider } from './context/AuthContext'
import { bankSite } from './data/mockBank'
import { govSite } from './data/mockGov'
import { healthSite } from './data/mockHealth'

export default function App() {
  return (
    <AuthProvider>
      <UiPrefsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/bank"
              element={
                <RequireAuth>
                  <DemoSiteLayout site={bankSite}>
                    <Dashboard />
                  </DemoSiteLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/gov"
              element={
                <RequireAuth>
                  <DemoSiteLayout site={govSite}>
                    <GovPortal />
                  </DemoSiteLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/health"
              element={
                <RequireAuth>
                  <DemoSiteLayout site={healthSite}>
                    <HealthPortal />
                  </DemoSiteLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </UiPrefsProvider>
    </AuthProvider>
  )
}
