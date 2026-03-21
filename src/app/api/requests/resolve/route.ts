import { NextResponse } from 'next/server';
import { resolveRequest } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { reqId } = await request.json();
    if (!reqId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const result = resolveRequest(reqId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
