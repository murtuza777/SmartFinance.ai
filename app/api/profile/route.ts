import { NextRequest } from "next/server"
import { proxyToWorker } from "@/lib/worker-api-proxy"

const TARGET = "profile"

export async function GET(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}

export async function PUT(request: NextRequest) {
  return proxyToWorker(request, TARGET)
}
