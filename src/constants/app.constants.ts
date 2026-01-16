export const CHATBOT_CONFIG = {
  BOT_NAME: 'Chat Assistant',
  BOT_AVATAR: '🤖',
  STATUS: 'Online',
  INITIAL_MESSAGE: 'Hi, how can I help you today?',
  BOT_RESPONSE_DELAY: 1000, // milliseconds
  DEFAULT_BOT_RESPONSE: 'Thanks for your message! This is a demo response.',
} as const

export const MESSAGE_CONFIG = {
  MAX_WIDTH: '75%',
  MAX_WIDTH_MOBILE: '85%',
} as const

export const ANIMATION_CONFIG = {
  FADE_IN_DURATION: 0.3,
} as const

