'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

const LandingPage = dynamic<{}>(
  () => import('../components/LandingPage').then((mod) => mod.default as ComponentType<{}>),
  { 
    ssr: false,
    loading: () => <div>Loading...</div>
  }
)

export default function Home() {
  return <LandingPage />
} 