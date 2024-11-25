export interface UserData {
  name: string;
  email: string;
  university: string;
  loanAmount: number;
  interestRate: number;
  repaymentTerm: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  country: string;
}

export interface LoanPrediction {
  defaultRisk: number;
  estimatedRepaymentTime: number;
  monthlySavings: number;
}

export interface GlobalData {
  globalLoanData: Array<{ loanAmount: number; defaultStatus: number }>;
  riskFactors: Array<{ creditScore: number; riskLevel: string }>;
  inclusionMetrics: { [key: string]: number };
} 