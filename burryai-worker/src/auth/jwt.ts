import { jwtVerify, SignJWT } from "jose"

const JWT_ISSUER = "burryai-worker"
const JWT_AUDIENCE = "burryai-user"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  sub: string
  email: string
}

function getJwtKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS
}

export async function signSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getJwtKey(secret))
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getJwtKey(secret), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE
  })

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Invalid token payload")
  }

  return {
    sub: payload.sub,
    email: payload.email
  }
}
