const DEFAULT_EMBEDDING_DIMENSION = 128

type EmbeddingModelResponse = {
  data?: number[][]
}

type WorkersAIBinding = {
  run: (model: string, input: unknown) => Promise<unknown>
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
}

function hashToken(token: string): number {
  let hash = 2166136261
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0)
}

export function createDeterministicEmbedding(
  text: string,
  dimension: number = DEFAULT_EMBEDDING_DIMENSION
): number[] {
  const tokens = tokenize(text)
  if (tokens.length === 0) {
    return new Array(dimension).fill(0)
  }

  const vector = new Array(dimension).fill(0)
  for (const token of tokens) {
    const hash = hashToken(token)
    const index = hash % dimension
    vector[index] += 1
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (norm === 0) {
    return vector
  }

  return vector.map((value) => Number((value / norm).toFixed(8)))
}

function parseWorkersAIEmbedding(payload: unknown): number[] | null {
  if (!payload || typeof payload !== "object") return null
  const first = (payload as EmbeddingModelResponse).data?.[0]
  if (!Array.isArray(first) || first.length === 0) return null
  return first.filter((value): value is number => typeof value === "number")
}

export async function createEmbedding(
  text: string,
  options?: {
    ai?: WorkersAIBinding
    model?: string
    fallbackDimension?: number
  }
): Promise<number[]> {
  if (options?.ai) {
    try {
      const payload = await options.ai.run(options.model ?? "@cf/baai/bge-base-en-v1.5", {
        text: [text]
      })
      const embedding = parseWorkersAIEmbedding(payload)
      if (embedding && embedding.length > 0) {
        return embedding
      }
    } catch {
      // Fall back to deterministic embedding.
    }
  }

  return createDeterministicEmbedding(text, options?.fallbackDimension ?? DEFAULT_EMBEDDING_DIMENSION)
}

export function splitIntoChunks(text: string, maxWordsPerChunk: number = 70): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunks: string[] = []
  for (let i = 0; i < words.length; i += maxWordsPerChunk) {
    chunks.push(words.slice(i, i + maxWordsPerChunk).join(" "))
  }
  return chunks
}
