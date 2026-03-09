import { NextResponse } from 'next/server';

const WORKER_API_BASE_URL =
  process.env.WORKER_API_BASE_URL ||
  process.env.NEXT_PUBLIC_WORKER_API_BASE_URL ||
  'http://127.0.0.1:8787';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    const body = await request.json();

    const response = await fetch(`${WORKER_API_BASE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || ''
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
} 
