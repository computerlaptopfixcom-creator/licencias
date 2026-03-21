import { NextResponse } from 'next/server';
import { getRequests, createRequest } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const requests = getRequests();
  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  try {
    const { userId, product, count } = await request.json();
    if (!userId || !product) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const result = createRequest(userId, product, count || 1);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
