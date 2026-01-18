/**
 * LocalStorage utilities for persisting data
 */

import { APP_CONFIG } from '../config/app.config'

const STORAGE_KEYS = APP_CONFIG.STORAGE_KEYS

/**
 * Save messages to localStorage
 */
export const saveMessagesToStorage = (messages: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages))
  } catch (error) {
    console.warn('Failed to save messages to localStorage:', error)
  }
}

/**
 * Load messages from localStorage
 */
export const loadMessagesFromStorage = (): any[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error)
  }
  return null
}

/**
 * Clear messages from localStorage
 */
export const clearMessagesFromStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES)
    localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID)
  } catch (error) {
    console.warn('Failed to clear messages from localStorage:', error)
  }
}

/**
 * Save conversation ID
 */
export const saveConversationId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATION_ID, id)
  } catch (error) {
    console.warn('Failed to save conversation ID:', error)
  }
}

/**
 * Load conversation ID
 */
export const loadConversationId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CONVERSATION_ID)
  } catch (error) {
    console.warn('Failed to load conversation ID:', error)
    return null
  }
}

