'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut, TrendingUp, Wallet, CreditCard, PieChart, UserRound } from 'lucide-react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js'
import { HolographicButton, HolographicCard } from '@/components/dashboard/HolographicUI'
import { AIAdvisor } from '@/components/dashboard/features/AIAdvisor/AIAdvisor'
import { CostCutter } from '@/components/dashboard/features/CostCutter/CostCutter'
import { FinancialTimeline } from '@/components/dashboard/features/Timeline/FinancialTimeline'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getExpenses,
  getFinancialProfile,
  getFinancialSummary,
  getLoans,
  updateFinancialProfile,
  type ExpenseItem,
  type FinancialProfile,
  type FinancialSummary,
  type LoanItem,
  type RiskTolerance
} from '@/lib/financial-client'

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type ProfileForm = {
  full_name: string
  country: string
  student_status: string
  university: string
  monthly_income: number
  savings_goal: number
  risk_tolerance: RiskTolerance
}

const DEFAULT_SUMMARY: FinancialSummary = {
  total_income: 0,
  total_expenses: 0,
  monthly_loan_payments: 0,
  remaining_balance: 0,
  expense_ratio: 0,
  debt_to_income_ratio: 0,
  total_loan_balance: 0,
  loans_count: 0,
  expenses_count: 0,
  financial_health_score: 0
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, guestUser, isGuest, loading: authLoading, logout } = useAuth()

  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'cost' | 'timeline' | 'profile'>(
    'overview'
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<FinancialSummary>(DEFAULT_SUMMARY)
  const [profile, setProfile] = useState<FinancialProfile | null>(null)
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [loans, setLoans] = useState<LoanItem[]>([])
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    full_name: '',
    country: '',
    student_status: '',
    university: '',
    monthly_income: 0,
    savings_goal: 0,
    risk_tolerance: 'moderate'
  })

  const loadData = useCallback(async () => {
    if (!user) return

    setError('')
    setLoading(true)
    try {
      const [profileData, summaryData, expenseData, loanData] = await Promise.all([
        getFinancialProfile(),
        getFinancialSummary(),
        getExpenses(),
        getLoans()
      ])

      if (!profileData.onboarding_completed) {
        router.replace('/onboarding')
        return
      }

      setProfile(profileData)
      setSummary(summaryData)
      setExpenses(expenseData.expenses)
      setLoans(loanData.loans)
      setProfileForm({
        full_name: profileData.full_name,
        country: profileData.country,
        student_status: profileData.student_status,
        university: profileData.university,
        monthly_income: profileData.monthly_income,
        savings_goal: profileData.savings_goal,
        risk_tolerance: profileData.risk_tolerance
      })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [router, user])

  useEffect(() => {
    if (authLoading) return

    if (!user && !isGuest) {
      router.replace('/login')
      return
    }

    if (user) {
      void loadData()
      return
    }

    setLoading(false)
    setSummary(DEFAULT_SUMMARY)
  }, [authLoading, isGuest, loadData, router, user])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const updated = await updateFinancialProfile({
        full_name: profileForm.full_name,
        country: profileForm.country,
        student_status: profileForm.student_status,
        university: profileForm.university,
        monthly_income: Number(profileForm.monthly_income || 0),
        savings_goal: Number(profileForm.savings_goal || 0),
        risk_tolerance: profileForm.risk_tolerance
      })
      setProfile(updated)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const displayName = useMemo(() => {
    if (isGuest && guestUser) return guestUser.name
    if (profile?.full_name) return profile.full_name
    if (user?.email) return user.email.split('@')[0]
    return 'Student'
  }, [guestUser, isGuest, profile?.full_name, user?.email])

  const userData = useMemo(
    () => ({
      monthlyIncome: summary.total_income,
      monthlyExpenses: summary.total_expenses,
      country: profile?.country || 'United States',
      loanAmount: summary.total_loan_balance
    }),
    [profile?.country, summary.total_expenses, summary.total_income, summary.total_loan_balance]
  )

  const cashFlowChartData = useMemo(() => {
    const remaining = Math.max(summary.remaining_balance, 0)
    return {
      labels: ['Expenses', 'Loan Payments', 'Remaining'],
      datasets: [
        {
          data: [summary.total_expenses, summary.monthly_loan_payments, remaining],
          backgroundColor: ['rgba(239, 68, 68, 0.75)', 'rgba(245, 158, 11, 0.75)', 'rgba(16, 185, 129, 0.8)'],
          borderColor: ['rgba(239, 68, 68, 1)', 'rgba(245, 158, 11, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 1
        }
      ]
    }
  }, [summary.monthly_loan_payments, summary.remaining_balance, summary.total_expenses])

  const projectionChartData = useMemo(() => {
    const monthlyNet = summary.remaining_balance
    const points = Array.from({ length: 6 }, (_, index) => {
      return Math.round(monthlyNet * (index + 1))
    })

    return {
      labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6'],
      datasets: [
        {
          label: 'Projected Net Balance',
          data: points,
          borderColor: 'rgba(34, 211, 238, 1)',
          backgroundColor: 'rgba(34, 211, 238, 0.2)',
          fill: true,
          tension: 0.35
        }
      ]
    }
  }, [summary.remaining_balance])

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'ai' as const, label: 'AI Advisor' },
    { id: 'cost' as const, label: 'Cost Cutter' },
    { id: 'timeline' as const, label: 'Timeline' },
    { id: 'profile' as const, label: 'Profile' }
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center">
        <Loader2 className="h-9 w-9 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#0f766e24,transparent_40%),radial-gradient(circle_at_90%_10%,#0ea5e924,transparent_35%),linear-gradient(#020617,#020617)] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">BurryAI Dashboard</p>
            <h1 className="text-3xl font-semibold mt-1">Welcome, {displayName}</h1>
          </div>
          <div className="flex items-center gap-3">
            {user ? <p className="text-sm text-slate-300">{user.email}</p> : null}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-700 bg-slate-900 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {isGuest ? (
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-100">
            Guest mode is active. Sign up to save real financial data and enable onboarding.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <HolographicButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-cyan-400 text-slate-950 border-cyan-300' : ''}
            >
              {tab.label}
            </HolographicButton>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <HolographicCard>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-cyan-300" />
                  Total Income
                </p>
                <p className="text-3xl font-semibold mt-2">${summary.total_income.toLocaleString()}</p>
              </HolographicCard>
              <HolographicCard>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-rose-300" />
                  Total Expenses
                </p>
                <p className="text-3xl font-semibold mt-2">${summary.total_expenses.toLocaleString()}</p>
              </HolographicCard>
              <HolographicCard>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-300" />
                  Loan Payments
                </p>
                <p className="text-3xl font-semibold mt-2">
                  ${summary.monthly_loan_payments.toLocaleString()}
                </p>
              </HolographicCard>
              <HolographicCard>
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                  Health Score
                </p>
                <p className="text-3xl font-semibold mt-2">{summary.financial_health_score}/100</p>
              </HolographicCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HolographicCard>
                <h3 className="text-xl font-semibold mb-4">Monthly Cash Flow Mix</h3>
                <div className="h-72">
                  <Doughnut
                    data={cashFlowChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: '#e2e8f0' }
                        }
                      }
                    }}
                  />
                </div>
              </HolographicCard>

              <HolographicCard>
                <h3 className="text-xl font-semibold mb-4">6-Month Projection</h3>
                <div className="h-72">
                  <Line
                    data={projectionChartData}
                    options={{
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: '#e2e8f0' }
                        }
                      },
                      scales: {
                        x: {
                          ticks: { color: '#e2e8f0' },
                          grid: { color: 'rgba(148, 163, 184, 0.18)' }
                        },
                        y: {
                          ticks: {
                            color: '#e2e8f0',
                            callback: (value) => `$${value.toLocaleString()}`
                          },
                          grid: { color: 'rgba(148, 163, 184, 0.18)' }
                        }
                      }
                    }}
                  />
                </div>
              </HolographicCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HolographicCard>
                <h3 className="text-lg font-semibold mb-3">Recent Expenses</h3>
                <div className="space-y-3">
                  {expenses.length === 0 ? (
                    <p className="text-slate-400 text-sm">No expenses logged yet.</p>
                  ) : (
                    expenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-slate-300">${expense.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">{expense.date}</p>
                      </div>
                    ))
                  )}
                </div>
              </HolographicCard>

              <HolographicCard>
                <h3 className="text-lg font-semibold mb-3">Loan Snapshot</h3>
                <div className="space-y-3">
                  {loans.length === 0 ? (
                    <p className="text-slate-400 text-sm">No loans recorded yet.</p>
                  ) : (
                    loans.slice(0, 5).map((loan) => (
                      <div key={loan.id} className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3">
                        <p className="font-medium">{loan.loan_name}</p>
                        <p className="text-sm text-slate-300">
                          Balance: ${loan.remaining_balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          Min payment: ${loan.minimum_payment.toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </HolographicCard>
            </div>
          </div>
        ) : null}

        {activeTab === 'ai' ? (
          <AIAdvisor
            userData={{
              monthlyIncome: userData.monthlyIncome,
              monthlyExpenses: userData.monthlyExpenses,
              country: userData.country
            }}
          />
        ) : null}

        {activeTab === 'cost' ? (
          <CostCutter
            userData={{
              monthlyExpenses: userData.monthlyExpenses,
              monthlyIncome: userData.monthlyIncome,
              country: userData.country
            }}
          />
        ) : null}

        {activeTab === 'timeline' ? (
          <FinancialTimeline
            userData={{
              loanAmount: userData.loanAmount,
              monthlyIncome: userData.monthlyIncome,
              monthlyExpenses: userData.monthlyExpenses
            }}
          />
        ) : null}

        {activeTab === 'profile' ? (
          <HolographicCard>
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <UserRound className="h-6 w-6 text-cyan-300" />
                Profile Settings
              </h3>
              <Button
                variant="outline"
                onClick={() => router.push('/onboarding')}
                className="border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                Re-run onboarding
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profileForm.country}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, country: event.target.value }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_status">Student status</Label>
                <Input
                  id="student_status"
                  value={profileForm.student_status}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, student_status: event.target.value }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={profileForm.university}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, university: event.target.value }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_income">Monthly income</Label>
                <Input
                  id="monthly_income"
                  type="number"
                  min={0}
                  value={profileForm.monthly_income}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      monthly_income: Number(event.target.value || 0)
                    }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="savings_goal">Savings goal</Label>
                <Input
                  id="savings_goal"
                  type="number"
                  min={0}
                  value={profileForm.savings_goal}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      savings_goal: Number(event.target.value || 0)
                    }))
                  }
                  className="bg-slate-950/60 border-cyan-500/30"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="risk_tolerance">Risk tolerance</Label>
                <select
                  id="risk_tolerance"
                  value={profileForm.risk_tolerance}
                  onChange={(event) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      risk_tolerance: event.target.value as RiskTolerance
                    }))
                  }
                  className="w-full h-10 rounded-md border border-cyan-500/30 bg-slate-950/60 px-3 text-sm outline-none focus:border-cyan-300"
                >
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={saving || isGuest}
                className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </HolographicCard>
        ) : null}
      </div>
    </div>
  )
}
