import { NextResponse } from 'next/server';
import { getDb, addLicense } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.licenses);
}

export async function POST(request: Request) {
  try {
    const { product, key } = await request.json();
    if (!product || !key) {
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
    }
    const newLicense = addLicense(product, key);
    return NextResponse.json(newLicense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
