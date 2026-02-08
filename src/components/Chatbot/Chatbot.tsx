import { memo, useCallback, useEffect, useRef } from 'react'
import { ChatHeader, MessagesList, ChatInput, SuggestedQuestions } from '../../shared/components'
import { useChatbot } from '../../hooks'
import { useAccount } from '../../contexts/AccountContext'
import './Chatbot.css'

interface ChatbotProps {
  isMinimized?: boolean
  onClose?: () => void
  onMinimize?: () => void
  onRestore?: () => void
}

const Chatbot = memo(({ isMinimized = false, onClose, onMinimize, onRestore }: ChatbotProps) => {
  const {
    messages,
    inputValue,
    setInputValue,
    handleSend,
    handleSuggestedQuestionClick,
    messagesEndRef,
    isLoading,
    suggestedQuestions,
    lastError,
    handleRetry,
  } = useChatbot()
  const { account, setAccount, accountOptions } = useAccount()

  const inputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
  }, [setInputValue])

  // Auto-focus input when chat opens
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMinimized])

  // Keyboard shortcuts
  useEffect(() => {
    if (isMinimized) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // Escape to close
      if (e.key === 'Escape' && !isMinimized) {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMinimized, onClose])

  return (
    <div className={`chatbot-modal ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-container">
        <ChatHeader 
          onClose={onClose}
          onMinimize={onMinimize}
          onRestore={onRestore}
          isMinimized={isMinimized}
        />
        {!isMinimized && (
          <>
            <div className="chatbot-account-row">
              <label htmlFor="chatbot-account-select" className="chatbot-account-label">
                Account
              </label>
              <div className="chatbot-account-select-wrap">
                <select
                  id="chatbot-account-select"
                  className="chatbot-account-select"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  aria-label="Select account"
                >
                  {accountOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <MessagesList 
              messages={messages} 
              messagesEndRef={messagesEndRef}
              isLoading={isLoading}
              onRetry={handleRetry}
              lastError={lastError}
            />
            {!isLoading && messages.length > 0 && messages[messages.length - 1]?.sender === 'bot' && (
              <SuggestedQuestions
                questions={suggestedQuestions}
                onQuestionClick={handleSuggestedQuestionClick}
              />
            )}
            <ChatInput
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onSend={handleSend}
              disabled={isLoading}
            />
          </>
        )}
      </div>
    </div>
  )
})

Chatbot.displayName = 'Chatbot'

export default Chatbot
