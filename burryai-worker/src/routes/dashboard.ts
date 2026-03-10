import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"
import { readCachedResponse, writeCachedResponse } from "../services/response-cache"
import {
  getChartsData,
  getExpenseSummary,
  getFinancialScore,
  getTimelineData
} from "../services/dashboard"
import type { AppEnv } from "../types"

const dashboardRoutes = new Hono<AppEnv>()
dashboardRoutes.use("*", requireAuth)
const DASHBOARD_CACHE_TTL_MS = 1000 * 30

dashboardRoutes.get("/expense-summary", async (c) => {
  try {
    const userId = c.get("userId")
    const cacheKey = `dashboard:${userId}:expense-summary`
    const cached = readCachedResponse<Awaited<ReturnType<typeof getExpenseSummary>>>(cacheKey)
    if (cached) return c.json(cached)
    const data = await getExpenseSummary(c.env.DB, userId)
    writeCachedResponse(cacheKey, data, DASHBOARD_CACHE_TTL_MS)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch expense summary" }, 500)
  }
})

dashboardRoutes.get("/financial-score", async (c) => {
  try {
    const userId = c.get("userId")
    const cacheKey = `dashboard:${userId}:financial-score`
    const cached = readCachedResponse<Awaited<ReturnType<typeof getFinancialScore>>>(cacheKey)
    if (cached) return c.json(cached)
    const data = await getFinancialScore(c.env.DB, userId)
    writeCachedResponse(cacheKey, data, DASHBOARD_CACHE_TTL_MS)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch financial score" }, 500)
  }
})

dashboardRoutes.get("/charts", async (c) => {
  try {
    const userId = c.get("userId")
    const cacheKey = `dashboard:${userId}:charts`
    const cached = readCachedResponse<Awaited<ReturnType<typeof getChartsData>>>(cacheKey)
    if (cached) return c.json(cached)
    const data = await getChartsData(c.env.DB, userId)
    writeCachedResponse(cacheKey, data, DASHBOARD_CACHE_TTL_MS)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch dashboard charts" }, 500)
  }
})

dashboardRoutes.get("/timeline", async (c) => {
  try {
    const userId = c.get("userId")
    const cacheKey = `dashboard:${userId}:timeline`
    const cached = readCachedResponse<Awaited<ReturnType<typeof getTimelineData>>>(cacheKey)
    if (cached) return c.json(cached)
    const data = await getTimelineData(c.env.DB, userId)
    writeCachedResponse(cacheKey, data, DASHBOARD_CACHE_TTL_MS)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch dashboard timeline" }, 500)
  }
})

export default dashboardRoutes
