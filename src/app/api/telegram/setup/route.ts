import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/db';
import { withAdmin } from '@/lib/auth';
import { headers } from 'next/headers';
import { getWebhookSecret } from '../webhook/route';

export const dynamic = 'force-dynamic';

// Register the webhook URL with Telegram Bot API
export async function POST(request: Request) {
  return withAdmin(async () => {
    try {
      const settings = getSettings();
      if (!settings.telegramBotToken) {
        return NextResponse.json({ error: 'Bot Token no configurado' }, { status: 400 });
      }

      // Derive the webhook URL from the manual setting or the request host
      const headersList = await headers();
      const host = headersList.get('host') || '';
      const protocol = headersList.get('x-forwarded-proto') || 'https';
      
      const webhookUrl = settings.telegramWebhookUrl || `${protocol}://${host}/api/telegram/webhook`;

      // Set the webhook WITH secret_token for authentication
      const res = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: webhookUrl,
          allowed_updates: ['message'],
          secret_token: getWebhookSecret(),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        return NextResponse.json({ 
          success: true, 
          message: `Webhook activado: ${webhookUrl}`,
          webhookUrl 
        });
      } else {
        return NextResponse.json({ 
          error: `Telegram error: ${data.description}` 
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Error al configurar webhook' }, { status: 500 });
    }
  }, request);
}

// Remove the webhook (deactivate interactive bot)
export async function DELETE(request: Request) {
  return withAdmin(async () => {
    try {
      const settings = getSettings();
      if (!settings.telegramBotToken) {
        return NextResponse.json({ error: 'Bot Token no configurado' }, { status: 400 });
      }

      const res = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/deleteWebhook`);
      const data = await res.json();

      return NextResponse.json({ 
        success: data.ok, 
        message: data.ok ? 'Webhook desactivado' : data.description 
      });
    } catch (error) {
      return NextResponse.json({ error: 'Error al desactivar webhook' }, { status: 500 });
    }
  }, request);
}
