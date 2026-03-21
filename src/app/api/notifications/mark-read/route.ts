import { NextResponse } from 'next/server';
import { markNotificationsAsRead } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const result = markNotificationsAsRead(userId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
