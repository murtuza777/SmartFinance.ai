'use client'

import Image from 'next/image'

type BrandIdentityProps = {
  size?: number
  textClassName?: string
  className?: string
}

export function BrandIdentity({
  size = 32,
  textClassName = 'text-2xl font-bold text-cyan-400',
  className = ''
}: BrandIdentityProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image src="/burryai-owl.svg" alt="BurryAI logo" width={size} height={size} priority />
      <span className={textClassName}>BurryAI</span>
    </div>
  )
}
