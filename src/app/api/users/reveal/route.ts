import { NextResponse } from 'next/server';
import { revealLicense } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { licenseId } = await req.json();
      
      if (!licenseId) {
        return NextResponse.json({ error: 'Datos de revelado inválidos' }, { status: 400 });
      }

      // Use the authenticated user's ID from token — prevents revealing other users' licenses
      const result = revealLicense(authUser.userId, licenseId);
      
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Error interno al revelar licencia' }, { status: 500 });
    }
  }, request);
}
