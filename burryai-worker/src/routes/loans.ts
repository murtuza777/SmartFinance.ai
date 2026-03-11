import { Hono } from "hono"
import { z } from "zod"
import { requireAuth } from "../middleware/auth"
import { createLoan, getMonthlyIncome, listLoans } from "../services/financial-data"
import type { AppEnv } from "../types"

const loanInputSchema = z
  .object({
    loan_name: z.string().trim().min(1).max(120).optional(),
    loanName: z.string().trim().min(1).max(120).optional(),
    principal_amount: z.coerce.number().nonnegative().optional(),
    principalAmount: z.coerce.number().nonnegative().optional(),
    loan_amount: z.coerce.number().nonnegative().optional(),
    loanAmount: z.coerce.number().nonnegative().optional(),
    interest_rate: z.coerce.number().min(0).max(100).optional(),
    interestRate: z.coerce.number().min(0).max(100).optional(),
    minimum_payment: z.coerce.number().nonnegative().optional(),
    minimumPayment: z.coerce.number().nonnegative().optional(),
    monthly_payment: z.coerce.number().nonnegative().optional(),
    monthlyPayment: z.coerce.number().nonnegative().optional(),
    remaining_balance: z.coerce.number().nonnegative().optional(),
    remainingBalance: z.coerce.number().nonnegative().optional(),
    due_date: z.iso.date().optional().nullable(),
    dueDate: z.iso.date().optional().nullable(),
    next_payment_date: z.iso.date().optional().nullable(),
    nextPaymentDate: z.iso.date().optional().nullable()
  })
  .superRefine((value, ctx) => {
    const principalAmount =
      value.principalAmount ?? value.principal_amount ?? value.loanAmount ?? value.loan_amount
    const interestRate = value.interestRate ?? value.interest_rate
    const minimumPayment =
      value.minimumPayment ?? value.minimum_payment ?? value.monthlyPayment ?? value.monthly_payment

    if (principalAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing principal amount"
      })
    }

    if (interestRate === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing interest rate"
      })
    }

    if (minimumPayment === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing minimum or monthly payment"
      })
    }
  })
  .transform((value) => {
    const principalAmount =
      value.principalAmount ?? value.principal_amount ?? value.loanAmount ?? value.loan_amount
    const interestRate = value.interestRate ?? value.interest_rate
    const minimumPayment =
      value.minimumPayment ?? value.minimum_payment ?? value.monthlyPayment ?? value.monthly_payment

    if (
      principalAmount === undefined ||
      interestRate === undefined ||
      minimumPayment === undefined
    ) {
      throw new Error("Loan payload failed validation")
    }

    return {
      loan_name: value.loanName ?? value.loan_name ?? "Student Loan",
      principal_amount: principalAmount,
      interest_rate: interestRate,
      minimum_payment: minimumPayment,
      remaining_balance: value.remainingBalance ?? value.remaining_balance ?? principalAmount,
      due_date:
        value.dueDate ??
        value.due_date ??
        value.nextPaymentDate ??
        value.next_payment_date ??
        null
    }
  })

async function readLoanBody(req: Request): Promise<
  | {
      ok: true
      value: z.infer<typeof loanInputSchema>
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

  const parsed = loanInputSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request body" }
  }

  return { ok: true, value: parsed.data }
}

const loansRoutes = new Hono<AppEnv>()
loansRoutes.use("*", requireAuth)

loansRoutes.post("/", async (c) => {
  const body = await readLoanBody(c.req.raw)
  if (!body.ok) {
    return c.json({ error: body.error }, 400)
  }

  try {
    const userId = c.get("userId")
    const loan = await createLoan(c.env.DB, userId, body.value)
    if (!loan) {
      return c.json({ error: "Failed to create loan" }, 500)
    }

    return c.json({ loan }, 201)
  } catch {
    return c.json({ error: "Failed to create loan" }, 500)
  }
})

loansRoutes.get("/", async (c) => {
  try {
    const userId = c.get("userId")
    const [loans, monthlyIncome] = await Promise.all([
      listLoans(c.env.DB, userId),
      getMonthlyIncome(c.env.DB, userId)
    ])

    return c.json({
      monthly_income: monthlyIncome,
      loans
    })
  } catch {
    return c.json({ error: "Failed to fetch loans" }, 500)
  }
})

loansRoutes.delete("/:id", async (c) => {
  try {
    const userId = c.get("userId")
    const loanId = c.req.param("id")
    const result = await c.env.DB.prepare(
      "DELETE FROM loans WHERE id = ?1 AND user_id = ?2"
    )
      .bind(loanId, userId)
      .run()

    if (!result.meta.changes || result.meta.changes === 0) {
      return c.json({ error: "Loan not found" }, 404)
    }

    return c.json({ ok: true })
  } catch {
    return c.json({ error: "Failed to delete loan" }, 500)
  }
})

export default loansRoutes
