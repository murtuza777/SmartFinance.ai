export type AgentIntent = "budgeting" | "debt" | "savings" | "income" | "general"

export type AgentToolName =
  | "financial_summary"
  | "expense_insights"
  | "loan_insights"
  | "savings_planner"

export type AgentContextData = {
  monthlyIncome: number
  monthlyExpenses: number
  monthlyLoanPayments: number
  remainingBalance: number
  expenseRatio: number
  debtToIncomeRatio: number
  financialHealthScore: number
  topExpenseCategories: Array<{
    category: string
    amount: number
  }>
  totalLoanBalance: number
}

export type AgentToolOutput = {
  name: AgentToolName
  content: string
}

export type AgentState = {
  userId: string
  userMessage: string
  intent: AgentIntent
  context: AgentContextData
  selectedTools: AgentToolName[]
  toolOutputs: AgentToolOutput[]
  response: string
  modelUsed: string
}
