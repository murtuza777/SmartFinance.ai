import { useState } from 'react'
import { HolographicCard, HolographicButton } from '@/components/dashboard/HolographicUI'
import { Line } from 'react-chartjs-2'
import { Calendar, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { format, addMonths } from 'date-fns'

interface TimelineProps {
  userData: {
    loanAmount: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  }
}

export function FinancialTimeline({ userData }: TimelineProps) {
  const [timeframe, setTimeframe] = useState('1year')
  const baseMonthlyPayment = 1500 // Example fixed payment

  const generateTimelineData = () => {
    const months = timeframe === '1year' ? 12 : timeframe === '3years' ? 36 : 60
    const data = []
    let balance = userData.loanAmount
    const monthlyPayment = baseMonthlyPayment
    const interestRate = 0.055 / 12 // 5.5% annual rate

    for (let i = 0; i <= months; i++) {
      const interest = balance * interestRate
      balance = balance + interest - monthlyPayment
      if (balance < 0) balance = 0

      data.push({
        month: i,
        balance: Math.round(balance),
        payment: monthlyPayment,
        interest: Math.round(interest)
      })
    }
    return data
  }

  const timelineData = generateTimelineData()

  // Calculate payment impact metrics
  const monthlyPayment = baseMonthlyPayment
  const extraPayment = monthlyPayment + 200
  const totalInterest = timelineData.reduce((sum, d) => sum + d.interest, 0)
  
  // Calculate payoff dates
  const standardPayoffMonth = timelineData.findIndex(d => d.balance <= 0) || timelineData.length
  const payoffDate = format(addMonths(new Date(), standardPayoffMonth), 'MMM yyyy')
  
  // Calculate with extra payments
  const extraPaymentData = []
  let balanceWithExtra = userData.loanAmount
  let monthsWithExtra = 0
  let totalInterestWithExtra = 0

  while (balanceWithExtra > 0 && monthsWithExtra < timelineData.length) {
    const interest = balanceWithExtra * (0.055 / 12)
    totalInterestWithExtra += interest
    balanceWithExtra = balanceWithExtra + interest - extraPayment
    monthsWithExtra++
  }

  const payoffDateWithExtra = format(addMonths(new Date(), monthsWithExtra), 'MMM yyyy')
  const interestSavings = Math.round(totalInterest - totalInterestWithExtra)

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="grid grid-cols-3 gap-4">
        <HolographicButton
          onClick={() => setTimeframe('1year')}
          className={timeframe === '1year' ? 'bg-cyan-500 text-black' : ''}
        >
          1 Year
        </HolographicButton>
        <HolographicButton
          onClick={() => setTimeframe('3years')}
          className={timeframe === '3years' ? 'bg-cyan-500 text-black' : ''}
        >
          3 Years
        </HolographicButton>
        <HolographicButton
          onClick={() => setTimeframe('5years')}
          className={timeframe === '5years' ? 'bg-cyan-500 text-black' : ''}
        >
          5 Years
        </HolographicButton>
      </div>

      {/* Main Timeline Chart */}
      <HolographicCard>
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="w-6 h-6 text-cyan-500 mr-2" />
          Loan Repayment Timeline
        </h3>
        <div className="h-[400px]">
          <Line
            data={{
              labels: timelineData.map(d => `Month ${d.month}`),
              datasets: [
                {
                  label: 'Loan Balance',
                  data: timelineData.map(d => d.balance),
                  borderColor: 'rgba(6, 182, 212, 1)',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Cumulative Interest',
                  data: timelineData.map((_, i) => 
                    timelineData.slice(0, i + 1).reduce((sum, d) => sum + d.interest, 0)
                  ),
                  borderColor: 'rgba(249, 115, 22, 1)',
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  fill: true,
                  tension: 0.4
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: 'white' }
                }
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
              }
            }}
          />
        </div>
      </HolographicCard>

      {/* Timeline Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HolographicCard>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400">Total Interest</h4>
              <p className="text-2xl font-bold">
                ${timelineData.reduce((sum, d) => sum + d.interest, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-cyan-500" />
          </div>
        </HolographicCard>

        <HolographicCard>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400">Payoff Progress</h4>
              <p className="text-2xl font-bold">
                {Math.round((1 - timelineData[timelineData.length - 1].balance / userData.loanAmount) * 100)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-cyan-500" />
          </div>
        </HolographicCard>

        <HolographicCard>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-gray-400">Time Remaining</h4>
              <p className="text-2xl font-bold">
                {timelineData.findIndex(d => d.balance <= 0) || timelineData.length} months
              </p>
            </div>
            <Clock className="w-8 h-8 text-cyan-500" />
          </div>
        </HolographicCard>
      </div>

      {/* Payment Impact Simulator */}
      <HolographicCard>
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 text-cyan-500 mr-2" />
          Payment Impact Simulator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-bold">Standard Payment Plan</h4>
            <p className="text-gray-400">Monthly Payment: ${monthlyPayment.toLocaleString()}</p>
            <p className="text-gray-400">Total Interest: ${Math.round(totalInterest).toLocaleString()}</p>
            <p className="text-gray-400">Payoff Date: {payoffDate}</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">With Extra Payments</h4>
            <p className="text-cyan-500">Monthly Payment: ${extraPayment.toLocaleString()}</p>
            <p className="text-cyan-500">Total Interest: ${Math.round(totalInterestWithExtra).toLocaleString()}</p>
            <p className="text-cyan-500">Payoff Date: {payoffDateWithExtra}</p>
            <p className="text-green-500">You could save ${interestSavings.toLocaleString()}!</p>
          </div>
        </div>
      </HolographicCard>
    </div>
  )
} 