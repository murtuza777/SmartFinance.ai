import type { AgentContextData, AgentToolName, AgentToolOutput } from "../state"

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`
}

function runFinancialSummaryTool(context: AgentContextData): string {
  return `Income ${formatCurrency(context.monthlyIncome)}, expenses ${formatCurrency(context.monthlyExpenses)}, loan payments ${formatCurrency(context.monthlyLoanPayments)}, remaining ${formatCurrency(context.remainingBalance)}.`
}

function runExpenseInsightsTool(context: AgentContextData): string {
  const topCategory = context.topExpenseCategories[0]
  if (!topCategory) {
    return "No expense categories logged yet. Add expenses to unlock category-level insights."
  }

  return `Top expense category is ${topCategory.category} at ${formatCurrency(topCategory.amount)}. Expense ratio is ${context.expenseRatio.toFixed(1)}% of income.`
}

function runLoanInsightsTool(context: AgentContextData): string {
  if (context.totalLoanBalance <= 0) {
    return "No active loan balance found."
  }

  return `Total loan balance is ${formatCurrency(context.totalLoanBalance)} with monthly debt burden ${context.debtToIncomeRatio.toFixed(1)}% of income.`
}

function runSavingsPlannerTool(context: AgentContextData): string {
  const recommendedSavings = Math.max(context.monthlyIncome * 0.2, 0)
  const gap = recommendedSavings - Math.max(context.remainingBalance, 0)

  if (gap <= 0) {
    return `You are meeting a 20% savings target (${formatCurrency(recommendedSavings)}). Keep this pace consistent.`
  }

  return `Target 20% monthly savings is ${formatCurrency(recommendedSavings)}. You are short by ${formatCurrency(gap)}; reduce non-essential spend or increase income to close the gap.`
}

export function runSelectedTools(
  selectedTools: AgentToolName[],
  context: AgentContextData
): AgentToolOutput[] {
  return selectedTools.map((tool) => {
    switch (tool) {
      case "financial_summary":
        return { name: tool, content: runFinancialSummaryTool(context) }
      case "expense_insights":
        return { name: tool, content: runExpenseInsightsTool(context) }
      case "loan_insights":
        return { name: tool, content: runLoanInsightsTool(context) }
      case "savings_planner":
        return { name: tool, content: runSavingsPlannerTool(context) }
      default:
        return { name: tool, content: "No tool output available." }
    }
  })
}
