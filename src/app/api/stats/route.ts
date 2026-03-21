import { NextResponse } from 'next/server';
import { getInventoryStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = getInventoryStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
