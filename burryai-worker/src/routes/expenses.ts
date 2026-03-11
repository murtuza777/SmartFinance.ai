import { Hono } from "hono"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"
import type { AppEnv } from "../types"
import { createExpense, getMonthlyIncome, listExpenses } from "../services/financial-data"

const expenseSchema = z.object({
  amount: z.coerce.number().nonnegative(),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional().nullable(),
  date: z.iso.date().optional()
})

async function readExpenseBody(req: Request): Promise<
  | {
      ok: true
      value: z.infer<typeof expenseSchema>
    }
  | {
      ok: false
      error: string
    }
> {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return { ok: false, error: "Invalid JSON body" }
  }

  const parsed = expenseSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request body" }
  }

  return { ok: true, value: parsed.data }
}

const expensesRoutes = new Hono<AppEnv>()
expensesRoutes.use("*", requireAuth)

expensesRoutes.post("/", async (c) => {
  const body = await readExpenseBody(c.req.raw)
  if (!body.ok) {
    return c.json({ error: body.error }, 400)
  }

  try {
    const userId = c.get("userId")
    const expense = await createExpense(c.env.DB, userId, {
      amount: body.value.amount,
      category: body.value.category,
      description: body.value.description ?? null,
      date: body.value.date ?? new Date().toISOString().slice(0, 10)
    })

    if (!expense) {
      return c.json({ error: "Failed to create expense" }, 500)
    }

    return c.json({ expense }, 201)
  } catch {
    return c.json({ error: "Failed to create expense" }, 500)
  }
})

expensesRoutes.get("/", async (c) => {
  try {
    const userId = c.get("userId")
    const [expenses, monthlyIncome] = await Promise.all([
      listExpenses(c.env.DB, userId),
      getMonthlyIncome(c.env.DB, userId)
    ])

    return c.json({
      monthly_income: monthlyIncome,
      expenses
    })
  } catch {
    return c.json({ error: "Failed to fetch expenses" }, 500)
  }
})

expensesRoutes.delete("/:id", async (c) => {
  try {
    const userId = c.get("userId")
    const expenseId = c.req.param("id")
    const result = await c.env.DB.prepare(
      "DELETE FROM expenses WHERE id = ?1 AND user_id = ?2"
    )
      .bind(expenseId, userId)
      .run()

    if (!result.meta.changes || result.meta.changes === 0) {
      return c.json({ error: "Expense not found" }, 404)
    }

    return c.json({ ok: true })
  } catch {
    return c.json({ error: "Failed to delete expense" }, 500)
  }
})

export default expensesRoutes
