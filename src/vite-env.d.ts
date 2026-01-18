/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PYTHON_API_ENDPOINT?: string
  readonly VITE_GRAPHQL_ENDPOINT?: string
  readonly VITE_USE_GRAPHQL?: string
  readonly VITE_AUTH_TOKEN?: string
  readonly VITE_ACCOUNT_TYPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

