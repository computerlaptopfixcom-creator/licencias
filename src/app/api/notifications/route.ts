import { NextResponse } from 'next/server';
import { getNotifications } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const notifs = getNotifications(userId);
    return NextResponse.json(notifs);
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
