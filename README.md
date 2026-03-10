## BurryAI

**AI Financial Advisor for Students**

BurryAI is an **AI-powered financial assistant designed for students**.
It analyzes a user's financial profile, expenses, and goals to provide **personalized financial insights, budgeting strategies, and extra earning recommendations**.

The platform combines **agentic AI, financial analytics, and real-time web retrieval** to help students make smarter financial decisions.

Inspired by analytical investors like Michael Burry from The Big Short, BurryAI acts as a **personal financial analyst for everyday users**.

---

# Core Features

## 1. AI Financial Advisor

The central **Financial Agent** analyzes user financial data and provides recommendations.

Capabilities:

* Personalized financial health analysis
* Smart spending recommendations
* Loan repayment optimization
* Extra earning suggestions (web-powered)
* AI-powered expense optimization
* Budget improvement suggestions

The agent combines:

* User financial data
* Financial knowledge base (RAG)
* Live web search

---

# 2. Expense Tracking

Users can track spending across categories:

* Food
* Rent / Hostel
* Transport
* Education
* Subscriptions
* Miscellaneous

This data powers the financial insights and AI recommendations.

---

# 3. Financial Timeline

Shows upcoming financial events:

* Loan payment deadlines
* Monthly income tracking
* Expense monitoring

This helps users visualize their financial flow.

---

# 4. Financial Insights Dashboard

Interactive visualizations provide insights into the user’s financial behavior.

Visualizations include:

* Spending categories (pie chart)
* Monthly cash flow (income vs expenses)
* Savings progress toward financial goals

---

# 5. AI Cost Cutter

The AI agent analyzes spending patterns and identifies unnecessary expenses.

Example insights:

* Over-spending categories
* Subscription waste
* Budget adjustments

---

# 6. Extra Income Recommendations

The agent uses **web-augmented retrieval** to suggest the latest earning opportunities such as:

* freelancing
* tutoring
* remote gigs
* digital work
* student-friendly side hustles

---

# Architecture Overview

```
User
 ↓
Next.js Frontend
 ↓
Cloudflare Workers API
 ↓
Financial Agent
 ↓
Tools Layer
 ├ Expense Analyzer
 ├ Financial Health Calculator
 ├ Cost Cutter
 ├ Loan Optimizer
 └ Web Search Retriever
 ↓
Cloudflare D1 Database
```

---

# Tech Stack

## Frontend

* Next.js 14
* TypeScript
* TailwindCSS
* ShadCN UI
* Recharts (analytics visualizations)

---

## Backend

* Cloudflare Workers
* Hono (API framework)

---

## Database

* Cloudflare D1 (SQL database)

Stores:

* users
* financial profiles
* expenses
* loans
* AI interaction logs

---

## AI Layer

Large Language Model:

* Google Gemini 2.5 Pro

Responsibilities:

* financial reasoning
* financial insights
* cost optimization
* user recommendations

---

## Agent System

Custom **Tool-based Financial Agent**

Agent tools:

* financial profile retrieval
* expense analysis
* financial health scoring
* cost cutter analysis
* loan optimization
* web search for extra earning opportunities

---

## Retrieval System

Hybrid RAG architecture:

Internal Knowledge

* budgeting strategies
* debt management
* financial literacy

External Knowledge

* web search for latest opportunities

---

# Database Schema Overview

### users

```
id
email
name
created_at
```

---

### financial_profiles

```
id
user_id
country
student_status
university
monthly_income
financial_goal
created_at
```

---

### expenses

```
id
user_id
category
amount
date
```

---

### loans

```
id
user_id
loan_amount
interest_rate
monthly_payment
next_payment_date
```

---

### ai_logs

```
id
user_id
query
response
created_at
```

---

# User Flow

```
Landing Page
 ↓
Sign In / Sign Up
 ↓
Onboarding
 ↓
Financial Profile Setup
 ↓
Dashboard
 ↓
Expense Tracking
 ↓
AI Financial Advisor
 ↓
Financial Insights
```

---

# Deployment

Frontend

* Cloudflare pages

Backend

* Cloudflare Workers

Database

* Cloudflare D1

AI

* Gemini API

---

# CI/CD Auto Deployment

Pushes to `main` now trigger GitHub Actions deployment via `.github/workflows/deploy-cloudflare.yml`.

Required GitHub repository secrets:

* `CLOUDFLARE_API_TOKEN`
* `CLOUDFLARE_ACCOUNT_ID`
* `JWT_SECRET`
* `GEMINI_API_KEY` (optional but recommended)
* `TAVILY_API_KEY` or `SERPER_API_KEY` (for phase 9 web retrieval)

Recommended repository variables:

* `WORKER_API_BASE_URL`
* `NEXT_PUBLIC_WORKER_API_BASE_URL`
* `NEXT_PUBLIC_API_BASE_URL`

---

# Production RAG Setup (Workers AI + Vectorize)

This project supports production embeddings through Workers AI with deterministic fallback when unavailable.

1. Create Vectorize index (dimension must match embedding model output):
   * `npx wrangler vectorize create financial-data --dimensions=768 --metric=cosine`
2. Confirm index details:
   * `npx wrangler vectorize info financial-data`
3. Set worker vars:
   * `ENABLE_VECTORIZE_RAG=true`
   * `EMBEDDING_MODEL=@cf/baai/bge-base-en-v1.5`
4. Deploy worker so knowledge chunks are embedded and upserted on retrieval path.

---

# Future Enhancements

* automated financial insights
* smart alerts for overspending
* savings optimization
* AI financial planning