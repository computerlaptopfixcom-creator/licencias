import { NextResponse } from 'next/server';
import { assignLicensesBatch } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { userId, product, count } = await req.json();
      
      if (!userId || !product || !count || count <= 0) {
        return NextResponse.json({ error: 'Datos de asignación inválidos' }, { status: 400 });
      }

      const result = assignLicensesBatch(userId, product, count);
      
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Error interno en asignación masiva' }, { status: 500 });
    }
  }, request);
}
