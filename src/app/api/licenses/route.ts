import { NextResponse } from 'next/server';
import { getLicenses } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async () => {
    try {
      const licenses = getLicenses();
      return NextResponse.json(licenses);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
