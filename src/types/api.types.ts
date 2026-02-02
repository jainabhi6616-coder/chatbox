/**
 * Type definitions for API requests and responses
 */

import type { SuggestedQuestion } from '../services/graphql/types'

export interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | { output: unknown; suggestedQuestions?: SuggestedQuestion[] }
}

export interface ApiRequest {
  Account: string
  messages: ApiMessage[]
}

export interface ApiResponse {
  Account?: string
  messages?: ApiMessage[]
  /** Top-level format: output and suggested_questions (snake_case) */
  output?: unknown
  suggested_questions?: Array<{ question: string; 'tab information'?: string }>
}


