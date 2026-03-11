import { useMemo } from 'react'
import { HolographicCard } from '@/components/dashboard/HolographicUI'
import { Scissors, TrendingDown, PiggyBank, AlertTriangle, DollarSign, ShoppingBag, Coffee, Home, Car } from 'lucide-react'
import { Doughnut, Bar } from 'react-chartjs-2'

interface CostCutterProps {
  userData: {
    monthlyExpenses: number
    monthlyIncome: number
    country: string
    categories: Array<{ category: string; amount: number; percentage: number }>
  }
}

interface ExpenseCategory {
  category: string
  amount: number
  potential: number
  icon: any
  tips: string[]
}

export function CostCutter({ userData }: CostCutterProps) {
  const expenseCategories = useMemo<ExpenseCategory[]>(() => {
    const iconMap: Record<string, any> = {
      housing: Home,
      rent: Home,
      hostel: Home,
      food: Coffee,
      grocery: Coffee,
      transportation: Car,
      transport: Car,
      shopping: ShoppingBag
    }

    if (userData.categories.length === 0) {
      return []
    }

    return userData.categories.slice(0, 6).map((item) => {
      const normalized = item.category.toLowerCase()
      const icon = iconMap[normalized] ?? ShoppingBag
      const potentialTarget = item.amount * 0.9
      return {
        category: item.category,
        amount: item.amount,
        potential: potentialTarget,
        icon,
        tips: [
          "Set a strict weekly cap and track your actual spend daily.",
          "Replace one high-cost habit with a lower-cost alternative.",
          "Auto-transfer the saved amount to savings/debt right after payday."
        ]
      }
    })
  }, [userData.categories])

  const totalSavingsPotential = expenseCategories.reduce(
    (acc, cat) => acc + (cat.amount - cat.potential), 
    0
  )

  const chartData = {
    labels: expenseCategories.map(cat => cat.category),
    datasets: [
      {
        data: expenseCategories.map(cat => cat.amount),
        backgroundColor: [
          'rgba(6, 182, 212, 0.8)',
          'rgba(6, 182, 212, 0.6)',
          'rgba(6, 182, 212, 0.4)',
          'rgba(6, 182, 212, 0.2)',
        ],
        borderColor: 'rgba(6, 182, 212, 1)',
        borderWidth: 1,
      },
    ],
  }

  const savingsChartData = {
    labels: ['Current', 'Potential'],
    datasets: [{
      label: 'Monthly Expenses',
      data: [
        userData.monthlyExpenses,
        Math.max(userData.monthlyExpenses - totalSavingsPotential, 0)
      ],
      backgroundColor: ['rgba(6, 182, 212, 0.8)', 'rgba(34, 197, 94, 0.8)'],
      borderColor: ['rgba(6, 182, 212, 1)', 'rgba(34, 197, 94, 1)'],
      borderWidth: 1,
    }]
  }

  return (
    <div className="space-y-6 w-full">
      {/* First Row: Two Charts Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Expense Overview (Left) */}
        <HolographicCard className="flex-1">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Scissors className="w-6 h-6 text-cyan-500 mr-2" />
            Expense Analysis
          </h3>
          <div className="h-64">
            <Doughnut
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { color: 'white' }
                  }
                }
              }}
            />
          </div>
        </HolographicCard>

        {/* Savings Potential (Right) */}
        <HolographicCard className="flex-1">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <PiggyBank className="w-6 h-6 text-cyan-500 mr-2" />
            Savings Potential
          </h3>
          <div className="h-64">
            <Bar
              data={savingsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { 
                      color: 'white',
                      callback: (value) => `$${value}`
                    }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: 'white' }
                  }
                }
              }}
            />
          </div>
        </HolographicCard>
      </div>

      {/* Second Row: Smart Recommendations */}
      <HolographicCard>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 text-cyan-500 mr-2" />
          Smart Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expenseCategories.map((category, index) => (
            <div key={index} className="p-4 bg-slate-950/65 border border-cyan-500/15 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <category.icon className="w-5 h-5 text-cyan-500 mr-2" />
                  <h4 className="font-semibold">{category.category}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Current</p>
                  <p className="font-semibold">${category.amount.toFixed(0)}</p>
                </div>
              </div>
              <div className="mb-2">
                <div className="h-2 bg-slate-900 rounded-full">
                  <div 
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${category.amount > 0 ? (category.potential / category.amount) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-300">
                <p className="text-emerald-400 font-semibold mb-2">
                  Potential Savings: ${(category.amount - category.potential).toFixed(0)}/month
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </HolographicCard>

      {/* Third Row: Location Analysis */}
      <HolographicCard>
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <DollarSign className="w-6 h-6 text-cyan-500 mr-2" />
          Cost of Living Analysis - {userData.country}
        </h3>
        <div className="p-4 bg-slate-950/65 border border-cyan-500/15 rounded-xl">
          <p className="text-slate-300 mb-4">
            Based on your location and typical student expenses in {userData.country}:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-lg">
              <p className="text-sm text-slate-400">Your Monthly Expenses</p>
              <p className="text-xl font-bold text-white">${userData.monthlyExpenses}</p>
            </div>
            <div className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-lg">
              <p className="text-sm text-slate-400">Average Student Expenses</p>
                  <p className="text-xl font-bold text-cyan-500">${(userData.monthlyExpenses * 0.9).toFixed(0)}</p>
            </div>
            <div className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-lg">
              <p className="text-sm text-slate-400">Optimization Target</p>
              <p className="text-xl font-bold text-emerald-400">${(userData.monthlyExpenses * 0.8).toFixed(0)}</p>
            </div>
          </div>
        </div>
      </HolographicCard>
    </div>
  )
} 
