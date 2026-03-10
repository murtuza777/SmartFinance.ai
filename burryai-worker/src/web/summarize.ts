import type { AgentWebResult } from "../agent/state"

export function summarizeWebResults(results: AgentWebResult[]): string {
  if (results.length === 0) {
    return "No live web opportunities were retrieved."
  }

  const bullets = results.map(
    (item, index) =>
      `${index + 1}. ${item.title} - ${item.snippet || "Relevant opportunity listing."} [${item.url}]`
  )
  return bullets.join("\n")
}
