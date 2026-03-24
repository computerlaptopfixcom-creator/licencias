import { NextResponse } from 'next/server';
import { resolveRequest } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { reqId, reviewNote } = await req.json();
      if (!reqId) {
        return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
      }
      const result = resolveRequest(reqId, reviewNote || '');
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}

