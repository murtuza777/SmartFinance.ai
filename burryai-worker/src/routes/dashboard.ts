import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"
import {
  getChartsData,
  getExpenseSummary,
  getFinancialScore,
  getTimelineData
} from "../services/dashboard"
import type { AppEnv } from "../types"

const dashboardRoutes = new Hono<AppEnv>()
dashboardRoutes.use("*", requireAuth)

dashboardRoutes.get("/expense-summary", async (c) => {
  try {
    const userId = c.get("userId")
    const data = await getExpenseSummary(c.env.DB, userId)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch expense summary" }, 500)
  }
})

dashboardRoutes.get("/financial-score", async (c) => {
  try {
    const userId = c.get("userId")
    const data = await getFinancialScore(c.env.DB, userId)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch financial score" }, 500)
  }
})

dashboardRoutes.get("/charts", async (c) => {
  try {
    const userId = c.get("userId")
    const data = await getChartsData(c.env.DB, userId)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch dashboard charts" }, 500)
  }
})

dashboardRoutes.get("/timeline", async (c) => {
  try {
    const userId = c.get("userId")
    const data = await getTimelineData(c.env.DB, userId)
    return c.json(data)
  } catch {
    return c.json({ error: "Failed to fetch dashboard timeline" }, 500)
  }
})

export default dashboardRoutes
