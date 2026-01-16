import { memo } from 'react'
import './DashboardHeader.css'

interface DashboardHeaderProps {
  title?: string
}

const DashboardHeader = memo(({ title = 'LS & CO Gen AI Co-Pilot' }: DashboardHeaderProps) => {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-left">
          <div className="dashboard-logo" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="dashboard-title">{title}</h1>
        </div>
        <div className="dashboard-header-right">
          {/* Add user menu or other header actions here */}
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

export default DashboardHeader

