export type Bindings = {
  DB: D1Database
  ENABLE_VECTORIZE_RAG?: string
  FINANCE_KB_INDEX?: Vectorize
  JWT_SECRET: string
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
  WEB_SEARCH_PROVIDER?: string
  TAVILY_API_KEY?: string
  SERPER_API_KEY?: string
}

export type Variables = {
  userId: string
  requestId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
