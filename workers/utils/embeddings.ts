import { Ai } from '@cloudflare/ai'

export async function getEmbedding(ai: Ai, text: string): Promise<number[]> {
  try {
    const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [text]
    });

    if (!result?.data?.[0]) {
      console.error('Invalid embedding response:', result);
      throw new Error('Invalid embedding response');
    }

    // Log the embedding dimensions for debugging
    console.log('Embedding dimensions:', result.data[0].length);
    
    return result.data[0];
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Add a dummy export to ensure the module is not empty
export const __esModule = true 