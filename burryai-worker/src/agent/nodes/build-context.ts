import type { AgentContextData } from "../state"
import { buildFinancialSummary } from "../../services/analytics"

type CategoryRow = {
  category: string
  amount: number
}

export async function buildAgentContext(db: D1Database, userId: string): Promise<AgentContextData> {
  const [summary, categories] = await Promise.all([
    buildFinancialSummary(db, userId),
    db.prepare(
      "SELECT category, COALESCE(SUM(amount), 0) AS amount FROM expenses WHERE user_id = ?1 GROUP BY category ORDER BY amount DESC LIMIT 5"
    )
      .bind(userId)
      .all<CategoryRow>()
  ])

  return {
    monthlyIncome: summary.total_income,
    monthlyExpenses: summary.total_expenses,
    monthlyLoanPayments: summary.monthly_loan_payments,
    remainingBalance: summary.remaining_balance,
    expenseRatio: summary.expense_ratio,
    debtToIncomeRatio: summary.debt_to_income_ratio,
    financialHealthScore: summary.financial_health_score,
    topExpenseCategories: (categories.results ?? []).map((row) => ({
      category: row.category,
      amount: Number(row.amount.toFixed(2))
    })),
    totalLoanBalance: summary.total_loan_balance
  }
}
