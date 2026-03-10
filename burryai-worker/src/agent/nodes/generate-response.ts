import type { AgentContextData, AgentIntent, AgentToolOutput } from "../state"

function formatContext(context: AgentContextData): string {
  const topCategories =
    context.topExpenseCategories.length > 0
      ? context.topExpenseCategories
          .map((item) => `${item.category}: $${item.amount.toLocaleString()}`)
          .join(", ")
      : "No categories yet"

  return [
    `Monthly income: $${context.monthlyIncome.toLocaleString()}`,
    `Monthly expenses: $${context.monthlyExpenses.toLocaleString()}`,
    `Monthly loan payments: $${context.monthlyLoanPayments.toLocaleString()}`,
    `Remaining monthly balance: $${context.remainingBalance.toLocaleString()}`,
    `Expense ratio: ${context.expenseRatio.toFixed(1)}%`,
    `Debt-to-income ratio: ${context.debtToIncomeRatio.toFixed(1)}%`,
    `Financial health score: ${context.financialHealthScore}/100`,
    `Top categories: ${topCategories}`
  ].join("\n")
}

function buildFallbackResponse(intent: AgentIntent, toolOutputs: AgentToolOutput[]): string {
  const intro = `Intent detected: ${intent}.`
  const insights = toolOutputs.map((tool) => `- ${tool.content}`).join("\n")
  const closing =
    "Action plan: prioritize high-impact cuts first, protect minimum loan payments, and track progress weekly."

  return [intro, "", "Insights:", insights, "", closing].join("\n")
}

type GeminiGenerationResult = {
  text: string
  modelUsed: string
}

type GeminiPart = {
  text?: string
}

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[]
  }
}

type GeminiResponsePayload = {
  candidates?: GeminiCandidate[]
}

function extractGeminiText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null

  const candidates = (payload as GeminiResponsePayload).candidates
  const firstText = candidates?.[0]?.content?.parts?.[0]?.text
  return typeof firstText === "string" && firstText.trim().length > 0 ? firstText.trim() : null
}

async function generateWithGemini(
  apiKey: string,
  preferredModel: string | undefined,
  prompt: string
): Promise<GeminiGenerationResult | null> {
  const modelCandidates = [preferredModel, "gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-flash"]
    .filter((model): model is string => typeof model === "string" && model.length > 0)

  for (const model of modelCandidates) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    )

    if (!response.ok) {
      continue
    }

    const payload = (await response.json()) as unknown
    const text = extractGeminiText(payload)
    if (text) {
      return {
        text,
        modelUsed: `gemini:${model}`
      }
    }
  }

  return null
}

export async function generateAgentResponse(params: {
  apiKey?: string
  preferredModel?: string
  intent: AgentIntent
  userMessage: string
  context: AgentContextData
  toolOutputs: AgentToolOutput[]
}): Promise<{ response: string; modelUsed: string }> {
  const prompt = [
    "You are BurryAI, a financial advisor for students.",
    "Use the provided structured context and tool outputs to produce concise, actionable advice.",
    "Do not mention hidden reasoning or internal system details.",
    "",
    `User question: ${params.userMessage}`,
    `Detected intent: ${params.intent}`,
    "",
    "Context:",
    formatContext(params.context),
    "",
    "Tool outputs:",
    ...params.toolOutputs.map((tool) => `- ${tool.name}: ${tool.content}`),
    "",
    "Return clear recommendations in plain text with short action steps."
  ].join("\n")

  if (params.apiKey) {
    try {
      const geminiResult = await generateWithGemini(params.apiKey, params.preferredModel, prompt)
      if (geminiResult) {
        return {
          response: geminiResult.text,
          modelUsed: geminiResult.modelUsed
        }
      }
    } catch {
      // Fallback response path below.
    }
  }

  return {
    response: buildFallbackResponse(params.intent, params.toolOutputs),
    modelUsed: "fallback:rule-based"
  }
}
