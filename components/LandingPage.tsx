'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HolographicButton, HolographicCard } from './dashboard/HolographicUI'
import { Brain, Sparkles, TrendingUp, DollarSign, Shield, Rocket, X } from 'lucide-react'
import Scene3D from './3d/Scene3D'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showLoginCard, setShowLoginCard] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    router.push('/dashboard')
  }

  const features = [
    {
      title: "AI-Powered Financial Advisor",
      description: "Get personalized financial guidance using advanced AI algorithms",
      icon: Brain,
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Smart Expense Tracking",
      description: "Automatically categorize and optimize your spending patterns",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Investment Insights",
      description: "Real-time analysis of investment opportunities tailored for students",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Loan Management",
      description: "Optimize your student loan repayment strategy",
      icon: DollarSign,
      color: "from-orange-500 to-red-500"
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          scrollbar-width: none;
        }
      `}</style>

      {/* 3D Background */}
      <div className="fixed inset-0">
        <Scene3D />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-lg' : ''
      }`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-cyan-500">SmartFinance.AI</h1>
          <div className="flex items-center gap-2">
            <HolographicButton 
              onClick={() => {
                setIsLogin(true)
                setShowLoginCard(true)
              }}
              className={`px-6 py-2 min-w-[100px] flex items-center justify-center ${
                isLogin && showLoginCard ? 'bg-cyan-500 text-black' : ''
              }`}
            >
              Login
            </HolographicButton>
            <HolographicButton 
              onClick={() => {
                setIsLogin(false)
                setShowLoginCard(true)
              }}
              className={`px-6 py-2 min-w-[100px] flex items-center justify-center ${
                !isLogin && showLoginCard ? 'bg-cyan-500 text-black' : ''
              }`}
            >
              Sign Up
            </HolographicButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Master Your Finances with AI
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Smart financial planning for students, powered by artificial intelligence
            </p>
            <div className="flex gap-4">
              <HolographicButton 
                onClick={() => setShowLoginCard(true)}
                icon={Rocket}
                className="bg-cyan-500 text-black"
              >
                Get Started
              </HolographicButton>
              <HolographicButton 
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                icon={Shield}
              >
                Learn More
              </HolographicButton>
            </div>
          </motion.div>

          {/* Enhanced 3D Login/Signup Form */}
          <AnimatePresence mode="wait">
            {showLoginCard && (
              <motion.div
                initial={{ opacity: 0, y: 50, rotateX: -30 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -50, rotateX: 30 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                style={{
                  transformStyle: "preserve-3d",
                  perspective: "1000px"
                }}
                className="relative"
              >
                {/* Floating elements behind the card */}
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur-xl"
                />
                
                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/50 to-blue-500/50 blur-md" />

                {/* Main card content */}
                <HolographicCard className="relative backdrop-blur-xl transform transition-all duration-500 hover:scale-105">
                  {/* Close button */}
                  <button 
                    onClick={() => setShowLoginCard(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <CardHeader>
                    <CardTitle className="text-2xl text-cyan-500">
                      {isLogin ? 'Welcome Back' : 'Join SmartFinance.AI'}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {isLogin 
                        ? 'Access your AI-powered financial dashboard'
                        : 'Start your journey to financial success'}
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="space-y-2 relative">
                      <Label className="text-gray-300">Email</Label>
                      <div className="relative">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-colors relative z-10"
                          placeholder="student@university.edu"
                        />
                        <motion.div 
                          className="absolute inset-0 border border-cyan-500/50 rounded-md pointer-events-none"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 relative">
                      <Label className="text-gray-300">Password</Label>
                      <div className="relative">
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-black/30 border-cyan-500/30 text-white focus:border-cyan-500 transition-colors relative z-10"
                        />
                        <motion.div 
                          className="absolute inset-0 border border-cyan-500/50 rounded-md pointer-events-none"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    <HolographicButton 
                      onClick={() => handleSubmit()}
                      className="w-full bg-cyan-500 text-black hover:bg-cyan-400 transition-colors"
                    >
                      {isLogin ? 'Login' : 'Create Account'}
                    </HolographicButton>

                    <p className="text-center text-gray-400">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        {isLogin ? 'Sign up' : 'Login'}
                      </button>
                    </p>
                  </form>
                </HolographicCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent"
          >
            Powerful Features for Your Financial Success
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <HolographicCard className="h-full">
                  <div className="p-6 space-y-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </HolographicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-black to-black/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-4xl lg:text-6xl font-bold text-cyan-500">300M+</p>
              <p className="text-gray-400 mt-2">Students Worldwide</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <p className="text-4xl lg:text-6xl font-bold text-cyan-500">$2T+</p>
              <p className="text-gray-400 mt-2">Student Loan Debt</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <p className="text-4xl lg:text-6xl font-bold text-cyan-500">24/7</p>
              <p className="text-gray-400 mt-2">AI Support</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-cyan-500/20">
        <div className="container mx-auto text-center text-gray-400">
          <p>© 2024 SmartFinance.AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

