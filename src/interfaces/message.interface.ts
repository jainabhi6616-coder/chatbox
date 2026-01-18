export interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  rawData?: unknown // Raw data for table display
}

export type MessageSender = 'user' | 'bot'

