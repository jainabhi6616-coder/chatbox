/**
 * Application configuration
 * Centralizes all environment variables and app settings
 */

export const APP_CONFIG = {
  // API Configuration
  PYTHON_API_ENDPOINT: import.meta.env.VITE_PYTHON_API_ENDPOINT || 'http://az1lxappd01.levi.com:8000/chat',
  GRAPHQL_ENDPOINT: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8000/graphql',
  USE_GRAPHQL: import.meta.env.VITE_USE_GRAPHQL === 'true',
  ACCOUNT_TYPE: import.meta.env.VITE_ACCOUNT_TYPE || 'Revenue',
  
  // Cache Configuration
  CACHE_EXPIRATION_MS: 5 * 60 * 1000, // 5 minutes
  
  // Storage Keys
  STORAGE_KEYS: {
    CHAT_MESSAGES: 'chatbot_messages',
    CONVERSATION_ID: 'chatbot_conversation_id',
    SUGGESTED_QUESTIONS: 'chatbot_suggested_questions',
    AUTH_TOKEN: 'authToken',
  },
} as const

export type AppConfig = typeof APP_CONFIG

