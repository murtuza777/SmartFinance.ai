import { Hono } from "hono"
import { cors } from "hono/cors"
import agentRoutes from "./routes/agent"
import authRoutes from "./routes/auth"
import dashboardRoutes from "./routes/dashboard"
import expensesRoutes from "./routes/expenses"
import financialSummaryRoutes from "./routes/financial-summary"
import loansRoutes from "./routes/loans"
import profileRoutes from "./routes/profile"
import type { AppEnv } from "./types"

const app = new Hono<AppEnv>()
const allowedOrigins = new Set([
  "https://burryai-web.mdmurtuzaali777.workers.dev",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
])

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return "https://burryai-web.mdmurtuzaali777.workers.dev"
      }
      return allowedOrigins.has(origin)
        ? origin
        : "https://burryai-web.mdmurtuzaali777.workers.dev"
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400
  })
)

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
app.route("/dashboard", dashboardRoutes)
app.route("/api/dashboard", dashboardRoutes)
app.route("/agent", agentRoutes)
app.route("/api/agent", agentRoutes)

export default app
