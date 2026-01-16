import { memo, useCallback } from 'react'
import './ChatHeader.css'

interface ChatHeaderProps {
  title?: string
  icon?: React.ReactNode
  onClose?: () => void
  onMinimize?: () => void
  onRestore?: () => void
  isMinimized?: boolean
}

const ChatHeader = memo(({
  title = 'Sales Deep Dive',
  icon,
  onClose,
  onMinimize,
  onRestore,
  isMinimized = false,
}: ChatHeaderProps) => {
  const handleHeaderClick = useCallback(() => {
    if (isMinimized && onRestore) {
      onRestore()
    }
  }, [isMinimized, onRestore])

  const handleRestoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onRestore?.()
  }, [onRestore])

  const handleCloseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClose?.()
  }, [onClose])

  return (
    <div 
      className={`chatbot-header ${isMinimized ? 'minimized' : ''}`}
      onClick={isMinimized ? handleHeaderClick : undefined}
    >
      <div className="chatbot-header-content">
        <div className="chatbot-header-left">
          {icon || (
            <div className="chatbot-header-icon">
              <span className="icon-symbol">i</span>
            </div>
          )}
          <h2 className="chatbot-header-title">{title}</h2>
        </div>
        <div className="chatbot-header-actions">
          {isMinimized ? (
            // Show restore button when minimized
            onRestore && (
              <button
                className="chatbot-header-button restore"
                onClick={handleRestoreClick}
                aria-label="Restore chat"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              </button>
            )
          ) : (
            // Show minimize button when not minimized
            onMinimize && (
              <button
                className="chatbot-header-button minimize"
                onClick={onMinimize}
                aria-label="Minimize chat"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            )
          )}
          {onClose && (
            <button
              className="chatbot-header-button close"
              onClick={handleCloseClick}
              aria-label="Close chat"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

ChatHeader.displayName = 'ChatHeader'

export default ChatHeader

