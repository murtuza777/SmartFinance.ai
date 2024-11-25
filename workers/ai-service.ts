import { Ai } from '@cloudflare/ai'
import { getEmbedding } from './utils/embeddings'
import type { AiTextGenerationOutput } from '@cloudflare/ai/dist/ai/tasks/types/tasks'

// Define types for Cloudflare Workers
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ReadableStream | ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  AI: Ai;
  VECTORIZE: any;
  FINANCIAL_DATA: KVNamespace;
  API_KEY: string;
}

interface FinancialDataset {
  scholarships: Array<{
    id: string;
    name: string;
    amount: number;
    country: string;
    criteria: string;
    deadline: string;
  }>;
  grants: Array<{
    id: string;
    program: string;
    maxAmount: number;
    eligibility: string;
    country: string;
  }>;
  investmentStrategies: Array<{
    id: string;
    type: string;
    riskLevel: string;
    minAmount: number;
    description: string;
    studentFriendly: boolean;
  }>;
  costOfLiving: Array<{
    country: string;
    city: string;
    averageRent: number;
    monthlyExpenses: number;
    studentDiscounts: string[];
  }>;
}

interface RequestBody {
  prompt: string;
  userData: {
    country: string;
    university: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    loanAmount: number;
    userMessage: string;
  };
}

// Add API key validation helper
function validateApiKey(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === env.API_KEY;
}

async function handleRecommendations(request: Request, env: Env) {
  try {
    const body = await request.json() as unknown;
    console.log('Received request body:', body);

    // Type guard for request body
    const isValidRequestBody = (data: unknown): data is RequestBody => {
      if (!data || typeof data !== 'object') return false;
      const obj = data as any;
      return (
        typeof obj.prompt === 'string' &&
        typeof obj.userData === 'object' &&
        obj.userData !== null &&
        typeof obj.userData.country === 'string' &&
        typeof obj.userData.university === 'string' &&
        typeof obj.userData.monthlyIncome === 'number' &&
        typeof obj.userData.monthlyExpenses === 'number' &&
        typeof obj.userData.loanAmount === 'number' &&
        typeof obj.userData.userMessage === 'string'
      );
    };

    if (!isValidRequestBody(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { prompt, userData } = body;

    // Generate embedding for the prompt
    const embedding = await getEmbedding(env.AI, prompt);
    
    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to generate embedding');
    }

    // Query vector database
    const vectorResults = await env.VECTORIZE.query({
      vector: embedding,
      topK: 5,
    });

    // Get relevant data from KV store
    const relevantData = await Promise.all(
      vectorResults.matches.map(async (match: any) => {
        const data = await env.FINANCIAL_DATA.get(match.id, 'json');
        return { ...data, score: match.score };
      })
    );

    // Calculate risk score based on user data
    const riskScore = calculateRiskScore(userData);

    // Get AI completion
    const completion = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ 
        role: 'user', 
        content: `As an AI financial advisor, analyze this student's situation:
          - Country: ${userData.country}
          - University: ${userData.university}
          - Monthly Income: $${userData.monthlyIncome}
          - Monthly Expenses: $${userData.monthlyExpenses}
          - Loan Amount: $${userData.loanAmount}
          
          Question: ${userData.userMessage}
          
          Provide specific, actionable advice for:
          1. Loan Management & Financial Aid
          2. Budget Optimization
          3. Investment Opportunities
          4. Extra Income Sources`
      }]
    }) as { response: string };

    return new Response(JSON.stringify({
      data: {
        recommendations: {
          advice: completion.response,
          relevantData
        },
        metrics: {
          riskScore,
          monthlySavings: userData.monthlyIncome - userData.monthlyExpenses,
          debtToIncomeRatio: (userData.loanAmount / 12) / userData.monthlyIncome,
          savingsPotential: (userData.monthlyIncome - userData.monthlyExpenses) * 0.2
        }
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in handleRecommendations:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to calculate risk score
function calculateRiskScore(userData: RequestBody['userData']): number {
  const debtToIncomeRatio = (userData.loanAmount / 12) / userData.monthlyIncome;
  const savingsRatio = (userData.monthlyIncome - userData.monthlyExpenses) / userData.monthlyIncome;
  
  let riskScore = 50; // Base score

  // Adjust based on debt-to-income ratio
  if (debtToIncomeRatio > 0.43) riskScore += 20;
  else if (debtToIncomeRatio > 0.36) riskScore += 10;
  else if (debtToIncomeRatio < 0.28) riskScore -= 10;

  // Adjust based on savings ratio
  if (savingsRatio < 0.1) riskScore += 15;
  else if (savingsRatio > 0.2) riskScore -= 15;

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, riskScore));
}

// Add CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  }
}

export default {
  async fetch(request: Request, env: Env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...corsHeaders(),
          'Access-Control-Allow-Headers': 'X-API-Key, Content-Type, Access-Control-Allow-Headers'
        }
      });
    }

    // Validate API key for all non-OPTIONS requests
    if (!validateApiKey(request, env)) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid API key' }), {
        status: 401,
        headers: corsHeaders()
      });
    }

    // Add CORS headers to all responses
    const headers = {
      ...corsHeaders(),
      'Content-Type': 'application/json'
    };

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers
      });
    }

    const url = new URL(request.url);
    
    try {
      switch (url.pathname) {
        case '/api/recommendations':
          const response = await handleRecommendations(request, env);
          return new Response(response.body, {
            status: response.status,
            headers: {
              ...headers,
              ...Object.fromEntries(response.headers.entries())
            }
          });
        default:
          return new Response(JSON.stringify({ error: 'Not found' }), { 
            status: 404,
            headers
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers
      });
    }
  }
} 