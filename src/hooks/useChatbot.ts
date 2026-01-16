import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Message } from '../interfaces'
import {
  createMessage,
  createInitialBotMessage,
  createBotResponse,
} from '../utils/message.utils'
import { scrollToBottom } from '../utils/scroll.utils'
import { CHATBOT_CONFIG, DEFAULT_SUGGESTED_QUESTIONS } from '../constants'

export const useChatbot = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    createInitialBotMessage(),
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    scrollToBottom(messagesEndRef.current)
  }, [messages])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleSend = useCallback((messageText?: string) => {
    // Ensure we have a valid string
    const textToSend = typeof messageText === 'string' 
      ? messageText.trim() 
      : (typeof inputValue === 'string' ? inputValue.trim() : '')
    
    if (textToSend === '' || isLoading) return

    const userMessage = createMessage(textToSend, 'user')
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate bot response
    timeoutRef.current = setTimeout(() => {
      const botMessage = createBotResponse(textToSend)
      setMessages((prev) => [...prev, botMessage])
      setIsLoading(false)
    }, CHATBOT_CONFIG.BOT_RESPONSE_DELAY)
  }, [inputValue, isLoading])

  const handleSuggestedQuestionClick = useCallback((question: string) => {
    handleSend(question)
  }, [handleSend])

  const clearMessages = useCallback(() => {
    setMessages([createInitialBotMessage()])
  }, [])

  const suggestedQuestions = useMemo(() => DEFAULT_SUGGESTED_QUESTIONS, [])

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
  }
}

