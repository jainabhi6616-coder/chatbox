/**
 * Type definitions for API requests and responses
 */

export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | { output: unknown }
}

export interface ApiRequest {
  Account: string
  messages: ApiMessage[]
}

export interface ApiResponse {
  Account: string
  messages: ApiMessage[]
}

