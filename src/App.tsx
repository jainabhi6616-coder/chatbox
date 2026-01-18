import { RevenueDataProvider } from './contexts/RevenueDataContext'
import { ToastProvider } from './contexts/ToastContext'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  return (
    <ToastProvider>
      <RevenueDataProvider>
        <div className="app">
          <Dashboard />
        </div>
      </RevenueDataProvider>
    </ToastProvider>
  )
}

export default App

