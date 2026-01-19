/**
 * Chatbot API service
 * Handles communication with Python backend via REST or GraphQL
 */

import type { ChatResponse } from '../graphql/types'
import { APP_CONFIG } from '../../config/app.config'
import { cacheService } from '../cache/cache.service'
import { conversationService } from '../conversation/conversation.service'
import { processApiResponse } from '../../utils/response.utils'
import type { ApiRequest, ApiResponse } from '../../types/api.types'

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
  conversationId?: string
): Promise<ChatResponse> => {
  const conversationIdKey = conversationId || 'default'
  const messages = conversationService.buildMessages(conversationIdKey, query)

  const requestBody: ApiRequest = {
    Account: APP_CONFIG.ACCOUNT_TYPE,
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

  // Validate response structure
  if (!data || !data.messages || !Array.isArray(data.messages)) {
    throw new Error('Invalid API response: missing or invalid messages array')
  }

  // Update conversation history
  conversationService.updateHistory(conversationIdKey, data.messages)

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
  conversationId?: string
): Promise<ChatResponse> => {
  // Check cache first
  const cached = cacheService.get(query)
  if (cached) {
    console.log('Using cached response for:', query)
    return cached
  }

  let response: ChatResponse

  if (APP_CONFIG.USE_GRAPHQL) {
    // Call through GraphQL middleware
    response = await callPythonViaGraphQL(query, conversationId)
  } else {
    // Call Python endpoint directly
    response = await callPythonEndpoint(query, conversationId)
  }

  // Store in cache only if successful
  cacheService.set(query, response)

  return response
}

/**
 * Clear the local cache
 */
export const clearCache = (): void => {
  cacheService.clear()
  conversationService.clear()
}

/**
 * Clear cache for a specific query
 */
export const clearCacheForQuery = (query: string): void => {
  cacheService.clearForQuery(query)
}

/**
 * Clear conversation history for a specific conversation
 */
export const clearConversationHistory = (conversationId?: string): void => {
  conversationService.clear(conversationId)
}

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cacheService.getStats()
}
