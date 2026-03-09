export type UserProfileRow = {
  user_id: string
  full_name: string | null
  country: string | null
  student_status: string | null
  university: string | null
  onboarding_completed: number
}

export type FinancialProfileRow = {
  user_id: string
  monthly_income: number
  currency: string
  savings_goal: number
  risk_tolerance: "low" | "moderate" | "high"
}

export type FullProfile = {
  full_name: string
  country: string
  student_status: string
  university: string
  onboarding_completed: boolean
  monthly_income: number
  currency: string
  savings_goal: number
  risk_tolerance: "low" | "moderate" | "high"
}

export type ProfileUpdateInput = Partial<{
  full_name: string
  country: string
  student_status: string
  university: string
  onboarding_completed: boolean
  monthly_income: number
  currency: string
  savings_goal: number
  risk_tolerance: "low" | "moderate" | "high"
}>

const PROFILE_DEFAULTS: FullProfile = {
  full_name: "",
  country: "",
  student_status: "",
  university: "",
  onboarding_completed: false,
  monthly_income: 0,
  currency: "USD",
  savings_goal: 0,
  risk_tolerance: "moderate"
}

export async function getFullProfile(db: D1Database, userId: string): Promise<FullProfile> {
  const [userProfile, financialProfile] = await Promise.all([
    db.prepare(
      "SELECT user_id, full_name, country, student_status, university, onboarding_completed FROM user_profiles WHERE user_id = ?1 LIMIT 1"
    )
      .bind(userId)
      .first<UserProfileRow>(),
    db.prepare(
      "SELECT user_id, monthly_income, currency, savings_goal, risk_tolerance FROM financial_profiles WHERE user_id = ?1 LIMIT 1"
    )
      .bind(userId)
      .first<FinancialProfileRow>()
  ])

  return {
    full_name: userProfile?.full_name ?? PROFILE_DEFAULTS.full_name,
    country: userProfile?.country ?? PROFILE_DEFAULTS.country,
    student_status: userProfile?.student_status ?? PROFILE_DEFAULTS.student_status,
    university: userProfile?.university ?? PROFILE_DEFAULTS.university,
    onboarding_completed: Boolean(userProfile?.onboarding_completed ?? 0),
    monthly_income: financialProfile?.monthly_income ?? PROFILE_DEFAULTS.monthly_income,
    currency: financialProfile?.currency ?? PROFILE_DEFAULTS.currency,
    savings_goal: financialProfile?.savings_goal ?? PROFILE_DEFAULTS.savings_goal,
    risk_tolerance: financialProfile?.risk_tolerance ?? PROFILE_DEFAULTS.risk_tolerance
  }
}

export async function updateFullProfile(
  db: D1Database,
  userId: string,
  input: ProfileUpdateInput
): Promise<FullProfile> {
  const existing = await getFullProfile(db, userId)
  const merged: FullProfile = {
    ...existing,
    ...input
  }

  await db.batch([
    db.prepare(
      "INSERT INTO financial_profiles (user_id, monthly_income, currency, savings_goal, risk_tolerance) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(user_id) DO UPDATE SET monthly_income = excluded.monthly_income, currency = excluded.currency, savings_goal = excluded.savings_goal, risk_tolerance = excluded.risk_tolerance"
    )
      .bind(
        userId,
        merged.monthly_income,
        merged.currency,
        merged.savings_goal,
        merged.risk_tolerance
      ),
    db.prepare(
      "INSERT INTO user_profiles (user_id, full_name, country, student_status, university, onboarding_completed) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(user_id) DO UPDATE SET full_name = excluded.full_name, country = excluded.country, student_status = excluded.student_status, university = excluded.university, onboarding_completed = excluded.onboarding_completed"
    )
      .bind(
        userId,
        merged.full_name,
        merged.country,
        merged.student_status,
        merged.university,
        merged.onboarding_completed ? 1 : 0
      )
  ])

  return await getFullProfile(db, userId)
}
