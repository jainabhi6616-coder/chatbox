import { memo, useMemo } from 'react'
import { Message as MessageType } from '../../../interfaces'
import { formatMessageTime } from '../../../utils'
import './Message.css'

interface MessageProps {
  message: MessageType
}

const Message = memo(({ message }: MessageProps) => {
  const isUserMessage = message.sender === 'user'
  const formattedTime = useMemo(
    () => formatMessageTime(message.timestamp),
    [message.timestamp]
  )

  // Ensure text is always a string (safety check)
  const messageText = typeof message.text === 'string' ? message.text : String(message.text || '')

  return (
    <div
      className={`message ${isUserMessage ? 'user-message' : 'bot-message'}`}
    >
      <div className="message-content">
        <p>{messageText}</p>
        <span className="message-time">{formattedTime}</span>
      </div>
    </div>
  )
})

Message.displayName = 'Message'

export default Message

