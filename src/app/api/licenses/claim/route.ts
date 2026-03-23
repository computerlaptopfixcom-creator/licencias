import { NextResponse } from 'next/server';
import { getDb, assignLicense } from '@/lib/db';
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

      const success = assignLicense(available.id, userId);
      if (!success) {
        return NextResponse.json({ error: 'La licencia acaba de ser tomada por otro usuario.' }, { status: 409 });
      }

      return NextResponse.json({ ...available, status: 'assigned', assignedTo: userId });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
