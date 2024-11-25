import { UserData, LoanPrediction, GlobalData } from '@/types/dashboard'
import { db } from './firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

export async function fetchUserData(userId: string): Promise<UserData> {
  const userDoc = await getDoc(doc(db, 'users', userId))
  if (!userDoc.exists()) {
    throw new Error('User data not found')
  }
  return userDoc.data() as UserData
}

export async function processData(userData: UserData): Promise<GlobalData> {
  // Fetch global data from Firestore
  const loansSnapshot = await getDocs(collection(db, 'loans'))
  const riskSnapshot = await getDocs(collection(db, 'risks'))
  const inclusionSnapshot = await getDocs(collection(db, 'inclusion'))

  return {
    globalLoanData: loansSnapshot.docs.map(doc => doc.data()) as Array<{ loanAmount: number; defaultStatus: number }>,
    riskFactors: riskSnapshot.docs.map(doc => doc.data()) as Array<{ creditScore: number; riskLevel: string }>,
    inclusionMetrics: Object.fromEntries(
      inclusionSnapshot.docs.map(doc => [doc.id, doc.data().score])
    )
  }
}

export async function generatePredictions(
  userData: UserData,
  globalData: GlobalData
): Promise<LoanPrediction> {
  const monthlyPayment = calculateMonthlyPayment(userData)
  const defaultRisk = calculateDefaultRisk(userData, globalData)
  const estimatedTime = calculateRepaymentTime(userData, monthlyPayment)
  const savings = userData.monthlyIncome - userData.monthlyExpenses - monthlyPayment

  return {
    defaultRisk,
    estimatedRepaymentTime: estimatedTime,
    monthlySavings: savings
  }
}

function calculateMonthlyPayment(userData: UserData): number {
  const P = userData.loanAmount
  const r = userData.interestRate / 1200
  const n = userData.repaymentTerm
  return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function calculateDefaultRisk(userData: UserData, globalData: GlobalData): number {
  const debtToIncome = userData.loanAmount / (userData.monthlyIncome * 12)
  const similarLoans = globalData.globalLoanData.filter(loan => 
    Math.abs(loan.loanAmount - userData.loanAmount) < 10000
  )
  const avgDefaultRate = similarLoans.reduce((acc, loan) => acc + loan.defaultStatus, 0) / similarLoans.length
  return Math.min(debtToIncome * avgDefaultRate, 1)
}

function calculateRepaymentTime(userData: UserData, monthlyPayment: number): number {
  const disposableIncome = userData.monthlyIncome - userData.monthlyExpenses
  const paymentRatio = monthlyPayment / disposableIncome
  return Math.ceil(userData.repaymentTerm * (1 + Math.max(0, paymentRatio - 0.3)))
} 