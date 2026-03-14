'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

import FinanceLoader from '../components/ui/FinanceLoader'

const LandingPage = dynamic<{}>(
  () => import('../components/LandingPage').then((mod) => mod.default as ComponentType<{}>),
  { 
    ssr: false,
    loading: () => <FinanceLoader />
  }
)

export default function Home() {
  return <LandingPage />
} 