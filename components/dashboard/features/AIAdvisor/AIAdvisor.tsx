import { useEffect, useState } from "react"
import { HolographicCard } from "@/components/dashboard/HolographicUI"
import { Bot, AlertTriangle, Send, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { getAgentAdvice } from "@/lib/financial-client"

type ChartType = "line" | "bar" | "doughnut" | null

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  modelUsed?: string
  visualData: {
    type: ChartType
    data: unknown
  }
}

interface AIAdvisorProps {
  userData: {
    monthlyIncome: number
    monthlyExpenses: number
    country: string
  }
}

function detectVisualizationType(query: string): ChartType {
  const normalized = query.toLowerCase()

  const rules: Array<{ type: Exclude<ChartType, null>; keywords: string[] }> = [
    {
      type: "line",
      keywords: ["trend", "over time", "timeline", "progress", "forecast", "projection"]
    },
    {
      type: "bar",
      keywords: ["compare", "comparison", "difference", "versus", "breakdown"]
    },
    {
      type: "doughnut",
      keywords: ["distribution", "allocation", "split", "ratio", "percentage"]
    }
  ]

  for (const rule of rules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.type
    }
  }

  return null
}

function generateVisualizationData(type: Exclude<ChartType, null>, userData: AIAdvisorProps["userData"]) {
  const monthlyNet = Math.max(userData.monthlyIncome - userData.monthlyExpenses, 0)

  if (type === "line") {
    const points = Array.from({ length: 6 }, (_, index) => Math.round(monthlyNet * (index + 1)))
    return {
      labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
      datasets: [
        {
          label: "Projected Savings",
          data: points,
          borderColor: "rgba(34, 211, 238, 1)",
          backgroundColor: "rgba(34, 211, 238, 0.2)",
          fill: true,
          tension: 0.35
        }
      ]
    }
  }

  if (type === "bar") {
    return {
      labels: ["Income", "Expenses", "Net"],
      datasets: [
        {
          data: [userData.monthlyIncome, userData.monthlyExpenses, monthlyNet],
          backgroundColor: [
            "rgba(34, 211, 238, 0.85)",
            "rgba(244, 63, 94, 0.85)",
            "rgba(16, 185, 129, 0.85)"
          ]
        }
      ]
    }
  }

  const expensesShare = userData.monthlyIncome > 0 ? (userData.monthlyExpenses / userData.monthlyIncome) * 100 : 0
  const savingsShare = Math.max(100 - expensesShare, 0)
  const essential = Math.min(Math.round(expensesShare * 0.7), 100)
  const nonEssential = Math.min(Math.round(expensesShare * 0.3), 100)

  return {
    labels: ["Essential", "Non-Essential", "Savings"],
    datasets: [
      {
        data: [essential, nonEssential, Math.round(savingsShare)],
        backgroundColor: [
          "rgba(56, 189, 248, 0.85)",
          "rgba(251, 113, 133, 0.85)",
          "rgba(52, 211, 153, 0.85)"
        ]
      }
    ]
  }
}

export function AIAdvisor({ userData }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask me about budgeting, debt payoff, savings planning, or income ideas. I will use your backend financial data.",
      timestamp: new Date(),
      modelUsed: "system",
      visualData: {
        type: null,
        data: null
      }
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(messages[0] ?? null)

  useEffect(() => {
    const chatContainer = document.getElementById("chat-messages")
    const messagesContainer = document.getElementById("messages-container")
    if (!chatContainer || !messagesContainer) return

    chatContainer.scrollTop = messagesContainer.scrollHeight
    const timeout = setTimeout(() => {
      chatContainer.scrollTop = messagesContainer.scrollHeight
    }, 100)
    return () => clearTimeout(timeout)
  }, [messages])

  async function sendMessage() {
    const trimmed = inputMessage.trim()
    if (!trimmed || isLoading) return

    const visualType = detectVisualizationType(trimmed)
    const visualData =
      visualType === null ? null : generateVisualizationData(visualType, userData)

    const userMessage: Message = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      visualData: {
        type: visualType,
        data: visualData
      }
    }

    setMessages((previous) => [...previous, userMessage])
    setSelectedMessage(userMessage)
    setInputMessage("")
    setIsLoading(true)

    try {
      const agent = await getAgentAdvice(trimmed)
      const assistantMessage: Message = {
        role: "assistant",
        content: agent.response,
        timestamp: new Date(),
        modelUsed: agent.model_used,
        visualData: userMessage.visualData
      }

      setMessages((previous) => [...previous, assistantMessage])
      setSelectedMessage(assistantMessage)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to generate advice right now."
      const assistantMessage: Message = {
        role: "assistant",
        content: message,
        timestamp: new Date(),
        modelUsed: "error",
        visualData: {
          type: null,
          data: null
        }
      }

      setMessages((previous) => [...previous, assistantMessage])
      setSelectedMessage(assistantMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full gap-6 max-h-[80vh] min-h-[600px]">
      <HolographicCard className="w-1/2 flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 p-4 border-b border-gray-800 bg-black/30">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-500" />
            <h3 className="text-xl font-bold">AI Financial Advisor</h3>
          </div>
          <p className="text-xs text-slate-400">Backend Agent</p>
        </div>

        <div
          id="chat-messages"
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          <div id="messages-container" className="space-y-4 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    message.role === "assistant" ? "bg-gray-800 text-white" : "bg-cyan-500 text-white"
                  } ${selectedMessage === message ? "ring-2 ring-cyan-500" : ""}`}
                >
                  <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                    {message.modelUsed ? ` | ${message.modelUsed}` : ""}
                  </div>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-.5s]" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-black/30">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Ask about your finances..."
              className="flex-grow bg-gray-900 border-gray-700"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </HolographicCard>

      <HolographicCard className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-cyan-500" />
          <h3 className="text-xl font-bold">Visual Insights</h3>
        </div>

        <div className="flex-grow flex items-center justify-center p-4">
          {selectedMessage?.visualData.type === "line" ? (
            <div className="w-full h-full">
              <Line
                data={selectedMessage.visualData.data as never}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                      ticks: { color: "white" }
                    },
                    x: {
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                      ticks: { color: "white" }
                    }
                  }
                }}
              />
            </div>
          ) : null}

          {selectedMessage?.visualData.type === "bar" ? (
            <div className="w-full h-full">
              <Bar
                data={selectedMessage.visualData.data as never}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                      ticks: { color: "white" }
                    },
                    x: {
                      grid: { color: "rgba(255, 255, 255, 0.1)" },
                      ticks: { color: "white" }
                    }
                  }
                }}
              />
            </div>
          ) : null}

          {selectedMessage?.visualData.type === "doughnut" ? (
            <div className="w-full h-full">
              <Doughnut
                data={selectedMessage.visualData.data as never}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: { color: "white" }
                    }
                  }
                }}
              />
            </div>
          ) : null}

          {!selectedMessage?.visualData.type ? (
            <div className="text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-cyan-500/50" />
              <p>No visualization available for this query.</p>
              <p className="text-sm mt-2">Try asking about trends, comparisons, or distributions.</p>
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <p className="text-sm text-cyan-500">Example queries:</p>
                <p className="text-sm">"Show me the trend of my savings over time"</p>
                <p className="text-sm">"Compare my income and expenses"</p>
                <p className="text-sm">"What is the distribution of my monthly spending?"</p>
              </div>
            </div>
          ) : null}
        </div>
      </HolographicCard>
    </div>
  )
}
