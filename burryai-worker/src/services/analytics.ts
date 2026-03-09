export type FinancialHealthInput = {
  monthlyIncome: number
  monthlyExpenses: number
  monthlyLoanPayments: number
}

export type FinancialSummary = {
  total_income: number
  total_expenses: number
  monthly_loan_payments: number
  remaining_balance: number
  expense_ratio: number
  debt_to_income_ratio: number
  total_loan_balance: number
  loans_count: number
  expenses_count: number
  financial_health_score: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function calculateFinancialHealthScore(input: FinancialHealthInput): number {
  if (input.monthlyIncome <= 0) {
    if (input.monthlyExpenses <= 0 && input.monthlyLoanPayments <= 0) {
      return 50
    }
    return 15
  }

  const expenseRatio = clamp(input.monthlyExpenses / input.monthlyIncome, 0, 2)
  const debtRatio = clamp(input.monthlyLoanPayments / input.monthlyIncome, 0, 2)
  const savingsRatio = clamp(
    (input.monthlyIncome - input.monthlyExpenses - input.monthlyLoanPayments) / input.monthlyIncome,
    -1,
    1
  )

  const expenseScore = (1 - Math.min(expenseRatio, 1)) * 40
  const debtScore = (1 - Math.min(debtRatio, 1)) * 35
  const savingsScore = clamp((savingsRatio + 1) * 12.5, 0, 25)

  return Math.round(clamp(expenseScore + debtScore + savingsScore, 0, 100))
}

type AggregatesRow = {
  monthly_income: number | null
  total_expenses: number | null
  monthly_loan_payments: number | null
  total_loan_balance: number | null
  loans_count: number | null
  expenses_count: number | null
}

export async function buildFinancialSummary(db: D1Database, userId: string): Promise<FinancialSummary> {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [profileRow, expenseRow, loanRow] = await Promise.all([
    db.prepare("SELECT monthly_income FROM financial_profiles WHERE user_id = ?1 LIMIT 1")
      .bind(userId)
      .first<{ monthly_income: number }>(),
    db.prepare(
      "SELECT COALESCE(SUM(amount), 0) AS total_expenses, COUNT(*) AS expenses_count FROM expenses WHERE user_id = ?1 AND substr(date, 1, 7) = ?2"
    )
      .bind(userId, currentMonth)
      .first<{ total_expenses: number; expenses_count: number }>(),
    db.prepare(
      "SELECT COALESCE(SUM(minimum_payment), 0) AS monthly_loan_payments, COALESCE(SUM(remaining_balance), 0) AS total_loan_balance, COUNT(*) AS loans_count FROM loans WHERE user_id = ?1"
    )
      .bind(userId)
      .first<{ monthly_loan_payments: number; total_loan_balance: number; loans_count: number }>()
  ])

  const aggregates: AggregatesRow = {
    monthly_income: profileRow?.monthly_income ?? 0,
    total_expenses: expenseRow?.total_expenses ?? 0,
    expenses_count: expenseRow?.expenses_count ?? 0,
    monthly_loan_payments: loanRow?.monthly_loan_payments ?? 0,
    total_loan_balance: loanRow?.total_loan_balance ?? 0,
    loans_count: loanRow?.loans_count ?? 0
  }

  const totalIncome = aggregates.monthly_income ?? 0
  const totalExpenses = aggregates.total_expenses ?? 0
  const monthlyLoanPayments = aggregates.monthly_loan_payments ?? 0
  const remainingBalance = totalIncome - totalExpenses - monthlyLoanPayments
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const debtToIncomeRatio = totalIncome > 0 ? (monthlyLoanPayments / totalIncome) * 100 : 0
  const financialHealthScore = calculateFinancialHealthScore({
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpenses,
    monthlyLoanPayments
  })

  return {
    total_income: Number(totalIncome.toFixed(2)),
    total_expenses: Number(totalExpenses.toFixed(2)),
    monthly_loan_payments: Number(monthlyLoanPayments.toFixed(2)),
    remaining_balance: Number(remainingBalance.toFixed(2)),
    expense_ratio: Number(expenseRatio.toFixed(2)),
    debt_to_income_ratio: Number(debtToIncomeRatio.toFixed(2)),
    total_loan_balance: Number((aggregates.total_loan_balance ?? 0).toFixed(2)),
    loans_count: aggregates.loans_count ?? 0,
    expenses_count: aggregates.expenses_count ?? 0,
    financial_health_score: financialHealthScore
  }
}
