import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Search, Send, Sparkles, Trash2 } from "lucide-react";
import {
  getAgentAdvice,
  type AgentAdviceResponse,
} from "@/lib/financial-client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  modelUsed?: string;
};

interface AIAdvisorProps {
  userData: {
    monthlyIncome: number;
    monthlyExpenses: number;
    country: string;
  };
}

const CHAT_STORAGE_KEY = "burryai:advisor:chat:v2";

const START_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I am BurryAI. Ask anything about budgeting, debt, spending, and savings.",
  timestamp: new Date(),
  modelUsed: "system",
};

const QUICK_PROMPTS = [
  "Analyze my spending breakdown",
  "How can I save more monthly?",
  "Build me a debt payoff plan",
  "Compare income vs expenses",
];

const AGENT_STEPS = [
  "Understanding request",
  "Searching financial context",
  "Reasoning on your data",
  "Drafting response",
];

export function AIAdvisor({ userData }: AIAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([START_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentStep, setAgentStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<
        Omit<Message, "timestamp"> & { timestamp: string }
      >;
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      setMessages(
        parsed.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      );
    } catch {
      // ignore malformed cache
    }
  }, []);

  useEffect(() => {
    const payload = messages.map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      setAgentStep(0);
      return;
    }
    const id = window.setInterval(() => {
      setAgentStep((s) => (s + 1) % AGENT_STEPS.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, [isLoading]);

  function resetChat() {
    const fresh = { ...START_MESSAGE, timestamp: new Date() };
    setMessages([fresh]);
    setInputMessage("");
    localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const agent: AgentAdviceResponse = await getAgentAdvice(text);
      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: agent.response,
        timestamp: new Date(),
        modelUsed: agent.model_used,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unable to generate advice now.";
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          content: msg,
          timestamp: new Date(),
          modelUsed: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl">
        <div className="h-[calc(100vh-11rem)] min-h-[620px] rounded-2xl border border-slate-800 bg-[#020617]/95 shadow-[0_20px_60px_rgba(2,6,23,0.55)] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30">
                <Bot className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-slate-100 font-semibold">BurryAI Advisor</h3>
                <p className="text-xs text-slate-400">
                  Monthly income ${userData.monthlyIncome.toLocaleString()} • Expenses $
                  {userData.monthlyExpenses.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-300">
                <Sparkles className="h-3 w-3" />
                AI Agent
              </div>
              <button
                type="button"
                onClick={resetChat}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="border-b border-slate-800 bg-slate-950/60 px-5 py-2 text-xs text-cyan-200 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 animate-pulse" />
              {AGENT_STEPS[agentStep]}
            </div>
          ) : null}

          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                    message.role === "assistant"
                      ? "bg-slate-900 border border-slate-800 text-slate-100"
                      : "bg-gradient-to-br from-cyan-400 to-cyan-300 text-slate-950"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="mt-2 text-[11px] opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-900 border border-cyan-500/20 px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                  Agent is working...
                </div>
              </div>
            ) : null}

            <div ref={chatEndRef} />
          </div>

          {messages.length <= 2 ? (
            <div className="border-t border-slate-800 bg-slate-950/80 px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    disabled={isLoading}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/15 disabled:opacity-40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-800 bg-slate-950/90 p-4">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask about budgeting, savings, debt, or spending..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 text-slate-950 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

