import { NextResponse } from 'next/server';
import { getLicenses } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async (authUser) => {
    try {
      const allLicenses = getLicenses();

      // Admin sees everything; regular users only see their own
      if (authUser.role === 'admin') {
        return NextResponse.json(allLicenses);
      }

      // Non-admin: filter to only show licenses assigned to this user
      const userLicenses = allLicenses.filter((l: any) => l.assignedTo === authUser.userId);
      return NextResponse.json(userLicenses);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
