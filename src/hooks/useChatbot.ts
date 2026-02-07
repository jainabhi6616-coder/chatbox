import { useState, useRef, useEffect, useCallback } from 'react'
import { Message } from '../interfaces'
import {
  createMessage,
  createInitialBotMessage,
} from '../utils/message.utils'
import { scrollToBottom } from '../utils/scroll.utils'
import { DEFAULT_SUGGESTED_QUESTIONS } from '../constants'
import { getChatbotResponse, clearConversationHistory } from '../services'
import { useRevenueData } from '../contexts/RevenueDataContext'
import { useDashboard } from '../contexts/DashboardContext'
import { useAccount } from '../contexts/AccountContext'
import { useToast } from '../contexts/ToastContext'
import {
  saveMessagesToStorage,
  loadMessagesFromStorage,
  clearMessagesFromStorage,
  saveConversationId,
  loadConversationId,
} from '../utils/storage.utils'
import type { SuggestedQuestion } from '../services/graphql/types'

export const useChatbot = () => {
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = loadMessagesFromStorage()
    if (stored && stored.length > 0) {
      // Convert stored timestamps back to Date objects
      return stored.map((msg: Message & { timestamp: string | Date }) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })) as Message[]
    }
    return [createInitialBotMessage()]
  })
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>(() => 
    [...DEFAULT_SUGGESTED_QUESTIONS]
  )
  const [lastError, setLastError] = useState<{ query: string; error: Error } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const storedConversationId = loadConversationId()
  const conversationIdRef = useRef<string>(storedConversationId || Date.now().toString())
  const { setRevenueData } = useRevenueData()
  const { setTabsAndFetchData, clearDashboard } = useDashboard()
  const { account } = useAccount()
  const { showToast } = useToast()

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages)
      saveConversationId(conversationIdRef.current)
    }
  }, [messages])

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
        conversationIdRef.current,
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
        setSuggestedQuestions([...DEFAULT_SUGGESTED_QUESTIONS])
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
    setSuggestedQuestions([...DEFAULT_SUGGESTED_QUESTIONS])
    clearConversationHistory(conversationIdRef.current)
    clearMessagesFromStorage()
    setRevenueData(null)
    clearDashboard()
    conversationIdRef.current = Date.now().toString()
    setLastError(null)
    showToast('Conversation cleared', 'info', 2000)
  }, [showToast, setRevenueData, clearDashboard])

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
