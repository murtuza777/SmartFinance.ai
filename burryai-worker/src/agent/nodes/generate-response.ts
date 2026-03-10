import type {
  AgentContextData,
  AgentIntent,
  AgentKnowledgeChunk,
  AgentToolOutput,
  AgentWebResult
} from "../state"
import { summarizeWebResults } from "../../web/summarize"

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

function formatKnowledge(chunks: AgentKnowledgeChunk[]): string {
  if (chunks.length === 0) {
    return "No internal knowledge retrieved."
  }

  return chunks.map((chunk) => `- ${chunk.title}: ${chunk.content} (source: ${chunk.source})`).join("\n")
}

function buildFallbackResponse(
  intent: AgentIntent,
  toolOutputs: AgentToolOutput[],
  knowledgeChunks: AgentKnowledgeChunk[],
  webResults: AgentWebResult[]
): string {
  const intro = `Intent detected: ${intent}.`
  const insights = toolOutputs.map((tool) => `- ${tool.summary}`).join("\n")
  const groundedKnowledge = formatKnowledge(knowledgeChunks)
  const webSummary = summarizeWebResults(webResults)
  const closing =
    "Action plan: prioritize high-impact cuts first, protect minimum loan payments, and track progress weekly."

  return [
    intro,
    "",
    "Insights:",
    insights,
    "",
    "Knowledge context:",
    groundedKnowledge,
    "",
    "Web findings:",
    webSummary,
    "",
    closing
  ].join("\n")
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
  knowledgeChunks: AgentKnowledgeChunk[]
  webResults: AgentWebResult[]
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
    ...params.toolOutputs.map((tool) => `- ${tool.name}: ${tool.summary}`),
    "",
    "Knowledge snippets:",
    ...params.knowledgeChunks.map(
      (chunk) => `- ${chunk.title}: ${chunk.content} (source: ${chunk.source}, score: ${chunk.score})`
    ),
    "",
    "Web retrieval results:",
    ...params.webResults.map((result) => `- ${result.title} | ${result.url} | ${result.snippet}`),
    "",
    "Return clear recommendations in plain text with short action steps, and cite knowledge/web sources inline when used."
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
    response: buildFallbackResponse(
      params.intent,
      params.toolOutputs,
      params.knowledgeChunks,
      params.webResults
    ),
    modelUsed: "fallback:rule-based"
  }
}
