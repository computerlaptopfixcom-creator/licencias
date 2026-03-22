import { NextResponse } from 'next/server';
import { getRequests, createRequest } from '@/lib/db';
import { withAuth, withAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async (authUser) => {
    let requests = getRequests();
    
    // Si no es admin, solo ver sus propias solicitudes
    if (authUser.role !== 'admin') {
      requests = requests.filter((r: any) => r.userId === authUser.userId);
    }
    
    return NextResponse.json(requests);
  }, request);
}

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { product, count } = await req.json();
      if (!product) {
        return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
      }
      // Use the authenticated user's ID — prevent requesting as another user
      const result = createRequest(authUser.userId, product, count || 1);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}
