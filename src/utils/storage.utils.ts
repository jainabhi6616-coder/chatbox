/**
 * LocalStorage utilities for persisting data
 */

import { APP_CONFIG } from '../config/app.config'

const STORAGE_KEYS = APP_CONFIG.STORAGE_KEYS
const MESSAGES_BY_ACCOUNT_KEY = 'chatbot_messages_by_account'

/**
 * Save messages to localStorage (optionally scoped by account)
 */
export const saveMessagesToStorage = (messages: any[], account?: string): void => {
  try {
    if (account !== undefined && account !== null) {
      const all = loadAllMessagesByAccount()
      all[account] = messages
      localStorage.setItem(MESSAGES_BY_ACCOUNT_KEY, JSON.stringify(all))
    } else {
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages))
    }
  } catch (error) {
    console.warn('Failed to save messages to localStorage:', error)
  }
}

function loadAllMessagesByAccount(): Record<string, any[]> {
  try {
    const stored = localStorage.getItem(MESSAGES_BY_ACCOUNT_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return {}
}

/**
 * Load messages from localStorage (optionally scoped by account)
 */
export const loadMessagesFromStorage = (account?: string): any[] | null => {
  try {
    if (account !== undefined && account !== null) {
      const all = loadAllMessagesByAccount()
      const messages = all[account]
      return Array.isArray(messages) ? messages : null
    }
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES)
    if (stored) return JSON.parse(stored)
  } catch (error) {
    console.warn('Failed to load messages from localStorage:', error)
  }
  return null
}

/**
 * Clear messages from localStorage (optionally for one account only)
 */
export const clearMessagesFromStorage = (account?: string): void => {
  try {
    if (account !== undefined && account !== null) {
      const all = loadAllMessagesByAccount()
      delete all[account]
      localStorage.setItem(MESSAGES_BY_ACCOUNT_KEY, JSON.stringify(all))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES)
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION_ID)
      localStorage.removeItem(MESSAGES_BY_ACCOUNT_KEY)
    }
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

