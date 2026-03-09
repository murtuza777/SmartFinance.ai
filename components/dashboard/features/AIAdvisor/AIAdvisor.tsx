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

// Gemini API response interface
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
  };
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

    // Use Google Gemini API
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // Validate API key exists
    if (!geminiApiKey || geminiApiKey.trim().length === 0) {
      const errorMessage = `Gemini API key is not configured.

To set up the Gemini API key:
1. Go to https://ai.google.dev/ (Google AI Studio)
2. Sign in with your Google account
3. Click "Get API Key" to create a new API key
4. Copy your API key
5. Create a .env.local file in the project root
6. Add: NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
7. Restart your development server

For more information, visit: https://ai.google.dev/tutorials/setup`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        visualData: { type: null, data: null }
      }]);
      setIsLoading(false);
      return;
    }
    
    // Validate and clean API key
    const cleanedApiKey = geminiApiKey.trim();
    
    try {
      // Debug: Log API key status (masked for security)
      if (cleanedApiKey.length > 12) {
        const keyPrefix = cleanedApiKey.substring(0, 8);
        const keySuffix = cleanedApiKey.substring(cleanedApiKey.length - 4);
        console.log(`Using Gemini API key: ${keyPrefix}...${keySuffix} (length: ${cleanedApiKey.length})`);
      }
      
      // Validate API key format (Gemini keys start with 'AIza' and are typically 39 characters)
      if (cleanedApiKey.length < 20 || !cleanedApiKey.startsWith('AIza')) {
        throw new Error('Invalid API key format. Gemini API keys should start with "AIza" and be at least 20 characters long.');
      }
      
      const requestBody = {
        contents: [{
          parts: [{
            text: `You are an expert AI financial advisor specializing in student finances. Provide specific, actionable advice about financial aid, scholarships, grants, budgeting, and cost-saving strategies for students.

As an AI financial advisor for students, analyze this situation:
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
          maxOutputTokens: 8192, // Increased for Gemini 2.5 Pro (supports up to 65,536)
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      // Try different Gemini model names (newer models first)
      const modelsToTry = [
        'gemini-2.5-pro',      // Latest and most capable - Gemini 2.5 Pro
        'gemini-1.5-pro',      // Fallback to 1.5 Pro
        'gemini-1.5-flash',    // Faster, good for most tasks
        'gemini-pro'           // Fallback to older model
      ];
      
      let lastError: Error | null = null;
      
      for (const model of modelsToTry) {
        try {
          console.log(`Trying Gemini API with model: ${model}`);
          
          const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${cleanedApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          if (response.ok) {
            const data = await response.json() as GeminiResponse
            
            // Check if content was blocked by safety filters
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
              throw new Error('Response was blocked by safety filters. Please try rephrasing your question.');
            }
            
            // Extract the text response from Gemini's response format
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || 'Sorry, I could not generate a response.'
            
            const aiMessage: Message = {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date(),
              visualData: userMessage.visualData
            }

            setMessages(prev => [...prev, aiMessage])
            setSelectedMessage(aiMessage)
            setIsLoading(false)
            return; // Success, exit the function
          } else {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: { message: errorText || `HTTP ${response.status}` } };
            }
            console.warn(`Model ${model} failed:`, errorData);
            lastError = new Error(errorData.error?.message || errorData.message || `API error: ${response.status}`);
            
            // If it's a 404 (model not found), try next model
            if (response.status === 404) {
              continue;
            }
            
            // For other errors, throw immediately
            throw lastError;
          }
        } catch (error) {
          console.warn(`Error with model ${model}:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // If it's a 404 or model not found error, try next model
          if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
            continue;
          }
          
          // For other errors, throw immediately
          throw error;
        }
      }
      
      // If we get here, all models failed
      throw lastError || new Error('All Gemini model attempts failed')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Provide more helpful error messages
      let userFriendlyMessage = 'I apologize, but I encountered an error. Please try again.';
      
      if (errorMessage.includes('Invalid API Key') || errorMessage.includes('invalid_api_key') || errorMessage.includes('API_KEY_INVALID')) {
        userFriendlyMessage = `API authentication failed. The Gemini API key appears to be invalid or expired.

To fix this:
1. Go to https://ai.google.dev/ (Google AI Studio)
2. Sign in with your Google account
3. Click "Get API Key" to create or verify your API key
4. Update the API key in your .env.local file as NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
5. Restart your development server

For more information, visit: https://ai.google.dev/tutorials/setup`;
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userFriendlyMessage = `Authentication error. Please verify your Gemini API key is correct and active.

1. Go to https://ai.google.dev/ (Google AI Studio)
2. Verify your API key is active
3. Check that the key in .env.local matches your Google AI Studio key
4. Restart your development server`;
      } else {
        userFriendlyMessage = `Error: ${errorMessage}. Please check the console for more details.`;
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: userFriendlyMessage,
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