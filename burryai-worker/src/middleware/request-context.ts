import type { MiddlewareHandler } from "hono"
import type { AppEnv } from "../types"

type CounterMap = Map<string, number>
const counters: CounterMap = new Map()

function incrementCounter(key: string): void {
  counters.set(key, (counters.get(key) ?? 0) + 1)
}

export function getMetricsSnapshot(): Record<string, number> {
  return Object.fromEntries(counters.entries())
}

export const requestContext: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  c.set("requestId", requestId)
  incrementCounter(`requests_total:${c.req.path}`)

  await next()

  const durationMs = Date.now() - startedAt
  c.header("x-request-id", requestId)
  console.log(
    JSON.stringify({
      level: "info",
      event: "request_completed",
      request_id: requestId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: durationMs
    })
  )
}
