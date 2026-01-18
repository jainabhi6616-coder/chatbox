import { memo } from 'react'
import './DashboardHeader.css'

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
}

const DashboardHeader = memo(({ 
  title = 'LS & CO Gen AI Co-Pilot',
  subtitle = 'Intelligent revenue forecasting and analytics'
}: DashboardHeaderProps) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-background"></div>
      <div className="dashboard-header-content">
        <div className="dashboard-header-left">
          <div className="dashboard-logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="dashboard-header-text">
            <h1 className="dashboard-title">{title}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="dashboard-header-right">
          {/* Reserved for future header actions */}
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

export default DashboardHeader
