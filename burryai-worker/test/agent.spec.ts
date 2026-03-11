import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test"
import { beforeAll, describe, expect, it } from "vitest"
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

async function signupUser(testEnv: TestEnv): Promise<{ userId: string; cookie: string }> {
  const email = `phase6-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`
  const password = "Password1234!"

  const signupResponse = await runFetch(
    new IncomingRequest("http://example.com/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    }),
    testEnv
  )

  expect(signupResponse.status).toBe(201)
  const body = (await signupResponse.json()) as { user: { id: string } }
  return {
    userId: body.user.id,
    cookie: extractSessionCookie(signupResponse.headers.get("set-cookie"))
  }
}

describe("Agent routes", () => {
  beforeAll(async () => {
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"
    )
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS financial_profiles (user_id TEXT PRIMARY KEY NOT NULL, monthly_income REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USD', savings_goal REAL NOT NULL DEFAULT 0, risk_tolerance TEXT NOT NULL DEFAULT 'moderate', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)"
    )
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, amount REAL NOT NULL, category TEXT NOT NULL, description TEXT, date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)"
    )
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS loans (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, loan_name TEXT NOT NULL, principal_amount REAL NOT NULL, interest_rate REAL NOT NULL, minimum_payment REAL NOT NULL, remaining_balance REAL NOT NULL, due_date TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)"
    )
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS ai_logs (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, query TEXT NOT NULL, response TEXT NOT NULL, model_used TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE)"
    )
  })

  it("rejects unauthorized advice requests", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase6-agent-secret"
    }

    const response = await runFetch(
      new IncomingRequest("http://example.com/agent/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "How can I budget better?" })
      }),
      testEnv
    )

    expect(response.status).toBe(401)
  })

  it("returns advice and writes ai_logs row", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase6-agent-secret"
    }

    const user = await signupUser(testEnv)

    await env.DB.prepare("UPDATE financial_profiles SET monthly_income = ?1 WHERE user_id = ?2")
      .bind(3500, user.userId)
      .run()

    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO expenses (id, user_id, amount, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
      )
        .bind(crypto.randomUUID(), user.userId, 700, "Rent", "Rent", "2026-03-01"),
      env.DB.prepare(
        "INSERT INTO loans (id, user_id, loan_name, principal_amount, interest_rate, minimum_payment, remaining_balance, due_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
      )
        .bind(crypto.randomUUID(), user.userId, "Student Loan", 18000, 5.9, 300, 16200, "2026-04-20")
    ])

    const prompt = "Give me a debt repayment plan for this month."
    const response = await runFetch(
      new IncomingRequest("http://example.com/agent/advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: user.cookie
        },
        body: JSON.stringify({ message: prompt })
      }),
      testEnv
    )

    expect(response.status).toBe(200)
    const payload = (await response.json()) as {
      response: string
      model_used: string
      intent: string
      used_tools: string[]
      knowledge_sources: Array<{ title: string; source: string }>
      web_sources: Array<{ title: string; url: string; source: string }>
    }
    expect(payload.response.length).toBeGreaterThan(0)
    expect(payload.model_used.length).toBeGreaterThan(0)
    expect(payload.intent).toBe("debt")
    expect(payload.used_tools.length).toBeGreaterThan(0)
    expect(payload.used_tools).toContain("loanOptimizer")
    expect(payload.knowledge_sources.length).toBeGreaterThan(0)
    expect(Array.isArray(payload.web_sources)).toBe(true)
    if (payload.model_used.startsWith("fallback:")) {
      // Rule-based fallback returns structured advice; assert intent-related content
      expect(payload.response.toLowerCase()).toContain("debt")
    }

    const logRow = await env.DB.prepare(
      "SELECT user_id, query, response, model_used FROM ai_logs WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 1"
    )
      .bind(user.userId)
      .first<{
        user_id: string
        query: string
        response: string
        model_used: string
      }>()

    expect(logRow).not.toBeNull()
    expect(logRow?.user_id).toBe(user.userId)
    expect(logRow?.query).toBe(prompt)
    expect(logRow?.response.length ?? 0).toBeGreaterThan(0)
    expect(logRow?.model_used.length ?? 0).toBeGreaterThan(0)
  })
})
