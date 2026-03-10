import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, "loans")
}

export async function POST(request: NextRequest) {
  return proxyToWorker(request, "loans")
}
