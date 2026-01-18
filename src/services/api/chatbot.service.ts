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
 * Sample fallback response for error cases
 */
const SAMPLE_FALLBACK_RESPONSE: ApiResponse = {
  Account: 'Revenue',
  messages: [
    {
      role: 'user',
      content: 'give the forecast revenue',
    },
    {
      role: 'assistant',
      content: {
        output: {
          OVERALL: {
            FY25: {
              PREDICTION11: {
                OCTOBER: {
                  LSCO: {
                    GLOBAL: 536963416.6231,
                  },
                },
                NOVEMBER: {
                  LSCO: {
                    GLOBAL: 572801080.6377001,
                  },
                },
                Q4: {
                  LSCO: {
                    GLOBAL: 1691636099.8604,
                  },
                },
              },
              FCST10: {
                OCTOBER: {
                  LSCO: {
                    GLOBAL: 540662657.7147286,
                  },
                },
                NOVEMBER: {
                  LSCO: {
                    GLOBAL: 567014546.5863522,
                  },
                },
                Q4: {
                  LSCO: {
                    GLOBAL: 1716054404.2096605,
                  },
                },
              },
            },
          },
        },
      },
    },
  ],
}

/**
 * Create a ChatResponse from API response data
 */
const createChatResponse = (
  data: ApiResponse,
  query: string,
  conversationId?: string,
  cached: boolean = false
): ChatResponse => {
  const { formattedResponse, rawData } = processApiResponse(data)

  return {
    id: cached ? `cached_${Date.now()}` : `resp_${Date.now()}`,
    response: formattedResponse,
    query,
    cached,
    timestamp: new Date().toISOString(),
    conversationId,
    rawData: rawData || undefined,
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
    throw new Error(`Python API error: ${response.status} ${response.statusText}`)
  }

  const data: ApiResponse = await response.json()

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

  const { data } = await apolloClient.query<{ getChatbotResponse: ChatResponse }>({
    query: GET_CHATBOT_RESPONSE,
    variables: {
      query,
      conversationId,
    },
    fetchPolicy: 'network-only',
  })

  if (!data) {
    throw new Error('No data returned from GraphQL query')
  }

  return data.getChatbotResponse
}

/**
 * Get fallback response when API call fails
 */
const getFallbackResponse = (
  query: string,
  conversationId?: string
): ChatResponse => {
  const conversationIdKey = conversationId || 'default'
  const history = conversationService.getHistory(conversationIdKey)
  
  const updatedHistory: ApiResponse['messages'] = [
    ...history,
    {
      role: 'user',
      content: query,
    },
    SAMPLE_FALLBACK_RESPONSE.messages.find((msg) => msg.role === 'assistant')!,
  ]

  conversationService.updateHistory(conversationIdKey, updatedHistory)

  return createChatResponse(
    { ...SAMPLE_FALLBACK_RESPONSE, messages: updatedHistory },
    query,
    conversationId
  )
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

  try {
    let response: ChatResponse

    if (APP_CONFIG.USE_GRAPHQL) {
      // Call through GraphQL middleware
      response = await callPythonViaGraphQL(query, conversationId)
    } else {
      // Call Python endpoint directly
      response = await callPythonEndpoint(query, conversationId)
    }

    // Store in cache
    cacheService.set(query, response)

    return response
  } catch (error) {
    console.error('Error fetching chatbot response:', error)
    console.log('Using sample fallback response due to error')

    // Try to use expired cache as fallback
    const expiredCache = cacheService.getExpired(query)
    if (expiredCache) {
      console.log('Using expired cache as fallback')
      return expiredCache
    }

    // Use sample fallback response
    const fallbackResponse = getFallbackResponse(query, conversationId)
    
    // Store fallback in cache
    cacheService.set(query, fallbackResponse)

    return fallbackResponse
  }
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
