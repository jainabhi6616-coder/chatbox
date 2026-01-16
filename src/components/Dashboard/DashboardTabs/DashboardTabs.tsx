import { memo, useCallback } from 'react'
import './DashboardTabs.css'

interface Tab {
  id: string
  label: string
}

interface DashboardTabsProps {
  activeTab: number
  onTabChange: (index: number) => void
  tabs?: Tab[]
}

const defaultTabs: Tab[] = [
  { id: '1', label: 'US Sales Deep Dive' },
  { id: '2', label: 'US Sales at Product Level' },
  { id: '3', label: 'US Sales Growth Trend' },
] as const

const DashboardTabs = memo(({
  activeTab,
  onTabChange,
  tabs = defaultTabs,
}: DashboardTabsProps) => {
  const handleTabClick = useCallback((index: number) => () => {
    onTabChange(index)
  }, [onTabChange])

  return (
    <div className="dashboard-tabs" role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          className={`dashboard-tab ${activeTab === index ? 'active' : ''}`}
          onClick={handleTabClick(index)}
          role="tab"
          aria-selected={activeTab === index}
          aria-controls={`tabpanel-${tab.id}`}
          type="button"
        >
          <span className="dashboard-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  )
})

DashboardTabs.displayName = 'DashboardTabs'

export default DashboardTabs

