import { createDeterministicEmbedding, splitIntoChunks } from "./embedding"
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

export async function seedKnowledgeIndexIfAvailable(index?: Vectorize): Promise<void> {
  if (!index || hasAttemptedVectorUpsert) {
    return
  }

  hasAttemptedVectorUpsert = true

  const chunks = getKnowledgeChunks()
  const vectors = chunks.map((chunk) => ({
    id: chunk.id,
    values: createDeterministicEmbedding(chunk.content),
    metadata: {
      title: chunk.title,
      source: chunk.source,
      content: chunk.content
    }
  }))

  try {
    await index.upsert(vectors)
  } catch {
    // Keep request flow resilient even when Vectorize is unavailable or mismatched.
  }
}
