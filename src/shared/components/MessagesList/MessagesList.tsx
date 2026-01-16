import { memo } from 'react'
import { Message } from '../../../interfaces'
import MessageComponent from '../Message'
import './MessagesList.css'

interface MessagesListProps {
  messages: Message[]
  messagesEndRef: React.RefObject<HTMLDivElement>
}

const MessagesList = memo(({ messages, messagesEndRef }: MessagesListProps) => {
  return (
    <div className="chatbot-messages">
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
})

MessagesList.displayName = 'MessagesList'

export default MessagesList

