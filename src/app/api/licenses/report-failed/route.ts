import { NextResponse } from 'next/server';
import { reportFailedLicense } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, licenseId } = await request.json();
    if (!userId || !licenseId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }
    const result = reportFailedLicense(userId, licenseId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
