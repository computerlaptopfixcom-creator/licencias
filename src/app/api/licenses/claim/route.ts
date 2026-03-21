import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { productName, userId } = await req.json();
      
      const db = getDb();
      const available = db.licenses.find((l: any) => l.product === productName && l.status === 'available');
      
      if (!available) {
        return NextResponse.json({ error: 'No hay stock' }, { status: 404 });
      }

      available.status = 'assigned';
      available.assignedTo = userId;
      available.assignedAt = new Date().toISOString();
      saveDb(db);

      return NextResponse.json(available);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
