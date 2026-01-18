import { memo } from 'react'
import { Message } from '../../../interfaces'
import MessageComponent from '../Message'
import LoadingIndicator from '../LoadingIndicator'
import './MessagesList.css'

interface MessagesListProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
  isLoading?: boolean
  onRetry?: () => void
  lastError?: { query: string; error: Error } | null
}

const MessagesList = memo(({ messages, messagesEndRef, isLoading = false, onRetry, lastError }: MessagesListProps) => {
  return (
    <div className="chatbot-messages">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1
        const showRetry = isLastMessage && lastError !== null && message.sender === 'bot'
        return (
          <MessageComponent 
            key={message.id} 
            message={message}
            onRetry={onRetry}
            showRetry={showRetry}
          />
        )
      })}
      {isLoading && <LoadingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  )
})

MessagesList.displayName = 'MessagesList'

export default MessagesList

