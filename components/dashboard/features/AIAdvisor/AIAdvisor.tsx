import { useState, useEffect } from 'react'
import { HolographicCard } from '@/components/dashboard/HolographicUI'
import { Bot, Send, AlertTriangle, PiggyBank, DollarSign, TrendingUp } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reaction?: '👍' | '👎' | null;
  visualData?: {
    type: 'line' | 'bar' | 'doughnut' | null;
    data?: any;
  };
}

interface ChatResponse {
  response: string;
}

interface AIAdvisorProps {
  userData: {
    monthlyIncome: number;
    monthlyExpenses: number;
    country: string;
  }
}

// Add interface for Gemini API response
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export function AIAdvisor({ userData }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Financial Advisor. Ask me anything about your finances, loans, or budgeting.",
      timestamp: new Date(),
      visualData: {
        type: null,
        data: null
      }
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  // Add useEffect to scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      const chatContainer = document.getElementById('chat-messages');
      const messagesContainer = document.getElementById('messages-container');
      if (chatContainer && messagesContainer) {
        chatContainer.scrollTop = messagesContainer.scrollHeight;
      }
    };

    scrollToBottom();
    // Add a slight delay to handle any dynamic content
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Function to detect if query might need visualization
  const detectVisualizationType = (query: string): 'line' | 'bar' | 'doughnut' | null => {
    const keywords = {
      line: ['trend', 'over time', 'timeline', 'progress', 'forecast', 'prediction'],
      bar: ['compare', 'comparison', 'difference', 'versus', 'breakdown'],
      doughnut: ['distribution', 'allocation', 'split', 'ratio', 'percentage']
    }

    for (const [type, words] of Object.entries(keywords)) {
      if (words.some(word => query.toLowerCase().includes(word))) {
        return type as 'line' | 'bar' | 'doughnut'
      }
    }
    return null
  }

  // Generate sample visualization data based on query type
  const generateVisualizationData = (type: 'line' | 'bar' | 'doughnut', query: string) => {
    switch (type) {
      case 'line':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Projected Savings',
            data: Array(6).fill(0).map(() => Math.random() * userData.monthlyIncome),
            borderColor: 'rgba(6, 182, 212, 1)',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            fill: true
          }]
        }
      case 'bar':
        return {
          labels: ['Income', 'Expenses', 'Savings'],
          datasets: [{
            data: [
              userData.monthlyIncome,
              userData.monthlyExpenses,
              userData.monthlyIncome - userData.monthlyExpenses
            ],
            backgroundColor: [
              'rgba(6, 182, 212, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(34, 197, 94, 0.8)'
            ]
          }]
        }
      case 'doughnut':
        return {
          labels: ['Essential', 'Non-Essential', 'Savings'],
          datasets: [{
            data: [60, 25, 15],
            backgroundColor: [
              'rgba(6, 182, 212, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(34, 197, 94, 0.8)'
            ]
          }]
        }
      default:
        return null
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const visualType = detectVisualizationType(inputMessage)
    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      visualData: {
        type: visualType,
        data: visualType ? generateVisualizationData(visualType, inputMessage) : null
      }
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setSelectedMessage(userMessage)

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyC02ExBGWIFc7T4tcPAogisEtjLtdOg7EE`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `As an AI financial advisor for students, analyze this situation:
                - Monthly Income: $${userData.monthlyIncome}
                - Monthly Expenses: $${userData.monthlyExpenses}
                - Country: ${userData.country}
                
                User Question: ${inputMessage}
                
                Provide specific, actionable advice in plain text. Focus on student-specific financial aid, scholarships, grants, and cost-saving strategies.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      })

      if (!response.ok) throw new Error('Failed to get response')
      
      const data = await response.json() as GeminiResponse
      
      // Extract the text response from Gemini's response format
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.'
      
      const aiMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        visualData: userMessage.visualData // Keep the same visualization for context
      }

      setMessages(prev => [...prev, aiMessage])
      setSelectedMessage(aiMessage)
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: new Date(),
        visualData: { type: null, data: null }
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex w-full gap-6 max-h-[80vh] min-h-[600px]">
      <HolographicCard className="w-1/2 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-800 bg-black/30">
          <Bot className="w-6 h-6 text-cyan-500" />
          <h3 className="text-xl font-bold">AI Financial Advisor</h3>
        </div>

        {/* Messages Container */}
        <div 
          id="chat-messages"
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
        >
          <div 
            id="messages-container"
            className="space-y-4 p-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                onClick={() => setSelectedMessage(message)}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                    message.role === 'assistant'
                      ? 'bg-gray-800 text-white'
                      : 'bg-cyan-500 text-white'
                  } ${selectedMessage === message ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  <p className="whitespace-pre-wrap font-sans">{message.content}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-.3s]" />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-.5s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-black/30">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about your finances..."
              className="flex-grow bg-gray-900 border-gray-700"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </HolographicCard>

      {/* Visualization Panel - Right Half */}
      <HolographicCard className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-cyan-500" />
          <h3 className="text-xl font-bold">Visual Insights</h3>
        </div>

        <div className="flex-grow flex items-center justify-center p-4">
          {selectedMessage?.visualData?.type ? (
            <div className="w-full h-full">
              {selectedMessage.visualData.type === 'line' && (
                <Line
                  data={selectedMessage.visualData.data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                      },
                      x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                      }
                    }
                  }}
                />
              )}
              {selectedMessage.visualData.type === 'bar' && (
                <Bar
                  data={selectedMessage.visualData.data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                      },
                      x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                      }
                    }
                  }}
                />
              )}
              {selectedMessage.visualData.type === 'doughnut' && (
                <Doughnut
                  data={selectedMessage.visualData.data}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: 'white' }
                      }
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-cyan-500/50" />
              <p>No visualization available for this query.</p>
              <p className="text-sm mt-2">Try asking about trends, comparisons, or distributions.</p>
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <p className="text-sm text-cyan-500">Example queries:</p>
                <p className="text-sm">"Show me the trend of my savings over time"</p>
                <p className="text-sm">"Compare my income and expenses"</p>
                <p className="text-sm">"What's the distribution of my monthly spending?"</p>
              </div>
            </div>
          )}
        </div>
      </HolographicCard>
    </div>
  )
} 