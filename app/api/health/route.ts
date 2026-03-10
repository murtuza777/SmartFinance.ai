import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

const TARGET = "health"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}
