import { memo, useCallback } from 'react'
import { ChatHeader, MessagesList, ChatInput, SuggestedQuestions } from '../../shared/components'
import { useChatbot } from '../../hooks'
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
  } = useChatbot()

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
  }, [setInputValue])

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
            <MessagesList messages={messages} messagesEndRef={messagesEndRef} />
            <SuggestedQuestions
              questions={suggestedQuestions}
              onQuestionClick={handleSuggestedQuestionClick}
            />
            <ChatInput
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

