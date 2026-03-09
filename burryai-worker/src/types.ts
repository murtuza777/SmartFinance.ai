export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
