import type { AgentIntent, AgentToolName } from "../state"

export function selectToolsByIntent(intent: AgentIntent): AgentToolName[] {
  switch (intent) {
    case "budgeting":
      return ["financial_summary", "expense_insights", "savings_planner"]
    case "debt":
      return ["financial_summary", "loan_insights", "savings_planner"]
    case "savings":
      return ["financial_summary", "savings_planner", "expense_insights"]
    case "income":
      return ["financial_summary", "savings_planner"]
    default:
      return ["financial_summary", "expense_insights", "loan_insights"]
  }
}
