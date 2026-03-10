import { z } from "zod"
import { baseToolInputSchema, type ToolDefinition } from "./types"

const outputSchema = z.object({
  monthlySavingsPotential: z.number(),
  riskLevel: z.enum(["low", "moderate", "high"]),
  recommendations: z.array(z.string())
})

function estimateSavingsPotential(monthlyExpenses: number, expenseRatio: number): number {
  if (monthlyExpenses <= 0) return 0
  if (expenseRatio >= 90) return monthlyExpenses * 0.15
  if (expenseRatio >= 70) return monthlyExpenses * 0.1
  if (expenseRatio >= 50) return monthlyExpenses * 0.06
  return monthlyExpenses * 0.03
}

function classifyRisk(expenseRatio: number, debtToIncomeRatio: number): "low" | "moderate" | "high" {
  if (expenseRatio >= 90 || debtToIncomeRatio >= 40) return "high"
  if (expenseRatio >= 70 || debtToIncomeRatio >= 20) return "moderate"
  return "low"
}

export const costCutterTool: ToolDefinition<typeof baseToolInputSchema, typeof outputSchema> = {
  name: "costCutter",
  description: "Analyze overspending patterns and propose spending cuts.",
  inputSchema: baseToolInputSchema,
  outputSchema,
  async run(input) {
    const potential = estimateSavingsPotential(input.context.monthlyExpenses, input.context.expenseRatio)
    const riskLevel = classifyRisk(input.context.expenseRatio, input.context.debtToIncomeRatio)
    const topCategory = input.context.topExpenseCategories[0]?.category
    const recommendations = [
      "Set weekly category spending caps and track against them every weekend.",
      "Cancel or downgrade unused subscriptions and recurring discretionary spend.",
      topCategory
        ? `Reduce ${topCategory} category spend by at least 10% this month.`
        : "Start categorizing expenses to identify your highest leak area.",
      "Use a 24-hour wait rule for non-essential purchases above $20."
    ]

    return {
      monthlySavingsPotential: Number(potential.toFixed(2)),
      riskLevel,
      recommendations
    }
  },
  summarize(output) {
    return `Estimated monthly savings potential is $${output.monthlySavingsPotential.toLocaleString()} with ${output.riskLevel} overspending risk.`
  }
}

export const __private__ = {
  estimateSavingsPotential,
  classifyRisk
}
