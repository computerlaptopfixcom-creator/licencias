import { NextResponse } from 'next/server';
import { getMovements } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function GET(request: Request) {
  return withAuth(async (authUser) => {
    try {
      const limit = 50;
      const movements = authUser.role === 'admin'
        ? getMovements(limit)
        : getMovements(limit, authUser.userId);
      return NextResponse.json(movements);
    } catch {
      return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 });
    }
  }, request);
}

