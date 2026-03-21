import { NextResponse } from 'next/server';
import { claimOneLicense } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, product } = await request.json();
    
    if (!userId || !product) {
      return NextResponse.json({ error: 'Datos de reclamo inválidos' }, { status: 400 });
    }

    const result = claimOneLicense(userId, product);
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Error interno en reclamo' }, { status: 500 });
  }
}
