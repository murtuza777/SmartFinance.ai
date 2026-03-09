export interface GuestUser {
  name: string
  isGuest: true
}

export async function signInAsGuest(guestName?: string): Promise<GuestUser> {
  if (guestName && guestName.trim()) {
    const name = guestName.trim()
    localStorage.setItem("guestName", name)
    localStorage.setItem("isGuest", "true")
    localStorage.setItem("guestLoginTime", new Date().toISOString())
    return { name, isGuest: true }
  }

  throw new Error("Guest name is required")
}

export function getGuestInfo(): GuestUser | null {
  if (typeof window === "undefined") return null

  const isGuest = localStorage.getItem("isGuest") === "true"
  const guestName = localStorage.getItem("guestName")

  if (isGuest && guestName) {
    return { name: guestName, isGuest: true }
  }

  return null
}

export function logoutGuest(): void {
  localStorage.removeItem("guestName")
  localStorage.removeItem("isGuest")
  localStorage.removeItem("guestLoginTime")
}
