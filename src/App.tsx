import Dashboard from './pages/Dashboard'
import SugamWidget from './components/SugamWidget'
import { KycFormProvider } from './context/KycFormContext'

export default function App() {
  return (
    <KycFormProvider>
      <Dashboard />
      <SugamWidget />
    </KycFormProvider>
  )
}
