import { NextResponse } from 'next/server';
import { claimOneLicense } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { product } = await req.json();
      
      if (!product) {
        return NextResponse.json({ error: 'Datos de reclamo inválidos' }, { status: 400 });
      }

      // Use the authenticated user's ID — prevent claiming for other users
      const result = claimOneLicense(authUser.userId, product);
      
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Error interno en reclamo' }, { status: 500 });
    }
  }, request);
}
