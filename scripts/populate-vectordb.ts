import { Ai } from '@cloudflare/ai'
import financialData from '../data/financial-aid.json'

export interface Env {
  AI: Ai;
  VECTORIZE: any;
  FINANCIAL_DATA: any;
}

type ScholarshipData = {
  id: string;
  type: 'scholarship';
  name: string;
  amount: number;
  country: string;
  criteria: string;
  deadline: string;
  searchText: string;
}

type GrantData = {
  id: string;
  type: 'grant';
  program: string;
  maxAmount: number;
  eligibility: string;
  country: string;
  searchText: string;
}

type InvestmentData = {
  id: string;
  type: 'investment';
  riskLevel: string;
  minAmount: number;
  description: string;
  studentFriendly: boolean;
  searchText: string;
}

type CostOfLivingData = {
  id: string;
  type: 'cost-of-living';
  country: string;
  city: string;
  averageRent: number;
  monthlyExpenses: number;
  studentDiscounts: string[];
  searchText: string;
}

type FinancialData = ScholarshipData | GrantData | InvestmentData | CostOfLivingData;

async function populateVectorDB(env: Env) {
  const ai = new Ai(env.AI)
  let successCount = 0;
  let errorCount = 0;
  
  const allData = [
    ...financialData.scholarships.map(s => ({
      ...s,
      type: 'scholarship' as const,
      searchText: `${s.name} ${s.criteria} ${s.country}`
    })),
    ...financialData.grants.map(g => ({
      ...g,
      type: 'grant' as const,
      searchText: `${g.program} ${g.eligibility} ${g.country}`
    })),
    ...financialData.investmentStrategies.map(i => ({
      ...i,
      type: 'investment' as const,
      searchText: `${i.type} ${i.description} risk:${i.riskLevel}`
    })),
    ...financialData.costOfLiving.map(c => ({
      ...c,
      type: 'cost-of-living' as const,
      searchText: `${c.country} ${c.city} living expenses student`
    }))
  ] as FinancialData[];
  
  for (const data of allData) {
    try {
      console.log(`Processing data for ID: ${data.id}`);
      console.log('Search text:', data.searchText);

      // Generate embeddings
      const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: [data.searchText]
      });

      if (!embedding?.data?.[0]) {
        throw new Error('Invalid embedding response');
      }

      console.log('Generated embedding dimensions:', embedding.data[0].length);

      // Store in vector database
      await env.VECTORIZE.upsert([{
        id: data.id,
        values: Array.from(embedding.data[0]),
        metadata: data
      }]);

      // Store full data in KV
      await env.FINANCIAL_DATA.put(data.id, JSON.stringify(data))

      successCount++;
      console.log(`Successfully processed data for ID: ${data.id}`);
    } catch (error) {
      errorCount++;
      console.error(`Failed to process data for ID: ${data.id}`, error);
      console.log('Data being processed:', JSON.stringify(data, null, 2));
    }
  }
  
  return { successCount, errorCount };
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      const result = await populateVectorDB(env);
      return new Response(JSON.stringify({
        message: 'Vector DB population completed',
        ...result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in populate script:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to populate DB',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
} 