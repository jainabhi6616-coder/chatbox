import { RevenueDataProvider } from './contexts/RevenueDataContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { ToastProvider } from './contexts/ToastContext'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <RevenueDataProvider>
        <DashboardProvider>
          <div className="app">
            <Dashboard />
          </div>
        </DashboardProvider>
      </RevenueDataProvider>
    </ToastProvider>
  )
}

export default App

