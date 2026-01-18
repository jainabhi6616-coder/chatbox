import { lazy, Suspense } from 'react'
import App from '../App'

// Conditionally load Apollo Provider only if GraphQL is enabled
const USE_GRAPHQL = import.meta.env.VITE_USE_GRAPHQL === 'true'

const GraphQLApp = lazy(async () => {
  const { ApolloProvider } = await import('@apollo/client/react')
  const { apolloClient } = await import('../services/graphql/apollo-client')
  
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    ),
  }
})

export const AppWrapper = () => {
  if (USE_GRAPHQL) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <GraphQLApp>
          <App />
        </GraphQLApp>
      </Suspense>
    )
  }
  
  return <App />
}

