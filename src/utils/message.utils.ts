import { Message, MessageSender } from '../interfaces'
import { CHATBOT_CONFIG } from '../constants'

/**
 * Creates a new message object
 */
export const createMessage = (
  text: string,
  sender: MessageSender,
  id?: string
): Message => {
  // Ensure text is always a string
  const messageText = typeof text === 'string' ? text : String(text || '')
  
  return {
    id: id || Date.now().toString(),
    text: messageText,
    sender,
    timestamp: new Date(),
  }
}

/**
 * Creates the initial bot message
 */
export const createInitialBotMessage = (): Message => {
  return createMessage(
    CHATBOT_CONFIG.INITIAL_MESSAGE,
    'bot',
    '1'
  )
}

/**
 * Creates a bot response message (simulated)
 */
export const createBotResponse = (): Message => {
  return createMessage(
    CHATBOT_CONFIG.DEFAULT_BOT_RESPONSE,
    'bot'
  )
}

