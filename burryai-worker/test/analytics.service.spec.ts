import { describe, expect, it } from "vitest"
import { calculateFinancialHealthScore } from "../src/services/analytics"

describe("analytics service", () => {
  it("returns a high score for strong savings and low debt", () => {
    const score = calculateFinancialHealthScore({
      monthlyIncome: 5000,
      monthlyExpenses: 1800,
      monthlyLoanPayments: 300
    })

    expect(score).toBeGreaterThanOrEqual(75)
  })

  it("returns a low score for high spending and heavy debt burden", () => {
    const score = calculateFinancialHealthScore({
      monthlyIncome: 2000,
      monthlyExpenses: 1800,
      monthlyLoanPayments: 900
    })

    expect(score).toBeLessThan(40)
  })

  it("handles zero income deterministically", () => {
    const scoreNoCosts = calculateFinancialHealthScore({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyLoanPayments: 0
    })
    const scoreWithCosts = calculateFinancialHealthScore({
      monthlyIncome: 0,
      monthlyExpenses: 300,
      monthlyLoanPayments: 200
    })

    expect(scoreNoCosts).toBe(50)
    expect(scoreWithCosts).toBe(15)
  })
})
