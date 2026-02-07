/**
 * Chatbot API service
 * Handles communication with Python backend via REST or GraphQL
 */

import type { ChatResponse } from '../graphql/types'
import { APP_CONFIG } from '../../config/app.config'
import { conversationService } from '../conversation/conversation.service'
import { processApiResponse, extractAssistantMessage, extractRawData } from '../../utils/response.utils'
import type { ApiMessage, ApiRequest, ApiResponse } from '../../types/api.types'

/**
 * Create a ChatResponse from API response data
 */
const createChatResponse = (
  data: ApiResponse,
  query: string,
  conversationId?: string,
  cached: boolean = false
): ChatResponse => {
  const { formattedResponse, rawData, suggestedQuestions } = processApiResponse(data)

  return {
    id: cached ? `cached_${Date.now()}` : `resp_${Date.now()}`,
    response: formattedResponse,
    query,
    cached,
    timestamp: new Date().toISOString(),
    conversationId,
    rawData: rawData || undefined,
    suggestedQuestions: suggestedQuestions || undefined,
  }
}

/**
 * Call Python REST API endpoint directly
 */
const callPythonEndpoint = async (
  query: string,
  conversationId?: string,
  account?: string
): Promise<ChatResponse> => {
  const conversationIdKey = conversationId || 'default'
  const messages = conversationService.buildMessages(conversationIdKey, query)

  const requestBody: ApiRequest = {
    Account: account ?? APP_CONFIG.ACCOUNT_TYPE,
    messages,
  }

  const response = await fetch(APP_CONFIG.PYTHON_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}. ${errorText}`
    )
  }

  let data: ApiResponse
  try {
    data = await response.json()
  } catch (parseError) {
    throw new Error(
      `Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
    )
  }

  if (!data) {
    throw new Error('Invalid API response: empty body')
  }

  // Extract previous response output for next request (user msg + output in messages)
  let lastMessage: ApiMessage | null = null
  try {
    if (data.messages && Array.isArray(data.messages)) {
      lastMessage = extractAssistantMessage(data)
    }
  } catch {
    // No assistant message in response; use top-level output only
  }
  const responseOutput = extractRawData(data, lastMessage ?? undefined)
  conversationService.appendTurn(conversationIdKey, query, responseOutput ?? undefined)

  // Top-level output format (output + suggested_questions)
  if (data.output !== undefined) {
    return createChatResponse(data, query, conversationId)
  }

  // Messages format
  if (!data.messages || !Array.isArray(data.messages)) {
    throw new Error('Invalid API response: missing or invalid messages array')
  }
  return createChatResponse(data, query, conversationId)
}

/**
 * Call Python endpoint through GraphQL (lazy loaded)
 */
const callPythonViaGraphQL = async (
  query: string,
  conversationId?: string
): Promise<ChatResponse> => {
  // Lazy load GraphQL dependencies only when needed
  const { apolloClient } = await import('../graphql/apollo-client')
  const { GET_CHATBOT_RESPONSE } = await import('../graphql/queries')

  try {
    const result = await apolloClient.query<{ getChatbotResponse: ChatResponse }>({
      query: GET_CHATBOT_RESPONSE,
      variables: {
        query,
        conversationId,
      },
      fetchPolicy: 'network-only',
    })

    // Check for GraphQL errors
    if (result.error) {
      throw new Error(`GraphQL error: ${result.error.message}`)
    }

    if (!result.data || !result.data.getChatbotResponse) {
      throw new Error('No data returned from GraphQL query')
    }

    return result.data.getChatbotResponse
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GraphQL request failed: ${error.message}`)
    }
    throw new Error('GraphQL request failed: Unknown error')
  }
}

/**
 * Get chatbot response from Python backend
 * Supports both direct REST API calls and GraphQL
 */
export const getChatbotResponse = async (
  query: string,
  conversationId?: string,
  account?: string
): Promise<ChatResponse> => {
  if (APP_CONFIG.USE_GRAPHQL) {
    return callPythonViaGraphQL(query, conversationId)
  }
  return callPythonEndpoint(query, conversationId, account)
}

/**
 * Clear in-memory conversation history (and any local state) for a fresh start
 */
export const clearCache = (): void => {
  conversationService.clear()
}

/**
 * Clear conversation history for a specific conversation
 */
export const clearConversationHistory = (conversationId?: string): void => {
  conversationService.clear(conversationId)
}

/** Response from execute_suggestion: output and optional suggested_questions */
export interface ExecuteSuggestionResponse {
  output?: unknown
  suggested_questions?: unknown[]
}

/**
 * Call execute_suggestion API to get tab data (content = tab information value)
 */
export const executeSuggestion = async (
  content: string,
  account?: string
): Promise<unknown | null> => {
  const requestBody = {
    Account: account ?? APP_CONFIG.ACCOUNT_TYPE,
    question: content,
  }

  const response = await fetch(APP_CONFIG.EXECUTE_SUGGESTION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(
      `Execute suggestion failed: ${response.status} ${response.statusText}. ${errorText}`
    )
  }

  let data: ExecuteSuggestionResponse & { messages?: unknown[] }
  try {
    data = await response.json()
  } catch (parseError) {
    throw new Error(
      `Failed to parse execute_suggestion response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
    )
  }

  if (data.output !== undefined) {
    return data.output
  }
  if (data.messages && Array.isArray(data.messages)) {
    const messages = data.messages as Array<{ role?: string; content?: unknown }>
    const last = messages.filter((m) => m.role === 'assistant').pop()
    if (last && typeof last === 'object' && 'content' in last) {
      const c = last.content
      if (c && typeof c === 'object' && c !== null && 'output' in c) {
        return (c as { output: unknown }).output
      }
    }
  }
  return null
}
