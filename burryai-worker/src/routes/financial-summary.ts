import { Hono } from "hono"
import { requireAuth } from "../middleware/auth"
import { buildFinancialSummary } from "../services/analytics"
import type { AppEnv } from "../types"

const financialSummaryRoutes = new Hono<AppEnv>()
financialSummaryRoutes.use("*", requireAuth)

financialSummaryRoutes.get("/", async (c) => {
  try {
    const userId = c.get("userId")
    const summary = await buildFinancialSummary(c.env.DB, userId)
    return c.json({ summary })
  } catch {
    return c.json({ error: "Failed to fetch financial summary" }, 500)
  }
})

export default financialSummaryRoutes
