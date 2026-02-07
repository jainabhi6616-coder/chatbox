import { AccountProvider } from './contexts/AccountContext'
import { RevenueDataProvider } from './contexts/RevenueDataContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { ToastProvider } from './contexts/ToastContext'
import { clearCache } from './services'
import { clearMessagesFromStorage } from './utils/storage.utils'
import Dashboard from './components/Dashboard'
import './App.css'

/** Clear all cached and persisted data on page load so the app starts fresh after refresh */
clearCache()
clearMessagesFromStorage()

function App() {
  return (
    <ToastProvider>
      <AccountProvider>
        <RevenueDataProvider>
          <DashboardProvider>
            <div className="app">
              <Dashboard />
            </div>
          </DashboardProvider>
        </RevenueDataProvider>
      </AccountProvider>
    </ToastProvider>
  )
}

export default App

