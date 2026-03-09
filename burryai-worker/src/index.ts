import { Hono } from "hono"
import authRoutes from "./routes/auth"
import expensesRoutes from "./routes/expenses"
import financialSummaryRoutes from "./routes/financial-summary"
import loansRoutes from "./routes/loans"
import profileRoutes from "./routes/profile"
import type { AppEnv } from "./types"

const app = new Hono<AppEnv>()

app.get("/health", (c) => {
  return c.json({
    ok: true,
    service: "BurryAI API",
    status: "running"
  })
})

app.route("/auth", authRoutes)
app.route("/api/auth", authRoutes)
app.route("/expenses", expensesRoutes)
app.route("/api/expenses", expensesRoutes)
app.route("/loans", loansRoutes)
app.route("/api/loans", loansRoutes)
app.route("/profile", profileRoutes)
app.route("/api/profile", profileRoutes)
app.route("/user/profile", profileRoutes)
app.route("/api/user/profile", profileRoutes)
app.route("/financial-summary", financialSummaryRoutes)
app.route("/api/financial-summary", financialSummaryRoutes)

export default app
