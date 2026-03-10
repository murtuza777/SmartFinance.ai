import { NextRequest, NextResponse } from "next/server"

const WORKER_API_BASE_URL =
  process.env.WORKER_API_BASE_URL || "https://burryai-worker.mdmurtuzaali777.workers.dev"

export async function proxyToWorker(
  request: NextRequest,
  targetPath: string
): Promise<NextResponse> {
  const normalizedBase = WORKER_API_BASE_URL.replace(/\/+$/, "")
  const targetUrl = new URL(`${normalizedBase}/${targetPath.replace(/^\/+/, "")}`)
  // In Cloudflare runtime, request.url can be relative for route handlers.
  // nextUrl is always normalized by Next.js and safe to read.
  targetUrl.search = request.nextUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer()

  const upstream = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body,
    redirect: "manual"
  })

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: new Headers(upstream.headers)
  })
}
