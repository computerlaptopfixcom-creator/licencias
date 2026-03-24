import { NextResponse } from 'next/server';
import { getDb, getSettings, getLicenses, getUsers } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Stable webhook secret derived from JWT_SECRET or a fallback
function getWebhookSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) {
    return crypto.createHash('sha256').update(configuredSecret).digest('hex').slice(0, 32);
  }

  if (process.env.NODE_ENV === 'production') {
    if (!(globalThis as any)._ephemeralWebhookSecret) {
      console.warn("⚠️ Advertencia: No se detectó JWT_SECRET en producción. Usando secreto de webhook efímero (tendrás que re-conectar el bot si el servidor se reinicia).");
      (globalThis as any)._ephemeralWebhookSecret = crypto.randomBytes(32).toString('hex');
    }
    return (globalThis as any)._ephemeralWebhookSecret;
  }

  return crypto
    .createHash('sha256')
    .update(`dev-webhook-secret:${process.cwd()}`)
    .digest('hex')
    .slice(0, 32);
}

// Export the secret getter so the setup endpoint can use it
export { getWebhookSecret };

// Telegram Bot Webhook — handles incoming messages and commands
export async function POST(request: Request) {
  try {
    // ── Authenticate: verify the secret token header ──
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
    if (secretHeader !== getWebhookSecret()) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    const update = await request.json();
    const message = update?.message;

    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const settings = getSettings();
    if (!settings.telegramBotToken) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    if (!settings.telegramChatId || chatId.toString() !== settings.telegramChatId.toString()) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const command = message.text.trim().toLowerCase();
    let responseText = '';

    switch (command) {
      case '/start':
        responseText = [
          `🤖 <b>¡Bienvenido al Bot de ${settings.brandName || 'Micro Licenses'}!</b>`,
          '',
          '📋 <b>Comandos disponibles:</b>',
          '/stock — 📦 Ver inventario disponible',
          '/stats — 📊 Estadísticas generales',
          '/requests — 📩 Solicitudes pendientes',
          '/users — 👥 Usuarios registrados',
          '/help — ❓ Mostrar esta ayuda',
        ].join('\n');
        break;

      case '/help':
        responseText = [
          '❓ <b>AYUDA</b>',
          '',
          '/stock — Muestra las llaves disponibles por producto',
          '/stats — Resumen de licencias, usuarios y solicitudes',
          '/requests — Lista las solicitudes pendientes',
          '/users — Lista de usuarios y sus roles',
        ].join('\n');
        break;

      case '/stock': {
        const licenses = getLicenses();
        const available = licenses.filter((l: any) => l.status === 'available');
        const productCounts: Record<string, number> = {};
        available.forEach((l: any) => {
          productCounts[l.product] = (productCounts[l.product] || 0) + 1;
        });

        if (Object.keys(productCounts).length === 0) {
          responseText = '📦 <b>INVENTARIO</b>\n\n⚠️ No hay llaves disponibles en este momento.';
        } else {
          const lines = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => `  • <b>${name}</b>: ${count} disponible(s)`);
          responseText = [
            `📦 <b>INVENTARIO</b> (${available.length} total)`,
            '',
            ...lines,
          ].join('\n');
        }
        break;
      }

      case '/stats': {
        const db = getDb();
        const licenses = db.licenses || [];
        const users = db.users || [];
        const requests = db.requests || [];

        const totalLicenses = licenses.length;
        const availableCount = licenses.filter((l: any) => l.status === 'available').length;
        const assignedCount = licenses.filter((l: any) => l.status === 'assigned').length;
        const revealedCount = licenses.filter((l: any) => l.status === 'revealed').length;
        const failedCount = licenses.filter((l: any) => l.status === 'failed').length;
        const pendingReqs = requests.filter((r: any) => r.status === 'pending').length;

        responseText = [
          '📊 <b>ESTADÍSTICAS</b>',
          '',
          `👥 Usuarios: <b>${users.length}</b>`,
          `🔑 Licencias totales: <b>${totalLicenses}</b>`,
          `  ✅ Disponibles: <b>${availableCount}</b>`,
          `  📋 Asignadas: <b>${assignedCount}</b>`,
          `  👁️ Reveladas: <b>${revealedCount}</b>`,
          `  ❌ Fallidas: <b>${failedCount}</b>`,
          `📩 Solicitudes pendientes: <b>${pendingReqs}</b>`,
        ].join('\n');
        break;
      }

      case '/requests': {
        const db = getDb();
        const pending = (db.requests || []).filter((r: any) => r.status === 'pending');

        if (pending.length === 0) {
          responseText = '📩 <b>SOLICITUDES</b>\n\n✅ No hay solicitudes pendientes.';
        } else {
          const lines = pending.slice(0, 10).map((r: any) => {
            const user = db.users.find((u: any) => u.id === r.userId);
            return `  • <b>${user?.name || 'Desconocido'}</b>: ${r.count}x ${r.product}`;
          });
          responseText = [
            `📩 <b>SOLICITUDES PENDIENTES</b> (${pending.length})`,
            '',
            ...lines,
            pending.length > 10 ? `\n... y ${pending.length - 10} más` : '',
          ].join('\n');
        }
        break;
      }

      case '/users': {
        const users = getUsers();
        if (users.length === 0) {
          responseText = '👥 <b>USUARIOS</b>\n\nNo hay usuarios registrados.';
        } else {
          const lines = users.slice(0, 15).map((u: any) =>
            `  • <b>${u.name}</b> (${u.role}) — ${u.email || 'sin email'}`
          );
          responseText = [
            `👥 <b>USUARIOS</b> (${users.length})`,
            '',
            ...lines,
            users.length > 15 ? `\n... y ${users.length - 15} más` : '',
          ].join('\n');
        }
        break;
      }

      default:
        responseText = [
          '🤔 No entiendo ese comando.',
          '',
          'Prueba con /help para ver los comandos disponibles.',
        ].join('\n');
        break;
    }

    // Reply to the chat
    await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseText,
        parse_mode: 'HTML',
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram 
  }
}
