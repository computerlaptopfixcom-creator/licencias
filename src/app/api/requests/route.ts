import { NextResponse } from 'next/server';
import { getRequests, createRequest } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async (authUser) => {
    let requests = getRequests() as Array<{ userId: string }>;

    if (authUser.role !== 'admin') {
      requests = requests.filter((r: { userId: string }) => r.userId === authUser.userId);
    }

    return NextResponse.json(requests);
  }, request);
}

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { product, count, priority, note } = await req.json();
      if (!product) {
        return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
      }

      const result = createRequest(authUser.userId, product, count || 1, priority || 'normal', note || '');
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}

