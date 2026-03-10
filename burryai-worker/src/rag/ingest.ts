import { createEmbedding, splitIntoChunks } from "./embedding"
import { KNOWLEDGE_DOCUMENTS } from "./knowledge-base"

type KnowledgeChunk = {
  id: string
  title: string
  source: string
  content: string
}

let hasAttemptedVectorUpsert = false

export function getKnowledgeChunks(): KnowledgeChunk[] {
  return KNOWLEDGE_DOCUMENTS.flatMap((doc) => {
    const chunks = splitIntoChunks(doc.content)
    return chunks.map((chunk, index) => ({
      id: `${doc.id}-chunk-${index + 1}`,
      title: doc.title,
      source: doc.source,
      content: chunk
    }))
  })
}

export async function seedKnowledgeIndexIfAvailable(params: {
  index?: Vectorize
  ai?: {
    run: (model: string, input: unknown) => Promise<unknown>
  }
  embeddingModel?: string
}): Promise<void> {
  const index = params.index
  if (!index || hasAttemptedVectorUpsert) {
    return
  }

  hasAttemptedVectorUpsert = true

  const chunks = getKnowledgeChunks()
  const vectors = await Promise.all(
    chunks.map(async (chunk) => ({
      id: chunk.id,
      values: await createEmbedding(chunk.content, {
        ai: params.ai,
        model: params.embeddingModel
      }),
      metadata: {
        title: chunk.title,
        source: chunk.source,
        content: chunk.content
      }
    }))
  )

  try {
    await index.upsert(vectors)
  } catch {
    // Keep request flow resilient even when Vectorize is unavailable or mismatched.
  }
}
