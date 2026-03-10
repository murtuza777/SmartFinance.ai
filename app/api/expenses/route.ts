import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

const TARGET = "expenses"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}

export async function POST(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}
