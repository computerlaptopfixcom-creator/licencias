import { NextResponse } from 'next/server';
import { getInventoryStats } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async () => {
    try {
      const stats = getInventoryStats();
      return NextResponse.json(stats);
    } catch (error) {
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }
  }, request);
}
