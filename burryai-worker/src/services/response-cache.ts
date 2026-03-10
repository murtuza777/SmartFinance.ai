type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const memoryResponseCache = new Map<string, CacheEntry<unknown>>()

function namespacedKey(key: string): string {
  return `response:${key}`
}

export function readCachedResponse<T>(key: string): T | null {
  const entry = memoryResponseCache.get(namespacedKey(key))
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    memoryResponseCache.delete(namespacedKey(key))
    return null
  }
  return entry.value as T
}

export function writeCachedResponse<T>(key: string, value: T, ttlMs: number): void {
  memoryResponseCache.set(namespacedKey(key), {
    value,
    expiresAt: Date.now() + ttlMs
  })
}
