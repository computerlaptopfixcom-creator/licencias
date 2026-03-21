import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { productName, userId } = await request.json();
    
    const db = getDb();
    const available = db.licenses.find((l: any) => l.product === productName && l.status === 'available');
    
    if (!available) {
      return NextResponse.json({ error: 'No hay stock' }, { status: 404 });
    }

    available.status = 'assigned';
    available.assignedTo = userId;
    saveDb(db);

    return NextResponse.json(available);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
