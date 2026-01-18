export interface SuggestedQuestion {
  id: string
  text: string
}

export interface ChatResponse {
  id: string
  response: string
  query: string
  cached: boolean
  timestamp: string
  conversationId?: string
  rawData?: unknown // Raw output data from API
  suggestedQuestions?: SuggestedQuestion[] // Optional suggested questions from API
}

export interface GetChatbotResponseVariables {
  query: string
  conversationId?: string
}

export interface GetChatbotResponseData {
  getChatbotResponse: ChatResponse
}

export interface SendMessageVariables {
  query: string
  conversationId?: string
}

export interface SendMessageData {
  sendMessage: ChatResponse
}

