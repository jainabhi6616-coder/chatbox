import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'

import { APP_CONFIG } from '../../config/app.config'

// Configure the HTTP link to your GraphQL endpoint
const httpLink = createHttpLink({
  uri: APP_CONFIG.GRAPHQL_ENDPOINT,
})

// Add authentication headers if needed
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

// Configure cache with custom policies for better caching
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Cache chatbot responses by query text
        getChatbotResponse: {
          keyArgs: ['query'],
          merge(_existing, incoming) {
            // Cache responses based on the query text
            return incoming
          },
        },
      },
    },
    ChatResponse: {
      fields: {
        // Cache individual chat responses
        cachedAt: {
          read() {
            return new Date().toISOString()
          },
        },
      },
    },
  },
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Use cache first, then network
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first', // Use cache if available
      errorPolicy: 'all',
    },
  },
})

