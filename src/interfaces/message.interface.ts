export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export type MessageSender = 'user' | 'bot'

