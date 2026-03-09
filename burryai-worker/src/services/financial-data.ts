export type ExpenseRow = {
  id: string
  user_id: string
  amount: number
  category: string
  description: string | null
  date: string
  created_at: string
  updated_at: string
}

export type LoanRow = {
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

type CreateExpenseInput = {
  amount: number
  category: string
  description: string | null
  date: string
}

type CreateLoanInput = {
  loan_name: string
  principal_amount: number
  interest_rate: number
  minimum_payment: number
  remaining_balance: number
  due_date: string | null
}

export async function createExpense(
  db: D1Database,
  userId: string,
  input: CreateExpenseInput
): Promise<ExpenseRow | null> {
  const expenseId = crypto.randomUUID()

  await db
    .prepare(
      "INSERT INTO expenses (id, user_id, amount, category, description, date) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(expenseId, userId, input.amount, input.category, input.description, input.date)
    .run()

  return await db
    .prepare(
      "SELECT id, user_id, amount, category, description, date, created_at, updated_at FROM expenses WHERE id = ?1 AND user_id = ?2 LIMIT 1"
    )
    .bind(expenseId, userId)
    .first<ExpenseRow>()
}

export async function listExpenses(db: D1Database, userId: string): Promise<ExpenseRow[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, amount, category, description, date, created_at, updated_at FROM expenses WHERE user_id = ?1 ORDER BY date DESC, created_at DESC"
    )
    .bind(userId)
    .all<ExpenseRow>()

  return result.results ?? []
}

export async function createLoan(
  db: D1Database,
  userId: string,
  input: CreateLoanInput
): Promise<LoanRow | null> {
  const loanId = crypto.randomUUID()

  await db
    .prepare(
      "INSERT INTO loans (id, user_id, loan_name, principal_amount, interest_rate, minimum_payment, remaining_balance, due_date) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    )
    .bind(
      loanId,
      userId,
      input.loan_name,
      input.principal_amount,
      input.interest_rate,
      input.minimum_payment,
      input.remaining_balance,
      input.due_date
    )
    .run()

  return await db
    .prepare(
      "SELECT id, user_id, loan_name, principal_amount, interest_rate, minimum_payment, remaining_balance, due_date, created_at, updated_at FROM loans WHERE id = ?1 AND user_id = ?2 LIMIT 1"
    )
    .bind(loanId, userId)
    .first<LoanRow>()
}

export async function listLoans(db: D1Database, userId: string): Promise<LoanRow[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, loan_name, principal_amount, interest_rate, minimum_payment, remaining_balance, due_date, created_at, updated_at FROM loans WHERE user_id = ?1 ORDER BY created_at DESC"
    )
    .bind(userId)
    .all<LoanRow>()

  return result.results ?? []
}

export async function getMonthlyIncome(db: D1Database, userId: string): Promise<number> {
  const profile = await db
    .prepare("SELECT monthly_income FROM financial_profiles WHERE user_id = ?1 LIMIT 1")
    .bind(userId)
    .first<{ monthly_income: number }>()

  return profile?.monthly_income ?? 0
}
