import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(request: Request) {
  try {
    const { telegramBotToken, telegramChatId } = await request.json();
    const result = updateSettings(telegramBotToken, telegramChatId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno al guardar ajustes' }, { status: 500 });
  }
}
