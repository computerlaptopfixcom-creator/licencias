import { NextResponse } from 'next/server';
import { replaceFailedLicense } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { licenseId } = await req.json();
      if (!licenseId) {
        return NextResponse.json({ error: 'ID de licencia requerido' }, { status: 400 });
      }

      const result = replaceFailedLicense(licenseId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Error al reemplazar' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Licencia reemplazada exitosamente' });
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
    }
  }, request);
}
