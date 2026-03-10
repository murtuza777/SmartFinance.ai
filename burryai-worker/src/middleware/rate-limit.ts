import type { MiddlewareHandler } from "hono"
import type { AppEnv } from "../types"

type Bucket = {
  count: number
  resetAt: number
}

const memoryBuckets = new Map<string, Bucket>()

function toKey(path: string, actor: string): string {
  return `${path}:${actor}`
}

function getActor(c: Parameters<MiddlewareHandler<AppEnv>>[0]): string {
  const userId = c.get("userId")
  if (userId) return `user:${userId}`
  return c.req.header("cf-connecting-ip") ?? "anonymous"
}

export function createRateLimit(options: {
  limit: number
  windowMs: number
}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const actor = getActor(c)
    const key = toKey(c.req.path, actor)
    const now = Date.now()
    const current = memoryBuckets.get(key)

    if (!current || current.resetAt <= now) {
      memoryBuckets.set(key, { count: 1, resetAt: now + options.windowMs })
      await next()
      return
    }

    if (current.count >= options.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      c.header("Retry-After", String(retryAfterSec))
      return c.json({ error: "Too many requests. Please retry shortly." }, 429)
    }

    current.count += 1
    memoryBuckets.set(key, current)
    await next()
  }
}
