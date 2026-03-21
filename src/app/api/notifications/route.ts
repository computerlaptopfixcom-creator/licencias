import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { userId } = await req.json();
      // Users can only fetch their own notifications; admins can fetch 'admin' notifications
      const targetId = authUser.role === 'admin' && userId === 'admin' ? 'admin' : authUser.userId;
      const notifs = getNotifications(targetId);
      return NextResponse.json(notifs);
    } catch (e) {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}
