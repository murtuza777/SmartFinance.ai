import { Hono } from "hono"
import type { Context } from "hono"
import { deleteCookie, setCookie } from "hono/cookie"
import { hash, compare } from "bcryptjs"
import { z } from "zod"
import { getSessionTtlSeconds, signSessionToken } from "../auth/jwt"
import { requireAuth } from "../middleware/auth"
import type { AppEnv } from "../types"

const emailSchema = z.email()
const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128)
})
const loginSchema = signupSchema

type UserRow = {
  id: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

function getSecureCookieFlag(url: string): boolean {
  return new URL(url).protocol === "https:"
}

async function readJsonBody<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return { ok: false, error: "Invalid JSON body" }
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request body" }
  }

  return { ok: true, value: parsed.data }
}

async function issueSessionCookie(c: Context<AppEnv>, userId: string, email: string) {
  const secret = c.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT secret is not configured")
  }

  const token = await signSessionToken(
    {
      sub: userId,
      email
    },
    secret
  )

  setCookie(c, "session", token, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: getSecureCookieFlag(c.req.url),
    maxAge: getSessionTtlSeconds()
  })
}

const authRoutes = new Hono<AppEnv>()

authRoutes.post("/signup", async (c) => {
  const body = await readJsonBody(c.req.raw, signupSchema)
  if (!body.ok) {
    return c.json({ error: body.error }, 400)
  }

  const email = body.value.email.trim().toLowerCase()
  const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?1 LIMIT 1")
    .bind(email)
    .first<{ id: string }>()

  if (existingUser) {
    return c.json({ error: "Email already in use" }, 409)
  }

  const userId = crypto.randomUUID()
  const passwordHash = await hash(body.value.password, 12)

  try {
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO users (id, email, password_hash) VALUES (?1, ?2, ?3)")
        .bind(userId, email, passwordHash),
      c.env.DB.prepare("INSERT INTO financial_profiles (user_id) VALUES (?1)").bind(userId)
    ])
  } catch {
    return c.json({ error: "Failed to create account" }, 500)
  }

  try {
    await issueSessionCookie(c, userId, email)
  } catch {
    return c.json({ error: "Failed to create session" }, 500)
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, created_at, updated_at FROM users WHERE id = ?1 LIMIT 1"
  )
    .bind(userId)
    .first<Omit<UserRow, "password_hash">>()

  return c.json({ user }, 201)
})

authRoutes.post("/login", async (c) => {
  const body = await readJsonBody(c.req.raw, loginSchema)
  if (!body.ok) {
    return c.json({ error: body.error }, 400)
  }

  const email = body.value.email.trim().toLowerCase()
  const user = await c.env.DB.prepare(
    "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?1 LIMIT 1"
  )
    .bind(email)
    .first<UserRow>()

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401)
  }

  const matches = await compare(body.value.password, user.password_hash)
  if (!matches) {
    return c.json({ error: "Invalid email or password" }, 401)
  }

  try {
    await issueSessionCookie(c, user.id, user.email)
  } catch {
    return c.json({ error: "Failed to create session" }, 500)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  })
})

authRoutes.post("/logout", async (c) => {
  deleteCookie(c, "session", { path: "/" })
  return c.json({ ok: true })
})

authRoutes.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId")
  const user = await c.env.DB.prepare(
    "SELECT id, email, created_at, updated_at FROM users WHERE id = ?1 LIMIT 1"
  )
    .bind(userId)
    .first<Omit<UserRow, "password_hash">>()

  if (!user) {
    return c.json({ error: "User not found" }, 404)
  }

  return c.json({ user })
})

export default authRoutes
