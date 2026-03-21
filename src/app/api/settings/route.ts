import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';
import { withAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAdmin(async () => {
    const settings = getSettings();
    return NextResponse.json({
      telegramBotToken: settings.telegramBotToken 
        ? '••••••••' + settings.telegramBotToken.slice(-4)
        : '',
      telegramChatId: settings.telegramChatId || '',
      hasToken: !!settings.telegramBotToken
    });
  }, request);
}

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { telegramBotToken, telegramChatId } = await req.json();
      const result = updateSettings(telegramBotToken, telegramChatId);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno al guardar ajustes' }, { status: 500 });
    }
  }, request);
}
