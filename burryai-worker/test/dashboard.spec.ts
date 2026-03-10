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
  const email = `phase5-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`
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

function isoDateWithMonthOffset(offset: number): string {
  const date = new Date()
  const adjusted = new Date(date.getFullYear(), date.getMonth() + offset, 10)
  return adjusted.toISOString().slice(0, 10)
}

describe("Dashboard routes", () => {
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
  })

  it("returns dashboard analytics payloads for all phase 5 endpoints", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase5-dashboard-secret"
    }

    const user = await signupUser(testEnv)

    await env.DB.prepare("UPDATE financial_profiles SET monthly_income = ?1 WHERE user_id = ?2")
      .bind(4500, user.userId)
      .run()

    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO expenses (id, user_id, amount, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
      )
        .bind(crypto.randomUUID(), user.userId, 800, "Rent", "Rent", isoDateWithMonthOffset(0)),
      env.DB.prepare(
        "INSERT INTO expenses (id, user_id, amount, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
      )
        .bind(crypto.randomUUID(), user.userId, 250, "Food", "Groceries", isoDateWithMonthOffset(-1)),
      env.DB.prepare(
        "INSERT INTO loans (id, user_id, loan_name, principal_amount, interest_rate, minimum_payment, remaining_balance, due_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
      )
        .bind(crypto.randomUUID(), user.userId, "Student Loan", 20000, 6.1, 320, 18000, "2026-05-01")
    ])

    const expenseSummaryResponse = await runFetch(
      new IncomingRequest("http://example.com/dashboard/expense-summary", {
        method: "GET",
        headers: { Cookie: user.cookie }
      }),
      testEnv
    )
    expect(expenseSummaryResponse.status).toBe(200)
    const expenseSummary = (await expenseSummaryResponse.json()) as {
      summary: {
        by_category: Array<{ category: string }>
      }
    }
    expect(expenseSummary.summary.by_category.some((item) => item.category === "Rent")).toBe(true)

    const financialScoreResponse = await runFetch(
      new IncomingRequest("http://example.com/dashboard/financial-score", {
        method: "GET",
        headers: { Cookie: user.cookie }
      }),
      testEnv
    )
    expect(financialScoreResponse.status).toBe(200)
    const scorePayload = (await financialScoreResponse.json()) as {
      score: number
      grade: string
    }
    expect(scorePayload.score).toBeGreaterThanOrEqual(0)
    expect(scorePayload.score).toBeLessThanOrEqual(100)
    expect(["A", "B", "C", "D", "F"]).toContain(scorePayload.grade)

    const chartsResponse = await runFetch(
      new IncomingRequest("http://example.com/dashboard/charts", {
        method: "GET",
        headers: { Cookie: user.cookie }
      }),
      testEnv
    )
    expect(chartsResponse.status).toBe(200)
    const chartsPayload = (await chartsResponse.json()) as {
      charts: {
        monthlyTrend: Array<unknown>
        expenseByCategory: Array<{ name: string }>
      }
    }
    expect(chartsPayload.charts.monthlyTrend.length).toBe(6)
    expect(chartsPayload.charts.expenseByCategory.some((item) => item.name === "Rent")).toBe(true)

    const timelineResponse = await runFetch(
      new IncomingRequest("http://example.com/dashboard/timeline", {
        method: "GET",
        headers: { Cookie: user.cookie }
      }),
      testEnv
    )
    expect(timelineResponse.status).toBe(200)
    const timelinePayload = (await timelineResponse.json()) as {
      timeline: Array<{ type: string }>
    }
    expect(timelinePayload.timeline.some((item) => item.type === "loan_payment_due")).toBe(true)
    expect(timelinePayload.timeline.some((item) => item.type === "expense_logged")).toBe(true)
  })

  it("keeps dashboard responses user scoped", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase5-dashboard-secret"
    }

    const userA = await signupUser(testEnv)
    const userB = await signupUser(testEnv)

    await env.DB.prepare(
      "INSERT INTO expenses (id, user_id, amount, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
      .bind(crypto.randomUUID(), userA.userId, 999, "Private", "Should stay private", isoDateWithMonthOffset(0))
      .run()

    const response = await runFetch(
      new IncomingRequest("http://example.com/dashboard/expense-summary", {
        method: "GET",
        headers: { Cookie: userB.cookie }
      }),
      testEnv
    )

    expect(response.status).toBe(200)
    const payload = (await response.json()) as {
      summary: {
        by_category: Array<{ category: string }>
      }
    }
    expect(payload.summary.by_category.some((item) => item.category === "Private")).toBe(false)
  })
})
