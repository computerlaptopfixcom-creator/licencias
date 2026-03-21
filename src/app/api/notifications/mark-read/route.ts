import { NextResponse } from 'next/server';
import { markNotificationsAsRead } from '@/lib/db';
import { withAuth } from '@/lib/auth';

export async function POST(request: Request) {
  return withAuth(async (authUser) => {
    try {
      // Users can only mark their own notifications as read
      const result = markNotificationsAsRead(authUser.role === 'admin' ? 'admin' : authUser.userId);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
  }, request);
}
