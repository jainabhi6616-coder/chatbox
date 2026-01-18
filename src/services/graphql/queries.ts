import { gql } from '@apollo/client'

// GraphQL query to get chatbot response
export const GET_CHATBOT_RESPONSE = gql`
  query GetChatbotResponse($query: String!, $conversationId: String) {
    getChatbotResponse(query: $query, conversationId: $conversationId) {
      id
      response
      query
      cached
      timestamp
      conversationId
    }
  }
`

// GraphQL mutation to send a message (if needed for side effects)
export const SEND_MESSAGE = gql`
  mutation SendMessage($query: String!, $conversationId: String) {
    sendMessage(query: $query, conversationId: $conversationId) {
      id
      response
      query
      cached
      timestamp
      conversationId
    }
  }
`

