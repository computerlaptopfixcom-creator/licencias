import { NextResponse } from 'next/server';
import { previewBulkLicenses } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

const MAX_KEYS_PER_UPLOAD = 500;

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { keys } = await req.json();
      if (!Array.isArray(keys) || keys.length === 0) {
        return NextResponse.json({ error: 'No hay llaves para previsualizar' }, { status: 400 });
      }

      if (keys.length > MAX_KEYS_PER_UPLOAD) {
        return NextResponse.json({ error: `Maximo ${MAX_KEYS_PER_UPLOAD} llaves por carga` }, { status: 400 });
      }

      return NextResponse.json(previewBulkLicenses(keys));
    } catch {
      return NextResponse.json({ error: 'Error interno en previsualizacion' }, { status: 500 });
    }
  }, request);
}

