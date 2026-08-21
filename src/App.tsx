import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import GovPortal from './pages/GovPortal'
import DemoSiteLayout from './components/DemoSiteLayout'
import { UiPrefsProvider } from './context/UiPrefsContext'
import { bankSite } from './data/mockBank'
import { govSite } from './data/mockGov'

export default function App() {
  return (
    <UiPrefsProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <DemoSiteLayout site={bankSite}>
                <Dashboard />
              </DemoSiteLayout>
            }
          />
          <Route
            path="/gov"
            element={
              <DemoSiteLayout site={govSite}>
                <GovPortal />
              </DemoSiteLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </UiPrefsProvider>
  )
}
