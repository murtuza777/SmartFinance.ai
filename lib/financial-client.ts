export type RiskTolerance = "low" | "moderate" | "high"

export interface FinancialProfile {
  full_name: string
  country: string
  student_status: string
  university: string
  onboarding_completed: boolean
  monthly_income: number
  currency: string
  savings_goal: number
  risk_tolerance: RiskTolerance
}

export interface FinancialSummary {
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

export interface ExpenseItem {
  id: string
  user_id: string
  amount: number
  category: string
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export interface LoanItem {
  id: string
  user_id: string
  loan_name: string
  principal_amount: number
  interest_rate: number
  minimum_payment: number
  remaining_balance: number
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface DashboardExpenseSummary {
  summary: {
    total_expenses: number
    monthly_income: number
    remaining_balance: number
    by_category: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
}

export interface DashboardFinancialScore {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  metrics: {
    total_income: number
    total_expenses: number
    monthly_loan_payments: number
    remaining_balance: number
    expense_ratio: number
    debt_to_income_ratio: number
  }
}

export interface DashboardCharts {
  charts: {
    expenseByCategory: Array<{ name: string; value: number }>
    monthlyTrend: Array<{ month: string; expenses: number; income: number; loanPayments: number; net: number }>
    cashflowBreakdown: Array<{ name: string; value: number }>
  }
}

export interface DashboardTimeline {
  timeline: Array<{
    id: string
    type: "loan_payment_due" | "expense_logged"
    date: string
    title: string
    amount: number
    status: "upcoming" | "recorded"
  }>
}

export interface AgentAdviceResponse {
  response: string
  model_used: string
  intent: "budgeting" | "debt" | "savings" | "income" | "general"
  used_tools: Array<
    "financial_summary" | "expense_insights" | "loan_insights" | "savings_planner"
  >
}

type ErrorResponse = {
  error?: string
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorResponse
    if (payload.error) return payload.error
  } catch {
    // Ignore and use fallback.
  }

  return `Request failed with status ${response.status}`
}

async function apiRequest(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api/${path}`, {
    credentials: "include",
    ...init
  })
}

export async function getFinancialProfile(): Promise<FinancialProfile> {
  const response = await apiRequest("profile", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  const payload = (await response.json()) as { profile: FinancialProfile }
  return payload.profile
}

export async function updateFinancialProfile(
  updates: Partial<FinancialProfile>
): Promise<FinancialProfile> {
  const response = await apiRequest("profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updates)
  })
  if (!response.ok) throw new Error(await parseError(response))
  const payload = (await response.json()) as { profile: FinancialProfile }
  return payload.profile
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const response = await apiRequest("financial-summary", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  const payload = (await response.json()) as { summary: FinancialSummary }
  return payload.summary
}

export async function getExpenses(): Promise<{ monthly_income: number; expenses: ExpenseItem[] }> {
  const response = await apiRequest("expenses", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as { monthly_income: number; expenses: ExpenseItem[] }
}

export async function createExpense(input: {
  amount: number
  category: string
  description?: string
  date?: string
}): Promise<ExpenseItem> {
  const response = await apiRequest("expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  })
  if (!response.ok) throw new Error(await parseError(response))
  const payload = (await response.json()) as { expense: ExpenseItem }
  return payload.expense
}

export async function getLoans(): Promise<{ monthly_income: number; loans: LoanItem[] }> {
  const response = await apiRequest("loans", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as { monthly_income: number; loans: LoanItem[] }
}

export async function createLoan(input: {
  loan_name?: string
  loan_amount: number
  interest_rate: number
  monthly_payment: number
  remaining_balance?: number
  next_payment_date?: string
}): Promise<LoanItem> {
  const response = await apiRequest("loans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  })
  if (!response.ok) throw new Error(await parseError(response))
  const payload = (await response.json()) as { loan: LoanItem }
  return payload.loan
}

export async function getDashboardExpenseSummary(): Promise<DashboardExpenseSummary> {
  const response = await apiRequest("dashboard/expense-summary", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as DashboardExpenseSummary
}

export async function getDashboardFinancialScore(): Promise<DashboardFinancialScore> {
  const response = await apiRequest("dashboard/financial-score", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as DashboardFinancialScore
}

export async function getDashboardCharts(): Promise<DashboardCharts> {
  const response = await apiRequest("dashboard/charts", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as DashboardCharts
}

export async function getDashboardTimeline(): Promise<DashboardTimeline> {
  const response = await apiRequest("dashboard/timeline", { method: "GET" })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as DashboardTimeline
}

export async function getAgentAdvice(message: string): Promise<AgentAdviceResponse> {
  const response = await apiRequest("agent/advice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AgentAdviceResponse
}
