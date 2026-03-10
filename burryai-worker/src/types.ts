export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  GEMINI_API_KEY?: string
  GEMINI_MODEL?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
