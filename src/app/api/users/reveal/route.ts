import { NextResponse } from 'next/server';
import { revealLicense } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, licenseId } = await request.json();
    
    if (!userId || !licenseId) {
      return NextResponse.json({ error: 'Datos de revelado inválidos' }, { status: 400 });
    }

    const result = revealLicense(userId, licenseId);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno al revelar licencia' }, { status: 500 });
  }
}
