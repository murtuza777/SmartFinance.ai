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
  const email = `phase3-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`
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
  const cookie = extractSessionCookie(signupResponse.headers.get("set-cookie"))
  const body = (await signupResponse.json()) as { user: { id: string } }

  return {
    userId: body.user.id,
    cookie
  }
}

describe("Financial data routes", () => {
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

  it("creates and lists expenses with income context", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase3-financial-test-secret"
    }

    const { userId, cookie } = await signupUser(testEnv)
    await env.DB.prepare("UPDATE financial_profiles SET monthly_income = ?1 WHERE user_id = ?2")
      .bind(4200, userId)
      .run()

    const createExpenseResponse = await runFetch(
      new IncomingRequest("http://example.com/expenses", {
        method: "POST",
        headers: {
          Cookie: cookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: "Food",
          amount: 28.5,
          description: "Lunch"
        })
      }),
      testEnv
    )
    expect(createExpenseResponse.status).toBe(201)

    const listExpensesResponse = await runFetch(
      new IncomingRequest("http://example.com/expenses", {
        method: "GET",
        headers: { Cookie: cookie }
      }),
      testEnv
    )

    expect(listExpensesResponse.status).toBe(200)
    const listBody = (await listExpensesResponse.json()) as {
      monthly_income: number
      expenses: Array<{ user_id: string; category: string }>
    }

    expect(listBody.monthly_income).toBe(4200)
    expect(listBody.expenses.some((expense) => expense.user_id === userId)).toBe(true)
    expect(listBody.expenses.some((expense) => expense.category === "Food")).toBe(true)
  })

  it("rejects unauthorized access to protected financial endpoints", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase3-financial-test-secret"
    }

    const expensesResponse = await runFetch(
      new IncomingRequest("http://example.com/expenses", { method: "GET" }),
      testEnv
    )
    expect(expensesResponse.status).toBe(401)

    const loansResponse = await runFetch(
      new IncomingRequest("http://example.com/loans", { method: "GET" }),
      testEnv
    )
    expect(loansResponse.status).toBe(401)
  })

  it("keeps loan data user-scoped and supports README-style loan fields", async () => {
    const testEnv: TestEnv = {
      ...env,
      JWT_SECRET: "phase3-financial-test-secret"
    }

    const userA = await signupUser(testEnv)
    const userB = await signupUser(testEnv)

    const createLoanResponse = await runFetch(
      new IncomingRequest("http://example.com/loans", {
        method: "POST",
        headers: {
          Cookie: userA.cookie,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loan_amount: 15000,
          interest_rate: 6.2,
          monthly_payment: 250,
          next_payment_date: "2026-04-01"
        })
      }),
      testEnv
    )

    expect(createLoanResponse.status).toBe(201)
    const createBody = (await createLoanResponse.json()) as {
      loan: { user_id: string; principal_amount: number; due_date: string | null }
    }
    expect(createBody.loan.user_id).toBe(userA.userId)
    expect(createBody.loan.principal_amount).toBe(15000)
    expect(createBody.loan.due_date).toBe("2026-04-01")

    const userBLoansResponse = await runFetch(
      new IncomingRequest("http://example.com/loans", {
        method: "GET",
        headers: { Cookie: userB.cookie }
      }),
      testEnv
    )
    expect(userBLoansResponse.status).toBe(200)
    const userBBody = (await userBLoansResponse.json()) as {
      loans: Array<{ user_id: string }>
    }
    expect(userBBody.loans.some((loan) => loan.user_id === userA.userId)).toBe(false)
  })
})
