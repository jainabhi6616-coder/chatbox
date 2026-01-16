import { useState, useCallback } from 'react'
import DashboardHeader from './DashboardHeader'
import DashboardTabs from './DashboardTabs'
import Chatbot from '../Chatbot'
import ChatIcon from '../../shared/components/ChatIcon'
import './Dashboard.css'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isChatMinimized, setIsChatMinimized] = useState(false)

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

  return (
    <div className="dashboard">
      <DashboardHeader />
      <DashboardTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="dashboard-content">
        <div className="dashboard-main">
          {/* Main content area - can be customized */}
          <div className="dashboard-placeholder">
            <h2>Dashboard Content</h2>
            <p>Active Tab: {activeTab + 1}</p>
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

