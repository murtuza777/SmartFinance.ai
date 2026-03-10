export type KnowledgeDocument = {
  id: string
  title: string
  source: string
  content: string
}

export const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "kb-budget-50-30-20",
    title: "Student Budget Framework",
    source: "burryai://knowledge/student-budgeting",
    content:
      "Start with a simple monthly budget framework: 50% needs, 30% wants, 20% savings or debt reduction. If income is unstable, prioritize fixed essentials and minimum loan payments first."
  },
  {
    id: "kb-emergency-fund",
    title: "Emergency Fund Basics",
    source: "burryai://knowledge/emergency-fund",
    content:
      "Build a starter emergency fund of at least one month of essential expenses, then grow it to three months. Keep this fund in a liquid low-risk account."
  },
  {
    id: "kb-debt-avalanche-snowball",
    title: "Debt Repayment Strategies",
    source: "burryai://knowledge/debt-strategies",
    content:
      "Debt avalanche pays extra toward the highest interest loan while maintaining minimums on others. Debt snowball pays extra toward the smallest balance to build momentum and consistency."
  },
  {
    id: "kb-subscription-audit",
    title: "Subscription Audit",
    source: "burryai://knowledge/cost-cutter",
    content:
      "Audit recurring subscriptions every month. Cancel low-value services and redirect that amount to savings or debt payoff automatically on payday."
  },
  {
    id: "kb-side-income",
    title: "Student Side Income Principles",
    source: "burryai://knowledge/extra-income",
    content:
      "Choose side income options with low startup cost and predictable hours. Track net income after transport, equipment, and platform fees before committing to a channel."
  }
]
