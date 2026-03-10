import type { Context } from "hono"
import type { AppEnv } from "../types"

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message
  return "Unexpected server error"
}

export function handleAppError(error: unknown, c: Context<AppEnv>) {
  const requestId = c.get("requestId")
  console.error(
    JSON.stringify({
      level: "error",
      event: "request_error",
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      message: errorMessage(error)
    })
  )

  return c.json(
    {
      error: "Internal server error",
      request_id: requestId
    },
    500
  )
}
