import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test"
import { describe, expect, it, beforeAll } from "vitest"
import worker from "../src/index"

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>

type TestEnv = typeof env & {
  JWT_SECRET: string
}

function extractSessionCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) {
    throw new Error("Missing set-cookie header")
  }

  const sessionCookie = setCookieHeader.split(";")[0]
  if (!sessionCookie.startsWith("session=")) {
    throw new Error("Session cookie not found")
  }

  return sessionCookie
}

async function runFetch(request: Request, testEnv: TestEnv): Promise<Response> {
  const ctx = createExecutionContext()
  const response = await worker.fetch(request, testEnv, ctx)
  await waitOnExecutionContext(ctx)
  return response
}

describe("Auth routes", () => {
  beforeAll(async () => {
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS financial_profiles (user_id TEXT PRIMARY KEY NOT NULL, monthly_income REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', savings_goal REAL NOT NULL DEFAULT 0, risk_tolerance TEXT NOT NULL DEFAULT 'moderate', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)"
    )
  })

  it("supports signup, me, logout, and login", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "test-secret-for-auth-routes"
    }

    const uniqueEmail = `auth-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`
    const password = "Password1234!"

    const signupResponse = await runFetch(
      new IncomingRequest("http://example.com/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: uniqueEmail, password })
      }),
      testEnv
    )

    expect(signupResponse.status).toBe(201)
    const signupCookie = extractSessionCookie(signupResponse.headers.get("set-cookie"))
    const signupBody = (await signupResponse.json()) as { user: { email: string } }
    expect(signupBody.user.email).toBe(uniqueEmail)

    const meResponseAfterSignup = await runFetch(
      new IncomingRequest("http://example.com/auth/me", {
        method: "GET",
        headers: { Cookie: signupCookie }
      }),
      testEnv
    )
    expect(meResponseAfterSignup.status).toBe(200)

    const logoutResponse = await runFetch(
      new IncomingRequest("http://example.com/auth/logout", {
        method: "POST",
        headers: { Cookie: signupCookie }
      }),
      testEnv
    )
    expect(logoutResponse.status).toBe(200)

    const meResponseAfterLogout = await runFetch(
      new IncomingRequest("http://example.com/auth/me", {
        method: "GET"
      }),
      testEnv
    )
    expect(meResponseAfterLogout.status).toBe(401)

    const loginResponse = await runFetch(
      new IncomingRequest("http://example.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: uniqueEmail, password })
      }),
      testEnv
    )

    expect(loginResponse.status).toBe(200)
    const loginCookie = extractSessionCookie(loginResponse.headers.get("set-cookie"))
    const meResponseAfterLogin = await runFetch(
      new IncomingRequest("http://example.com/auth/me", {
        method: "GET",
        headers: { Cookie: loginCookie }
      }),
      testEnv
    )
    expect(meResponseAfterLogin.status).toBe(200)
  })
})
