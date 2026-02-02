/**
 * Utilities for processing API responses
 */

import { isChartableData } from './data-parser.utils'
import type { SuggestedQuestion } from '../services/graphql/types'
import type { ApiMessage, ApiResponse } from '../types/api.types'

/** API suggested_questions item (snake_case, "tab information" key) */
type ApiSuggestedItem = { question: string; 'tab information'?: string }

/**
 * Normalize API suggested_questions to SuggestedQuestion[] (id, text, tabInformation)
 */
export const normalizeSuggestedQuestions = (
  raw: ApiSuggestedItem[] | SuggestedQuestion[] | null | undefined
): SuggestedQuestion[] | null => {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null
  const first = raw[0] as Record<string, unknown>
  // Already normalized (has text)
  if (first && typeof first.text === 'string') {
    return raw as SuggestedQuestion[]
  }
  // API format: { question, "tab information" }
  return (raw as ApiSuggestedItem[]).map((item, i) => ({
    id: `sq-${i + 1}`,
    text: item.question ?? '',
    tabInformation: item['tab information'] ?? item.question,
  }))
}

/**
 * Extract the last assistant message from API response (messages format)
 */
export const extractAssistantMessage = (data: ApiResponse): ApiMessage => {
  if (!data.messages || !Array.isArray(data.messages)) {
    throw new Error('No messages array in API response')
  }
  const assistantMessages = data.messages.filter((msg) => msg.role === 'assistant')
  const lastMessage = assistantMessages[assistantMessages.length - 1]
  if (!lastMessage) {
    throw new Error('No assistant response found in API response')
  }
  return lastMessage
}

/**
 * Extract raw output data from assistant message or top-level output
 */
export const extractRawData = (data: ApiResponse, message?: ApiMessage | null): unknown | null => {
  if (data.output !== undefined && data.output !== null) {
    return data.output
  }
  if (message && message.content && typeof message.content === 'object' && 'output' in message.content) {
    return (message.content as { output: unknown }).output
  }
  return null
}

/**
 * Extract suggested questions from assistant message or top-level suggested_questions
 */
export const extractSuggestedQuestions = (
  data: ApiResponse,
  message?: ApiMessage | null
): SuggestedQuestion[] | null => {
  if (data.suggested_questions && Array.isArray(data.suggested_questions)) {
    const normalized = normalizeSuggestedQuestions(data.suggested_questions)
    if (normalized && normalized.length > 0) return normalized
  }
  if (message && message.content && typeof message.content === 'object' && 'suggestedQuestions' in message.content) {
    const suggestedQuestions = (message.content as { suggestedQuestions?: SuggestedQuestion[] }).suggestedQuestions
    if (Array.isArray(suggestedQuestions) && suggestedQuestions.length > 0) {
      return suggestedQuestions
    }
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

  if (content && typeof content === 'object' && 'output' in content) {
    const output = (content as { output: unknown }).output

    if (isChartableData(output)) {
      return 'Please refer to the dashboard tabs for detailed results.'
    }

    // Response 1: output.response is a string message
    if (output && typeof output === 'object' && 'response' in output) {
      const resp = (output as { response: unknown }).response
      if (typeof resp === 'string') return resp
    }

    try {
      return JSON.stringify(output, null, 2)
    } catch {
      return JSON.stringify(content, null, 2)
    }
  }

  return JSON.stringify(content, null, 2)
}

/**
 * Process API response (messages or top-level output format)
 */
export const processApiResponse = (data: ApiResponse): {
  formattedResponse: string
  rawData: unknown | null
  suggestedQuestions: SuggestedQuestion[] | null
} => {
  if (data.output !== undefined) {
    const rawData = extractRawData(data, null)
    const suggestedQuestions = extractSuggestedQuestions(data, null)
    const formattedResponse = formatAssistantContent({ output: data.output })
    return {
      formattedResponse,
      rawData,
      suggestedQuestions,
    }
  }

  const assistantMessage = extractAssistantMessage(data)
  const rawData = extractRawData(data, assistantMessage)
  const suggestedQuestions = extractSuggestedQuestions(data, assistantMessage)
  const formattedResponse = formatAssistantContent(assistantMessage.content)

  return {
    formattedResponse,
    rawData,
    suggestedQuestions,
  }
}


