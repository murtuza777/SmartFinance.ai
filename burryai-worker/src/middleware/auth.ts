import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"
import { verifySessionToken } from "../auth/jwt"
import type { AppEnv } from "../types"

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const secret = c.env.JWT_SECRET
  if (!secret) {
    return c.json({ error: "JWT secret is not configured" }, 500)
  }

  const authHeader = c.req.header("Authorization")
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined
  const cookieToken = getCookie(c, "session")
  const token = bearerToken || cookieToken

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  try {
    const payload = await verifySessionToken(token, secret)
    c.set("userId", payload.sub)
    await next()
  } catch {
    return c.json({ error: "Invalid or expired session" }, 401)
  }
}
