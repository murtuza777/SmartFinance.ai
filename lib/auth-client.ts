const API_BASE = (() => {
  const directApiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_WORKER_API_BASE_URL
  const useDirectWorkerApi = process.env.NEXT_PUBLIC_USE_DIRECT_WORKER_API === "true"
  const base = useDirectWorkerApi && directApiBase ? directApiBase : "/api"
  return base.replace(/\/+$/, "")
})()

export interface AppUser {
  id: string
  email: string
  created_at: string
  updated_at: string
}

type AuthResponse = {
  user: AppUser
}

type ErrorResponse = {
  error?: string
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorResponse
    if (payload.error) return payload.error
  } catch {
    // Ignore and use fallback below.
  }

  return `Request failed with status ${response.status}`
}

async function authPost(path: string, payload?: Record<string, unknown>): Promise<Response> {
  return fetch(`${API_BASE}/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload ? JSON.stringify(payload) : undefined
  })
}

export async function signup(email: string, password: string): Promise<AppUser> {
  const response = await authPost("signup", { email, password })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const payload = (await response.json()) as AuthResponse
  return payload.user
}

export async function login(email: string, password: string): Promise<AppUser> {
  const response = await authPost("login", { email, password })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const payload = (await response.json()) as AuthResponse
  return payload.user
}

export async function logout(): Promise<void> {
  const response = await authPost("logout")
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}

export async function me(): Promise<AppUser | null> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include"
  })

  if (response.status === 401 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const payload = (await response.json()) as AuthResponse
  return payload.user
}
