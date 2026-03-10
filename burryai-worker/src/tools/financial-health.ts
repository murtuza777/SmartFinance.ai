import { z } from "zod"
import { calculateFinancialHealthScore } from "../services/analytics"
import { baseToolInputSchema, type ToolDefinition } from "./types"

const outputSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.enum(["excellent", "good", "fair", "critical"]),
  debtToIncomeRatio: z.number(),
  expenseRatio: z.number(),
  diagnostics: z.array(z.string())
})

function toGrade(score: number): "excellent" | "good" | "fair" | "critical" {
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  if (score >= 40) return "fair"
  return "critical"
}

export const financialHealthTool: ToolDefinition<typeof baseToolInputSchema, typeof outputSchema> = {
  name: "financialHealth",
  description: "Compute financial health score and diagnostics.",
  inputSchema: baseToolInputSchema,
  outputSchema,
  async run(input) {
    const score = calculateFinancialHealthScore({
      monthlyIncome: input.context.monthlyIncome,
      monthlyExpenses: input.context.monthlyExpenses,
      monthlyLoanPayments: input.context.monthlyLoanPayments
    })
    const grade = toGrade(score)
    const diagnostics = [
      `Expense ratio: ${input.context.expenseRatio.toFixed(1)}%`,
      `Debt-to-income ratio: ${input.context.debtToIncomeRatio.toFixed(1)}%`,
      `Monthly remaining balance: $${input.context.remainingBalance.toLocaleString()}`
    ]

    return {
      score,
      grade,
      debtToIncomeRatio: input.context.debtToIncomeRatio,
      expenseRatio: input.context.expenseRatio,
      diagnostics
    }
  },
  summarize(output) {
    return `Financial health score ${output.score}/100 (${output.grade}).`
  }
}

export const __private__ = {
  toGrade
}
