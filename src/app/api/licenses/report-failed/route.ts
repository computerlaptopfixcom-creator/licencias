import { NextResponse } from 'next/server';
import { reportFailedLicense } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { licenseId } = await req.json();
      if (!licenseId) {
        return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
      }
      // Use auth user's ID — prevents reporting failures for other users
      const result = reportFailedLicense(authUser.userId, licenseId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    } catch (e) {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}
