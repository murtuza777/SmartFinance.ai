import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

const TARGET = "financial-summary"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}
