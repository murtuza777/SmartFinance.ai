import { Hono } from "hono"
import { z } from "zod"
import { runFinancialAgent } from "../agent/graph"
import { requireAuth } from "../middleware/auth"
import type { AppEnv } from "../types"

const adviceSchema = z
  .object({
    message: z.string().trim().min(1).max(4000)
  })
  .strict()

async function readAdviceBody(req: Request): Promise<
  | {
      ok: true
      value: z.infer<typeof adviceSchema>
    }
  | {
      ok: false
      error: string
    }
> {
  let payload: unknown

  try {
    payload = await req.json()
  } catch {
    return { ok: false, error: "Invalid JSON body" }
  }

  const parsed = adviceSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request body" }
  }

  return { ok: true, value: parsed.data }
}

const agentRoutes = new Hono<AppEnv>()
agentRoutes.use("*", requireAuth)

agentRoutes.post("/advice", async (c) => {
  const body = await readAdviceBody(c.req.raw)
  if (!body.ok) {
    return c.json({ error: body.error }, 400)
  }

  try {
    const userId = c.get("userId")
    const useVectorize = c.env.ENABLE_VECTORIZE_RAG === "true"
    const result = await runFinancialAgent({
      db: c.env.DB,
      userId,
      userMessage: body.value.message,
      geminiApiKey: c.env.GEMINI_API_KEY,
      geminiModel: c.env.GEMINI_MODEL,
      knowledgeIndex: useVectorize ? c.env.FINANCE_KB_INDEX : undefined,
      aiBinding: c.env.AI,
      embeddingModel: c.env.EMBEDDING_MODEL,
      webSearchProvider: c.env.WEB_SEARCH_PROVIDER,
      tavilyApiKey: c.env.TAVILY_API_KEY,
      serperApiKey: c.env.SERPER_API_KEY
    })

    await c.env.DB.prepare(
      "INSERT INTO ai_logs (id, user_id, query, response, model_used) VALUES (?1, ?2, ?3, ?4, ?5)"
    )
      .bind(crypto.randomUUID(), userId, body.value.message, result.response, result.modelUsed)
      .run()

    return c.json({
      response: result.response,
      model_used: result.modelUsed,
      intent: result.intent,
      used_tools: result.selectedTools,
      knowledge_sources: result.knowledgeChunks.map((chunk) => ({
        title: chunk.title,
        source: chunk.source
      })),
      web_sources: result.webResults.map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source
      }))
    })
  } catch {
    return c.json({ error: "Failed to generate financial advice" }, 500)
  }
})

export default agentRoutes
