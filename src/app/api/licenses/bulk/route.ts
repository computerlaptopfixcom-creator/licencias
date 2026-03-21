import { NextResponse } from 'next/server';
import { addLicensesBulk } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

const MAX_KEYS_PER_UPLOAD = 500;

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { product, keys, batchNote } = await req.json();
      
      if (!product || !keys || !Array.isArray(keys) || keys.length === 0) {
        return NextResponse.json({ error: 'Datos de carga inválidos' }, { status: 400 });
      }

      if (keys.length > MAX_KEYS_PER_UPLOAD) {
        return NextResponse.json({ error: `Máximo ${MAX_KEYS_PER_UPLOAD} llaves por carga` }, { status: 400 });
      }

      const result = addLicensesBulk(product, keys, batchNote);
      
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno en carga masiva' }, { status: 500 });
    }
  }, request);
}
