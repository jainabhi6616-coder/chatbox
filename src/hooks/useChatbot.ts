import { useState, useRef, useEffect, useCallback } from 'react'
import { Message } from '../interfaces'
import {
  createMessage,
  createInitialBotMessage,
} from '../utils/message.utils'
import { scrollToBottom } from '../utils/scroll.utils'
import { getDefaultSuggestedQuestionsForAccount } from '../constants'
import { getChatbotResponse, clearConversationHistory } from '../services'
import { useRevenueData } from '../contexts/RevenueDataContext'
import { useDashboard } from '../contexts/DashboardContext'
import { useAccount } from '../contexts/AccountContext'
import { useToast } from '../contexts/ToastContext'
import {
  saveMessagesToStorage,
  loadMessagesFromStorage,
  clearMessagesFromStorage,
} from '../utils/storage.utils'
import type { SuggestedQuestion } from '../services/graphql/types'

const toStoredMessages = (stored: any[] | null): Message[] => {
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    return [createInitialBotMessage()]
  }
  return stored.map((msg: Message & { timestamp: string | Date }) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  })) as Message[]
}

export const useChatbot = () => {
  const { account } = useAccount()

  // Load messages for current account from localStorage on mount and when account changes
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadMessagesFromStorage(account)
    return toStoredMessages(stored)
  })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>(() => 
    getDefaultSuggestedQuestionsForAccount(account)
  )
  const [lastError, setLastError] = useState<{ query: string; error: Error } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { setRevenueData } = useRevenueData()
  const { setTabsAndFetchData, clearDashboard } = useDashboard()
  const { showToast } = useToast()

  // When account changes, load that account's messages and default suggested questions
  useEffect(() => {
    const stored = loadMessagesFromStorage(account)
    setMessages(toStoredMessages(stored))
    setSuggestedQuestions(getDefaultSuggestedQuestionsForAccount(account))
  }, [account])

  // Save messages to localStorage for current account whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages, account)
    }
  }, [messages, account])

  useEffect(() => {
    scrollToBottom(messagesEndRef.current)
  }, [messages])

  const handleSend = useCallback(async (messageText?: string) => {
    // Ensure we have a valid string
    const textToSend = typeof messageText === 'string' 
      ? messageText.trim() 
      : (typeof inputValue === 'string' ? inputValue.trim() : '')
    
    if (textToSend === '' || isLoading) return

    const userMessage = createMessage(textToSend, 'user')
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call GraphQL API which integrates with Python backend
      const response = await getChatbotResponse(
        textToSend,
        account,
        account
      )

      const botMessage: Message = {
        ...createMessage(
          response.response,
          'bot',
          response.id
        ),
        rawData: response.rawData,
      }
      
      // Store revenue data if available
      if (response.rawData) {
        setRevenueData(response.rawData)
      }
      
      // Update suggested questions and dynamic dashboard tabs from API response
      if (response.suggestedQuestions && response.suggestedQuestions.length > 0) {
        setSuggestedQuestions(response.suggestedQuestions)
        setTabsAndFetchData(response.suggestedQuestions)
      } else {
        setSuggestedQuestions(getDefaultSuggestedQuestionsForAccount(account))
      }
      
      setMessages((prev) => [...prev, botMessage])
      setLastError(null)
      showToast('Response received', 'success', 2000)
    } catch (error) {
      console.error('Error getting chatbot response:', error)
      const err = error instanceof Error ? error : new Error('Unknown error')
      setLastError({ query: textToSend, error: err })
      
      // Extract error message for better user feedback
      const errorMessageText = err.message || 'Sorry, I encountered an error processing your request. Please try again or click retry.'
      
      // Show error message to user
      const errorMessage = createMessage(
        `Error: ${errorMessageText}`,
        'bot'
      )
      setMessages((prev) => [...prev, errorMessage])
      showToast('Failed to get response from API. Click retry to try again.', 'error', 4000)
      
      // Clear revenue data on error to prevent showing stale data
      setRevenueData(null)
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, showToast, setRevenueData, setTabsAndFetchData, account])

  const handleRetry = useCallback(() => {
    if (lastError) {
      handleSend(lastError.query)
    }
  }, [lastError, handleSend])

  const handleSuggestedQuestionClick = useCallback((question: string) => {
    handleSend(question)
  }, [handleSend])

  const clearMessages = useCallback(() => {
    setMessages([createInitialBotMessage()])
    setSuggestedQuestions(getDefaultSuggestedQuestionsForAccount(account))
    clearConversationHistory(account)
    clearMessagesFromStorage(account)
    setRevenueData(null)
    clearDashboard()
    setLastError(null)
    showToast('Conversation cleared', 'info', 2000)
  }, [account, showToast, setRevenueData, clearDashboard])

  return {
    messages,
    inputValue,
    setInputValue,
    handleSend,
    handleSuggestedQuestionClick,
    messagesEndRef,
    isLoading,
    clearMessages,
    suggestedQuestions,
    lastError,
    handleRetry,
  }
}
