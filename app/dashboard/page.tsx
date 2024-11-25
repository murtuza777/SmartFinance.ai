'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertTriangle, CheckCircle2, TrendingUp, Briefcase, GraduationCap, DollarSign, CreditCard, PiggyBank, TrendingDown, History, Brain, Scissors, User, Percent, Clock } from 'lucide-react'
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import DashboardScene from './DashboardScene'
import { HolographicButton, HolographicCard } from '@/components/dashboard/HolographicUI'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LucideIcon } from 'lucide-react'
import { getAIRecommendations } from '@/lib/ai-service'
import { AIAdvisor } from '@/components/dashboard/features/AIAdvisor/AIAdvisor'
import { CostCutter } from '@/components/dashboard/features/CostCutter/CostCutter'
import { FinancialTimeline } from '@/components/dashboard/features/Timeline/FinancialTimeline'

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  RadialLinearScale, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
)

// Define interface for StatCard props
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  className?: string;
  editable?: boolean;
  onUpdate?: (value: number) => void;
  prefix?: string;
  suffix?: string;
}

// Update the StatCard component with proper typing
const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '',
  editable = false,
  onUpdate,
  prefix = '',
  suffix = ''
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onUpdate) {
      onUpdate(Number(editValue))
    }
    setIsEditing(false)
  }

  return (
    <div 
      className={`flex items-center p-4 rounded-lg bg-black/30 border border-cyan-500/30 ${className}`}
      onClick={() => editable && setIsEditing(true)}
    >
      <Icon className="w-8 h-8 text-cyan-500 mr-3" />
      <div className="flex-grow">
        <p className="text-sm text-gray-400">{title}</p>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-black/30 border-cyan-500/30 text-white w-24"
              autoFocus
              onBlur={handleSubmit}
            />
            {suffix}
          </form>
        ) : (
          <p className="text-xl font-bold text-white">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
        )}
      </div>
      {trend !== undefined && (
        <div className={`ml-auto ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <TrendingUp /> : <TrendingDown />}
          <span className="text-sm">{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  )
}

// Add interface for API response
interface APIResponse {
  data: {
    metrics: {
      riskScore: number;
      monthlySavings: number;
      debtToIncomeRatio: number;
      savingsPotential: number;
    };
    recommendations: {
      advice: string;
      relevantData: any[];
    };
  };
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState({
    name: 'Jamshed',
    email: 'jamshed@example.com',
    university: 'Quantum University',
    loanAmount: 50000,
    interestRate: 5.5,
    repaymentTerm: 36,
    monthlyIncome: 3000,
    monthlyExpenses: 2000,
    country: 'USA',
  })

  // Update metrics state to include editable fields
  const [metrics, setMetrics] = useState({
    totalLoan: userData.loanAmount,
    monthlyPayment: 500,
    savingsRate: 15,
    riskScore: 75,
    interestRate: userData.interestRate || 5.5,
    repaymentTerm: userData.repaymentTerm || 36
  })

  // Add financial recommendations
  const [recommendations, setRecommendations] = useState([
    "Consider refinancing your loan to get a lower interest rate",
    "Increase your monthly savings by reducing discretionary spending",
    "Look into student loan forgiveness programs",
    "Start building an emergency fund"
  ])

  const [aiData, setAiData] = useState(null)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setLoading(false), 2000)
  }, [])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
          },
          body: JSON.stringify({
            prompt: "Initial analysis",
            userData: {
              country: userData.country,
              university: userData.university,
              monthlyIncome: userData.monthlyIncome,
              monthlyExpenses: userData.monthlyExpenses,
              loanAmount: userData.loanAmount,
              userMessage: "Initial analysis"
            }
          })
        });

        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json() as APIResponse;
        
        // Add type guard to check if data has the expected structure
        if (data?.data?.metrics) {
          setMetrics(prev => ({
            ...prev,
            riskScore: data.data.metrics.riskScore,
            monthlySavings: data.data.metrics.monthlySavings,
            debtToIncomeRatio: data.data.metrics.debtToIncomeRatio,
            savingsPotential: data.data.metrics.savingsPotential
          }));

          if (data.data.recommendations?.advice) {
            setRecommendations([data.data.recommendations.advice]);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Optionally set some default values or show an error state
        setMetrics(prev => ({
          ...prev,
          riskScore: 50, // Default values
          monthlySavings: userData.monthlyIncome - userData.monthlyExpenses,
          debtToIncomeRatio: (userData.loanAmount / 12) / userData.monthlyIncome,
          savingsPotential: (userData.monthlyIncome - userData.monthlyExpenses) * 0.2
        }));
      }
    };

    if (!loading) {
      fetchMetrics();
    }
  }, [userData, loading]);

  // Add new feature tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Brain },
    { id: 'cost-cutter', label: 'Cost Cutter', icon: Scissors },
    { id: 'timelines', label: 'Timelines', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ]

  // Add function to recalculate loan timeline data
  const calculateLoanTimeline = useCallback(() => {
    const monthlyRate = metrics.interestRate / 1200
    const totalPayments = metrics.repaymentTerm
    const monthlyPayment = (metrics.totalLoan * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1)
    
    let balance = metrics.totalLoan
    const timelineData = []
    
    for (let i = 0; i <= 5; i++) {
      timelineData.push({
        month: i * 12,
        balance: Math.round(balance)
      })
      balance = balance * (1 + monthlyRate) - monthlyPayment * 12
    }

    return timelineData
  }, [metrics.totalLoan, metrics.interestRate, metrics.repaymentTerm])

  // Update userData when profile changes
  const handleProfileUpdate = (newData: Partial<typeof userData>) => {
    setUserData(prev => {
      const updated = { ...prev, ...newData }
      // Update metrics based on new user data
      setMetrics(prev => ({
        ...prev,
        totalLoan: updated.loanAmount,
        monthlyPayment: calculateMonthlyPayment(updated.loanAmount, metrics.interestRate, metrics.repaymentTerm)
      }))
      return updated
    })
  }

  // Add function to handle metric updates
  const handleMetricUpdate = (field: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [field]: value,
      monthlyPayment: field === 'totalLoan' || field === 'interestRate' || field === 'repaymentTerm' 
        ? calculateMonthlyPayment(
            field === 'totalLoan' ? value : prev.totalLoan,
            field === 'interestRate' ? value : prev.interestRate,
            field === 'repaymentTerm' ? value : prev.repaymentTerm
          )
        : prev.monthlyPayment
    }))
  }

  // Helper function to calculate monthly payment
  const calculateMonthlyPayment = (loan: number, rate: number, term: number) => {
    const monthlyRate = rate / 1200
    return Math.round((loan * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background Scene */}
      <DashboardScene />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <HolographicButton
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                icon={Icon}
                className={`${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-black'
                    : 'bg-transparent text-cyan-500'
                }`}
              >
                {tab.label}
              </HolographicButton>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-[60vh]"
            >
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Existing dashboard content */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard 
                      title="Total Loan" 
                      value={metrics.totalLoan}
                      icon={CreditCard}
                      editable={true}
                      onUpdate={(value) => handleMetricUpdate('totalLoan', value)}
                      prefix="$"
                    />
                    <StatCard 
                      title="Monthly Payment" 
                      value={metrics.monthlyPayment}
                      icon={DollarSign}
                      trend={-2.5}
                      prefix="$"
                    />
                    <StatCard 
                      title="Interest Rate" 
                      value={metrics.interestRate}
                      icon={Percent}
                      editable={true}
                      onUpdate={(value) => handleMetricUpdate('interestRate', value)}
                      suffix="%"
                    />
                    <StatCard 
                      title="Loan Term" 
                      value={metrics.repaymentTerm}
                      icon={Clock}
                      editable={true}
                      onUpdate={(value) => handleMetricUpdate('repaymentTerm', value)}
                      suffix=" months"
                    />
                  </div>

                  {/* New Analytics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Loan vs Income Analysis */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-4">Loan vs Income Analysis</h3>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: ['Current', 'After 1 Year', 'After 2 Years', 'After 3 Years'],
                            datasets: [
                              {
                                label: 'Loan Balance',
                                data: calculateLoanTimeline().slice(0, 4).map(d => d.balance),
                                backgroundColor: 'rgba(6, 182, 212, 0.5)',
                                borderColor: 'rgba(6, 182, 212, 1)',
                                borderWidth: 1,
                              },
                              {
                                label: 'Projected Income',
                                data: [
                                  userData.monthlyIncome * 12,
                                  userData.monthlyIncome * 12 * 1.05,
                                  userData.monthlyIncome * 12 * 1.1,
                                  userData.monthlyIncome * 12 * 1.15,
                                ],
                                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                                borderColor: 'rgba(34, 197, 94, 1)',
                                borderWidth: 1,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { 
                                display: true,
                                position: 'top',
                                labels: { color: 'white' }
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { 
                                  color: 'white',
                                  callback: (value) => `$${value.toLocaleString()}`
                                }
                              },
                              x: {
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: 'white' }
                              }
                            },
                          }}
                        />
                      </div>
                    </HolographicCard>

                    {/* Financial Health Radar */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-4">Financial Health Metrics</h3>
                      <div className="h-64">
                        <Radar
                          data={{
                            labels: [
                              'Debt-to-Income',
                              'Savings Rate',
                              'Payment Reliability',
                              'Income Growth',
                              'Emergency Fund'
                            ],
                            datasets: [{
                              label: 'Your Metrics',
                              data: [
                                (metrics.totalLoan / (userData.monthlyIncome * 12)) * 100,
                                (userData.monthlyIncome - userData.monthlyExpenses) / userData.monthlyIncome * 100,
                                95, // Example reliability score
                                5,  // Example growth rate
                                ((userData.monthlyIncome - userData.monthlyExpenses) * 3) / (userData.monthlyExpenses * 6) * 100
                              ],
                              backgroundColor: 'rgba(6, 182, 212, 0.2)',
                              borderColor: 'rgba(6, 182, 212, 1)',
                              borderWidth: 2,
                              pointBackgroundColor: 'rgba(6, 182, 212, 1)',
                              pointBorderColor: '#fff',
                              pointHoverBackgroundColor: '#fff',
                              pointHoverBorderColor: 'rgba(6, 182, 212, 1)'
                            }]
                          }}
                          options={{
                            responsive: true,
                            scales: {
                              r: {
                                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                pointLabels: { color: 'white' },
                                ticks: { color: 'white', backdropColor: 'transparent' }
                              }
                            },
                            plugins: {
                              legend: { display: false }
                            }
                          }}
                        />
                      </div>
                    </HolographicCard>

                    {/* Monthly Cash Flow */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-4">Monthly Cash Flow</h3>
                      <div className="h-64">
                        <Doughnut
                          data={{
                            labels: ['Loan Payment', 'Other Expenses', 'Savings', 'Disposable'],
                            datasets: [{
                              data: [
                                metrics.monthlyPayment,
                                userData.monthlyExpenses - metrics.monthlyPayment,
                                (userData.monthlyIncome - userData.monthlyExpenses) * 0.5,
                                (userData.monthlyIncome - userData.monthlyExpenses) * 0.5
                              ],
                              backgroundColor: [
                                'rgba(6, 182, 212, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(34, 197, 94, 0.8)',
                                'rgba(168, 85, 247, 0.8)'
                              ],
                              borderColor: 'rgba(0, 0, 0, 0.1)',
                              borderWidth: 1
                            }]
                          }}
                          options={{
                            responsive: true,
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

                    {/* Payment Schedule */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-4">Payment Schedule Impact</h3>
                      <div className="h-64">
                        <Line
                          data={{
                            labels: ['Current', '+3 Months', '+6 Months', '+9 Months', '+12 Months'],
                            datasets: [
                              {
                                label: 'Standard Payment',
                                data: calculateLoanTimeline().slice(0, 5).map(d => d.balance),
                                borderColor: 'rgba(6, 182, 212, 1)',
                                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                fill: true,
                              },
                              {
                                label: 'With Extra Payment',
                                data: calculateLoanTimeline().slice(0, 5).map(d => d.balance * 0.95),
                                borderColor: 'rgba(34, 197, 94, 1)',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                fill: true,
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: { color: 'white' }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: false,
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { 
                                  color: 'white',
                                  callback: (value) => `$${value.toLocaleString()}`
                                }
                              },
                              x: {
                                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                ticks: { color: 'white' }
                              }
                            }
                          }}
                        />
                      </div>
                    </HolographicCard>
                  </div>
                </>
              )}

              {/* AI Advisor Tab */}
              {activeTab === 'ai-advisor' && (
                <div className="w-full">
                  <AIAdvisor userData={userData} />
                </div>
              )}

              {/* Cost Cutter Tab */}
              {activeTab === 'cost-cutter' && (
                <div className="w-full">
                  <CostCutter userData={userData} />
                </div>
              )}

              {/* Timelines Tab */}
              {activeTab === 'timelines' && (
                <div className="grid grid-cols-1 gap-6">
                  <FinancialTimeline userData={userData} />
                </div>
              )}

              {/* Existing profile content */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <HolographicCard className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
                    <div className="relative z-10 flex items-center gap-6">
                      <motion.div 
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
                        animate={{ 
                          boxShadow: ['0 0 20px rgba(6, 182, 212, 0.3)', '0 0 40px rgba(6, 182, 212, 0.5)', '0 0 20px rgba(6, 182, 212, 0.3)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <User className="w-12 h-12 text-white" />
                      </motion.div>
                      <div>
                        <motion.h2 
                          className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          {userData.name}
                        </motion.h2>
                        <p className="text-gray-400">{userData.email}</p>
                      </div>
                    </div>
                  </HolographicCard>

                  {/* Profile Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-6 flex items-center">
                        <User className="w-6 h-6 text-cyan-500 mr-2" />
                        Personal Information
                      </h3>
                      <div className="space-y-6">
                        <div className="relative">
                          <Label className="text-gray-300">Full Name</Label>
                          <div className="relative">
                            <Input 
                              value={userData.name}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, name: e.target.value})}
                            />
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <Label className="text-gray-300">Email Address</Label>
                          <div className="relative">
                            <Input 
                              value={userData.email}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, email: e.target.value})}
                            />
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <Label className="text-gray-300">University</Label>
                          <div className="relative">
                            <Input 
                              value={userData.university}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, university: e.target.value})}
                            />
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                            />
                          </div>
                        </div>
                      </div>
                    </HolographicCard>

                    {/* Financial Information */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-6 flex items-center">
                        <DollarSign className="w-6 h-6 text-cyan-500 mr-2" />
                        Financial Information
                      </h3>
                      <div className="space-y-6">
                        <div className="relative">
                          <Label className="text-gray-300">Monthly Income</Label>
                          <div className="relative">
                            <Input 
                              type="number"
                              value={userData.monthlyIncome}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, monthlyIncome: Number(e.target.value)})}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-cyan-500">USD</span>
                            </div>
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <Label className="text-gray-300">Monthly Expenses</Label>
                          <div className="relative">
                            <Input 
                              type="number"
                              value={userData.monthlyExpenses}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, monthlyExpenses: Number(e.target.value)})}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-cyan-500">USD</span>
                            </div>
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <Label className="text-gray-300">Country</Label>
                          <div className="relative">
                            <Input 
                              value={userData.country}
                              className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-all"
                              onChange={(e) => setUserData({...userData, country: e.target.value})}
                            />
                            <motion.div 
                              className="absolute inset-0 border border-cyan-500/30 rounded-md pointer-events-none"
                              animate={{ opacity: [0.3, 0.6, 0.3] }}
                              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                            />
                          </div>
                        </div>
                      </div>
                    </HolographicCard>

                    {/* Profile Stats */}
                    <HolographicCard>
                      <h3 className="text-xl font-bold mb-6 flex items-center">
                        <TrendingUp className="w-6 h-6 text-cyan-500 mr-2" />
                        Profile Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/30">
                          <p className="text-gray-400 text-sm">Savings Rate</p>
                          <p className="text-2xl font-bold text-cyan-500">
                            {Math.round((userData.monthlyIncome - userData.monthlyExpenses) / userData.monthlyIncome * 100)}%
                          </p>
                        </div>
                        <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/30">
                          <p className="text-gray-400 text-sm">Debt-to-Income</p>
                          <p className="text-2xl font-bold text-cyan-500">
                            {Math.round((metrics.totalLoan / (userData.monthlyIncome * 12)) * 100)}%
                          </p>
                        </div>
                        <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/30">
                          <p className="text-gray-400 text-sm">Monthly Savings</p>
                          <p className="text-2xl font-bold text-cyan-500">
                            ${(userData.monthlyIncome - userData.monthlyExpenses).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/30">
                          <p className="text-gray-400 text-sm">Risk Score</p>
                          <p className="text-2xl font-bold text-cyan-500">
                            {metrics.riskScore}/100
                          </p>
                        </div>
                      </div>
                    </HolographicCard>

                    {/* Save Changes Button */}
                    <motion.div 
                      className="lg:col-span-2 flex justify-end"
                      whileHover={{ scale: 1.02 }}
                    >
                      <HolographicButton 
                        onClick={() => {
                          // Handle profile update
                          console.log('Profile updated')
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8"
                      >
                        Save Changes
                      </HolographicButton>
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

