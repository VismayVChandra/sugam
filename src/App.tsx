import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PreferencesPage from './pages/PreferencesPage'
import Dashboard from './pages/Dashboard'
import GovPortal from './pages/GovPortal'
import HealthPortal from './pages/HealthPortal'
import DemoSiteLayout from './components/DemoSiteLayout'
import RequireAuth from './components/RequireAuth'
import SwitchScanController from './components/SwitchScanController'
import AccessibilityDefaultsApplier from './components/AccessibilityDefaultsApplier'
import { UiPrefsProvider } from './context/UiPrefsContext'
import { AuthProvider } from './context/AuthContext'
import { WidgetOpenProvider } from './context/WidgetOpenContext'
import { bankSite } from './data/mockBank'
import { govSite } from './data/mockGov'
import { healthSite } from './data/mockHealth'

export default function App() {
  return (
    <AuthProvider>
      <UiPrefsProvider>
        <WidgetOpenProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/preferences"
                element={
                  <RequireAuth>
                    <PreferencesPage />
                  </RequireAuth>
                }
              />
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
            <SwitchScanController />
            <AccessibilityDefaultsApplier />
          </BrowserRouter>
        </WidgetOpenProvider>
      </UiPrefsProvider>
    </AuthProvider>
  )
}
