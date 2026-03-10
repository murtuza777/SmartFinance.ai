import { buildAgentContext } from "./nodes/build-context"
import { detectIntent } from "./nodes/detect-intent"
import { generateAgentResponse } from "./nodes/generate-response"
import { runSelectedTools } from "./nodes/run-tools"
import { selectToolsByIntent } from "./nodes/select-tools"
import type { AgentState } from "./state"

export async function runFinancialAgent(params: {
  db: D1Database
  userId: string
  userMessage: string
  geminiApiKey?: string
  geminiModel?: string
}): Promise<AgentState> {
  const intent = detectIntent(params.userMessage)
  const context = await buildAgentContext(params.db, params.userId)
  const selectedTools = selectToolsByIntent(intent)
  const toolOutputs = runSelectedTools(selectedTools, context)
  const generation = await generateAgentResponse({
    apiKey: params.geminiApiKey,
    preferredModel: params.geminiModel,
    intent,
    userMessage: params.userMessage,
    context,
    toolOutputs
  })

  return {
    userId: params.userId,
    userMessage: params.userMessage,
    intent,
    context,
    selectedTools,
    toolOutputs,
    response: generation.response,
    modelUsed: generation.modelUsed
  }
}
