## SmartFinance.AI – Implementation Plan (Cloudflare + Agentic)

This file describes how to (re)build SmartFinance.AI from **basic → advanced**, using **Cloudflare** services and an **agentic financial AI** that delivers the features promised in `README.md`.

---

## Phase 0 – Foundations & Environment

- **0.1 – Dependencies & tooling**
  - Ensure Node.js 18+ is installed.
  - Install project deps: `npm install`.
  - Confirm `wrangler` is installed and logged in to your Cloudflare account.

- **0.2 – Cloudflare resources**
  - Create:
    - **AI binding**: `AI` (Cloudflare AI).
    - **Vectorize index**: e.g. `smartfinance-vector`.
    - **KV namespace**: e.g. `FINANCIAL_DATA` (for RAG metadata).
    - **(Optional now, required later)**: D1 DB or other storage for user financial data.
  - Wire bindings in `wrangler.toml` (AI, VECTORIZE, FINANCIAL_DATA, DB if used).

- **0.3 – Local env**
  - Configure `.env.local` for:
    - `NEXT_PUBLIC_APP_URL`
    - `NEXT_PUBLIC_GEMINI_API_KEY` (if using Gemini for the main agent).
    - Any API keys for calling the Workers from Next.js.

---

## Phase 1 – Static Knowledge RAG (Scholarships, Grants, Cost of Living)

**Goal:** Implement a solid **RAG layer** using Cloudflare **Vectorize + KV** that powers:
- Scholarships & grants suggestions.
- Cost-of-living and investment context.

Steps:

- **1.1 – Define knowledge datasets**
  - Expand `data/financial-aid.json` (or similar files) to include:
    - Scholarships and grants (ids, amounts, countries, eligibility, deadlines).
    - Investment strategies (risk levels, min amount, student friendly flags).
    - Cost-of-living data per country/city (rent, typical monthly expenses, discounts).

- **1.2 – Populate Vectorize & KV**
  - Use a Worker script like `scripts/populate-vectordb.ts` (already present) to:
    - Build a `searchText` string for each record (name + criteria + country, etc.).
    - Generate embeddings via Cloudflare AI (`@cf/baai/bge-base-en-v1.5`).
    - `upsert` into `VECTORIZE` (`id`, `values`, `metadata`).
    - Store the full JSON object in `FINANCIAL_DATA` KV using the same `id`.
  - Run this script via `wrangler dev`/`wrangler deploy` once to seed the index.

- **1.3 – RAG query endpoint**
  - Implement a dedicated Worker route: `POST /api/rag/search`.
  - Input: `{ query: string, filters?: { country?: string, city?: string, type?: 'scholarship' | 'grant' | 'investment' | 'cost-of-living' } }`.
  - Flow:
    - Generate embedding for `query`.
    - Query `VECTORIZE` with `topK` + optional filters.
    - Fetch full items from `FINANCIAL_DATA` KV by `match.id`.
    - Return `{ matches: Array<{ score, type, data }> }`.

Result: a reusable **RAG service** that the main financial agent can call for context.

---

## Phase 2 – User Financial Data Model (Cloudflare-First)

**Goal:** Persist each student’s real financial situation so the agent can do personalized reasoning.

- **2.1 – Choose storage**
  - Prefer **Cloudflare D1** (SQL) for:
    - `users`, `accounts`, `transactions`, `budgets`, `loans`, `goals`, `agent_runs`, `notifications`.
  - Alternatively, start with KV/DOs but plan to migrate to D1 for analytics queries.

- **2.2 – Design schema (D1 example)**
  - `users(id, external_auth_id, country, university, created_at, updated_at)`
  - `accounts(id, user_id, type, name, institution, balance, currency, created_at)`
  - `transactions(id, user_id, account_id, amount, currency, category, description, timestamp, is_recurring)`
  - `budgets(id, user_id, month, year, category, limit_amount, actual_amount)`
  - `loans(id, user_id, name, principal, interest_rate, term_months, min_payment, next_due_date)`
  - `goals(id, user_id, type, target_amount, target_date, current_amount)`
  - `agent_runs(id, user_id, task_type, status, started_at, finished_at)`
  - `agent_steps(id, run_id, step_index, tool_name, input_json, output_json, created_at)`
  - `notifications(id, user_id, type, title, body, scheduled_for, read_at)`

- **2.3 – CRUD API Workers**
  - Implement REST/RPC endpoints for:
    - `POST /api/users` / `GET /api/me`
    - `GET/POST /api/accounts`
    - `GET/POST /api/transactions`
    - `GET/POST /api/budgets`
    - `GET/POST /api/loans`
    - `GET/POST /api/goals`
  - Use lightweight validation with `zod` for request/response shapes.

Result: a **structured financial graph** of each student’s money that an agent can read and modify.

---

## Phase 3 – Financial Agent (LangGraph TS on Workers)

**Goal:** Build a **tool-using financial agent** that can understand the student’s state and take actions.

- **3.1 – Select LLM strategy**
  - Primary: **Gemini 2.5 Pro** via `@google/generative-ai` (for strong reasoning + tool use).
  - Backup: Cloudflare models (`@cf/meta/llama-2-7b-chat-int8`) for cheaper or offline-style runs.

- **3.2 – Define agent tools**
  - Tools should be plain TS functions callable from the agent:
    - `getUserProfile(userId)`
    - `getCashflowSummary(userId, period)`
    - `getBudgets(userId)` / `updateBudgets(userId, plan)`
    - `getLoans(userId)` / `updateLoanPlan(userId, plan)`
    - `getGoals(userId)` / `updateGoals(userId, goals)`
    - `ragSearchPrograms(query, filters)` → calls Phase 1 RAG endpoint.
    - `analyzeCostOfLiving(userId, targetCountry, targetCity?)`
    - `createNotification(userId, payload)`
    - `logAgentStep(runId, stepData)`

- **3.3 – Agent graph (LangGraph)**
  - Build a small state graph:
    - **Node: GatherContext**
      - Calls tools: `getUserProfile`, `getCashflowSummary`, `getBudgets`, `getLoans`, `getGoals`.
    - **Node: RetrieveExternalKnowledge**
      - Calls `ragSearchPrograms` and `analyzeCostOfLiving` as needed.
    - **Node: Plan**
      - LLM decides which actions to take (e.g., adjust budget, propose loan plan).
    - **Node: Act**
      - Invokes tools like `updateBudgets`, `updateLoanPlan`, `createNotification`.
    - **Node: Summarize**
      - Produces a structured `AgentResult` with:
        - natural language explanation,
        - metrics (risk score, savings potential, DTI),
        - concrete action list.
  - Implement a top-level function `runFinancialAgent({ userId, taskType, input })`.

- **3.4 – Agent API endpoint**
  - Cloudflare Worker route: `POST /api/agent/run`.
  - Request: `{ userId, taskType: 'general_advice' | 'optimize_budget' | 'plan_loans' | 'cost_cutter', payload }`.
  - Response:
    - Initial version: simple JSON (no streaming).
    - Later: streaming tokens over a `ReadableStream` for chat-like UI.

Result: a **reusable agent core** that can serve multiple features (AI Advisor, Cost Cutter, etc.).

---

## Phase 4 – Feature Mapping to README (UI + Agent Integration)

**Goal:** Wire the agent & APIs to deliver each major feature described in `README.md`.

### 4.1 – AI Financial Advisor

- UI:
  - Next.js page/component `AIAdvisor` with:
    - User input box (question or goal).
    - Display for advice, metrics, and recommended actions.
- Backend:
  - Call `POST /api/agent/run` with `taskType: 'general_advice'` and user question.
  - Display:
    - Advice sections: loan management, budget optimization, investments, extra income.
    - Risk metrics: risk score, DTI, savings potential.
  - Allow the user to “Apply plan” (e.g., accept new budget/loan plan) which re-calls `runFinancialAgent` with an `act` flag.

### 4.2 – Financial Timelines

- UI:
  - `Timeline` component showing:
    - Cashflow over time (Chart.js line/area chart).
    - Loan payment schedule and deadlines.
    - Income and recurring expenses.
- Backend:
  - Worker route `GET /api/timeline`:
    - Combines `transactions`, `budgets`, `loans`, and `goals` into time-bucketed data.
    - Optionally calls the agent to forecast projections (e.g., savings over next 6–12 months).

### 4.3 – Cost Cutter

- UI:
  - `CostCutter` component:
    - Category breakdown of expenses.
    - Highlighted “unnecessary” or high-ROI cuts.
    - Button: “Generate cost-cutting plan”.
- Backend:
  - `POST /api/agent/run` with `taskType: 'cost_cutter'`.
  - Agent:
    - Analyzes `transactions` vs `budgets`.
    - Uses RAG to suggest local discounts/aid where relevant.
    - Writes recommended budget limits or notifications back to DB.

### 4.4 – Financial Insights

- UI:
  - `Insights` view with:
    - Cashflow analytics.
    - Expense pattern charts.
    - Savings projections.
    - Risk metrics (DTI, volatility of expenses, etc.).
- Backend:
  - Dedicated analytics endpoints or computed fields from D1 + optional agent calls.
  - Use Chart.js & Framer Motion for smooth, interactive visualizations.

---

## Phase 5 – Automation, Cron Jobs & Advanced Agent Behaviors

**Goal:** Make the agent proactive, not just reactive to user clicks.

- **5.1 – Cron-based health checks**
  - Cloudflare cron triggers:
    - Nightly/weekly: run the agent for active users.
    - Check:
      - upcoming loan due dates,
      - overspending patterns,
      - missed goals,
      - soon-expiring scholarships/grants.
    - Auto-create `notifications` and summaries.

- **5.2 – Multi-step & multi-goal runs**
  - Extend the agent graph to support:
    - Multiple tasks in one run (e.g., budget + loans + goals).
    - User-configurable preferences (risk tolerance, priorities).

- **5.3 – Observability & safety**
  - Log all `agent_runs` and `agent_steps` (already in schema).
  - Add simple guardrails:
    - Budget/loan changes require user confirmation in UI.
    - Agent never performs irreversible destructive actions automatically.

---

## Phase 6 – Polish, UX, and 3D/Visual Enhancements

- **6.1 – UX & design**
  - Smooth onboarding, tooltips explaining metrics.
  - Clear “why” behind any recommendation (show key numbers & RAG sources).

- **6.2 – Three.js / 3D**
  - Use `Three.js` to create:
    - 3D “financial health” visualizations (e.g., orbits for goals, spikes for risk).

- **6.3 – Charting & animation**
  - Use `Chart.js` + Framer Motion to animate:
    - Budget adjustments before/after agent suggestions.
    - Loan payoff timelines and projections.

---

## Where to Start (Short Checklist)

1. **Confirm Cloudflare resources**: AI, Vectorize, KV, and D1 (or chosen DB) are created and bound.
2. **Finish Phase 1**: seed Vectorize + KV and expose `/api/rag/search`.
3. **Implement Phase 2 schema & CRUD** for user financial data in D1.
4. **Build the Phase 3 financial agent** (`runFinancialAgent` + tools + `/api/agent/run`).
5. **Wire UI features (Phase 4)**: AI Advisor, Timelines, Cost Cutter, Insights.
6. **Add cron automation & polish (Phases 5–6)** when core flows are stable.

This roadmap keeps everything **Cloudflare-first**, while giving you a clear path from a basic RAG setup to a full **agentic financial assistant** that matches your original README vision.

