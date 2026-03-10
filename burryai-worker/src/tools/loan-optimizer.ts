import { z } from "zod"
import { baseToolInputSchema, type ToolDefinition } from "./types"

type LoanRow = {
  loan_name: string
  remaining_balance: number
  interest_rate: number
  minimum_payment: number
  due_date: string | null
}

const outputSchema = z.object({
  totalLoanBalance: z.number(),
  monthlyMinimumPayments: z.number(),
  strategy: z.enum(["avalanche", "snowball", "none"]),
  nextPriorityLoan: z.string().nullable(),
  recommendations: z.array(z.string())
})

function chooseStrategy(loans: LoanRow[]): "avalanche" | "snowball" | "none" {
  if (loans.length === 0) return "none"
  const highestInterest = Math.max(...loans.map((loan) => loan.interest_rate))
  return highestInterest >= 8 ? "avalanche" : "snowball"
}

function pickPriorityLoan(loans: LoanRow[], strategy: "avalanche" | "snowball"): LoanRow | null {
  if (loans.length === 0) return null
  const sorted = [...loans].sort((a, b) => {
    if (strategy === "avalanche") {
      return b.interest_rate - a.interest_rate || a.remaining_balance - b.remaining_balance
    }
    return a.remaining_balance - b.remaining_balance || b.interest_rate - a.interest_rate
  })
  return sorted[0] ?? null
}

export const loanOptimizerTool: ToolDefinition<typeof baseToolInputSchema, typeof outputSchema> = {
  name: "loanOptimizer",
  description: "Recommend debt payoff strategy and loan repayment priority.",
  inputSchema: baseToolInputSchema,
  outputSchema,
  async run(input, ctx) {
    const rows = await ctx.db
      .prepare(
        "SELECT loan_name, remaining_balance, interest_rate, minimum_payment, due_date FROM loans WHERE user_id = ?1 AND remaining_balance > 0 ORDER BY interest_rate DESC, remaining_balance ASC"
      )
      .bind(input.userId)
      .all<LoanRow>()

    const loans = rows.results ?? []
    const strategy = chooseStrategy(loans)
    const target = strategy === "none" ? null : pickPriorityLoan(loans, strategy)
    const totalLoanBalance = loans.reduce((sum, loan) => sum + loan.remaining_balance, 0)
    const monthlyMinimumPayments = loans.reduce((sum, loan) => sum + loan.minimum_payment, 0)

    const recommendations =
      strategy === "none"
        ? ["No active loans found. Redirect debt payment budget into savings and emergency fund."]
        : [
            `Keep making all minimum payments totaling $${monthlyMinimumPayments.toLocaleString()} per month.`,
            `Use the ${strategy} method and direct any extra payment toward ${target?.loan_name ?? "the priority loan"}.`,
            "Automate payments at least 3 days before due dates to avoid penalties."
          ]

    return {
      totalLoanBalance: Number(totalLoanBalance.toFixed(2)),
      monthlyMinimumPayments: Number(monthlyMinimumPayments.toFixed(2)),
      strategy,
      nextPriorityLoan: target?.loan_name ?? null,
      recommendations
    }
  },
  summarize(output) {
    if (output.strategy === "none") {
      return "No outstanding loan balance found."
    }

    return `Loan strategy: ${output.strategy}; prioritize ${output.nextPriorityLoan ?? "next loan"} with total balance $${output.totalLoanBalance.toLocaleString()}.`
  }
}

export const __private__ = {
  chooseStrategy,
  pickPriorityLoan
}
