import { useState, useCallback, useMemo } from 'react'
import DashboardHeader from './DashboardHeader'
import DashboardTabs from './DashboardTabs'
import Chatbot from '../Chatbot'
import ChatIcon from '../../shared/components/ChatIcon'
import RevenueTable from './RevenueTable/RevenueTable'
import EmptyState from '../../shared/components/EmptyState'
import LoadingIndicator from '../../shared/components/LoadingIndicator'
import { useDashboard } from '../../contexts/DashboardContext'
import './Dashboard.css'

const DEFAULT_TABS = [
  { id: '1', label: 'US Sales Deep Dive' },
  { id: '2', label: 'US Sales at Product Level' },
  { id: '3', label: 'US Sales Growth Trend' },
] as const

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)
  const { tabs, tabData, loadingTabs } = useDashboard()

  const displayTabs = useMemo(() => {
    const capitalizeWords = (s: string) =>
      s.replace(/\b\w/g, (c) => c.toUpperCase())
    const list =
      tabs.length > 0
        ? tabs.map((t) => ({ id: t.id, label: capitalizeWords(t.label) }))
        : DEFAULT_TABS.map((t) => ({ id: t.id, label: t.label }))
    return list
  }, [tabs])

  const handleChatToggle = useCallback(() => {
    if (isChatOpen) {
      setIsChatMinimized((prev) => !prev)
    } else {
      setIsChatOpen(true)
      setIsChatMinimized(false)
    }
  }, [isChatOpen])

  const handleChatClose = useCallback(() => {
    setIsChatOpen(false)
    setIsChatMinimized(false)
  }, [])

  const handleChatMinimize = useCallback(() => {
    setIsChatMinimized(true)
  }, [])

  const handleChatRestore = useCallback(() => {
    setIsChatMinimized(false)
  }, [])

  const handleTabChange = useCallback((index: number) => {
    setActiveTab(index)
  }, [])

  const currentTabData = tabs.length > 0 ? tabData[activeTab] ?? null : null
  const currentTabLabel = displayTabs[activeTab]?.label ?? ''

  return (
    <div className="dashboard">
      <DashboardHeader />
      <DashboardTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={displayTabs}
      />
      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="dashboard-tab-content">
            {loadingTabs && tabs.length > 0 ? (
              <LoadingIndicator message="Loading tab data…" />
            ) : currentTabData ? (
              <RevenueTable
                data={currentTabData}
                title={currentTabLabel}
              />
            ) : (
              <EmptyState
                title={currentTabLabel ? `No data for ${currentTabLabel}` : 'No data'}
                message="Start a conversation in the chatbot. Tabs and data will update from the API response and execute_suggestion."
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Icon - Always visible */}
      <ChatIcon 
        onClick={handleChatToggle} 
        isOpen={isChatOpen && !isChatMinimized}
      />
      
      {/* Chatbot Modal */}
      {isChatOpen && (
        <Chatbot
          isMinimized={isChatMinimized}
          onClose={handleChatClose}
          onMinimize={handleChatMinimize}
          onRestore={handleChatRestore}
        />
      )}
    </div>
  )
}

export default Dashboard

