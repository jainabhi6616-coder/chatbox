/**
 * Utilities for processing API responses
 */

import { isRevenueForecastData } from './data-parser.utils'

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string | { output: unknown }
}

interface ApiResponse {
  messages: ApiMessage[]
}

/**
 * Extract the last assistant message from API response
 */
export const extractAssistantMessage = (data: ApiResponse): ApiMessage => {
  const assistantMessages = data.messages.filter((msg) => msg.role === 'assistant')
  const lastMessage = assistantMessages[assistantMessages.length - 1]

  if (!lastMessage) {
    throw new Error('No assistant response found in API response')
  }

  return lastMessage
}

/**
 * Extract raw output data from assistant message
 */
export const extractRawData = (message: ApiMessage): unknown | null => {
  if (
    message.content &&
    typeof message.content === 'object' &&
    'output' in message.content
  ) {
    return (message.content as { output: unknown }).output
  }
  return null
}

/**
 * Format assistant content for display
 */
export const formatAssistantContent = (content: string | { output: unknown }): string => {
  if (typeof content === 'string') {
    return content
  }

  // If content has an output field, check if it's revenue forecast data
  if (content && typeof content === 'object' && 'output' in content) {
    const output = (content as { output: unknown }).output

    // If it's revenue forecast data, show a message instead of JSON
    if (isRevenueForecastData(output)) {
      return 'Please refer to the US Sales Deep Dive tab for detailed results.'
    }

    try {
      // Format the output as readable JSON for other data types
      return JSON.stringify(output, null, 2)
    } catch (error) {
      return JSON.stringify(content, null, 2)
    }
  }

  return JSON.stringify(content, null, 2)
}

/**
 * Process API response and extract formatted content and raw data
 */
export const processApiResponse = (data: ApiResponse): {
  formattedResponse: string
  rawData: unknown | null
} => {
  const assistantMessage = extractAssistantMessage(data)
  const rawData = extractRawData(assistantMessage)
  const formattedResponse = formatAssistantContent(assistantMessage.content)

  return {
    formattedResponse,
    rawData,
  }
}

