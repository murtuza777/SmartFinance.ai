import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

export async function POST(request: NextRequest) {
  return proxyToWorker(request, "agent/advice")
}
