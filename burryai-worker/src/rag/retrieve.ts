import type { AgentKnowledgeChunk } from "../agent/state"
import { createDeterministicEmbedding, createEmbedding } from "./embedding"
import { getKnowledgeChunks, seedKnowledgeIndexIfAvailable } from "./ingest"

type RetrieveParams = {
  query: string
  index?: Vectorize
  ai?: {
    run: (model: string, input: unknown) => Promise<unknown>
  }
  embeddingModel?: string
  topK?: number
}

function normalizeQueryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
}

function lexicalFallbackRetrieve(query: string, topK: number): AgentKnowledgeChunk[] {
  const tokens = normalizeQueryTokens(query)
  if (tokens.length === 0) return []

  const scored = getKnowledgeChunks()
    .map((chunk) => {
      const contentLower = chunk.content.toLowerCase()
      const score = tokens.reduce((acc, token) => acc + (contentLower.includes(token) ? 1 : 0), 0)
      return {
        ...chunk,
        score
      }
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  return scored.map((chunk, index) => ({
    id: chunk.id,
    title: chunk.title,
    source: chunk.source,
    content: chunk.content,
    score: Number((1 - index * 0.1).toFixed(3))
  }))
}

function parseMetadataValue(value: unknown): string {
  return typeof value === "string" ? value : ""
}

async function vectorizeRetrieve(
  query: string,
  index: Vectorize,
  topK: number,
  options?: {
    ai?: {
      run: (model: string, input: unknown) => Promise<unknown>
    }
    embeddingModel?: string
  }
): Promise<AgentKnowledgeChunk[]> {
  await seedKnowledgeIndexIfAvailable({
    index,
    ai: options?.ai,
    embeddingModel: options?.embeddingModel
  })

  const queryVector = await createEmbedding(query, {
    ai: options?.ai,
    model: options?.embeddingModel,
    fallbackDimension: createDeterministicEmbedding(query).length
  })
  const matches = await index.query(queryVector, { topK, returnMetadata: "all" })

  return (matches.matches ?? [])
    .map((match) => {
      const metadata = (match.metadata ?? {}) as Record<string, unknown>
      const title = parseMetadataValue(metadata.title)
      const source = parseMetadataValue(metadata.source)
      const content = parseMetadataValue(metadata.content)

      if (!title || !source || !content) {
        return null
      }

      return {
        id: match.id,
        title,
        source,
        content,
        score: Number(match.score.toFixed(4))
      }
    })
    .filter((chunk): chunk is AgentKnowledgeChunk => chunk !== null)
}

export async function retrieveKnowledgeContext(params: RetrieveParams): Promise<AgentKnowledgeChunk[]> {
  const topK = Math.max(1, Math.min(params.topK ?? 3, 5))

  if (params.index) {
    try {
      const chunks = await vectorizeRetrieve(params.query, params.index, topK, {
        ai: params.ai,
        embeddingModel: params.embeddingModel
      })
      if (chunks.length > 0) {
        return chunks
      }
    } catch {
      // Fall through to lexical retrieval.
    }
  }

  return lexicalFallbackRetrieve(params.query, topK)
}
