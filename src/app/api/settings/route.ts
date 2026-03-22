import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';
import { withAuth, withAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async (authUser) => {
    const settings = getSettings();
    
    // Si es admin, mostrar todo (con token ofuscado)
    if (authUser.role === 'admin') {
      return NextResponse.json({
        ...settings,
        telegramBotToken: settings.telegramBotToken 
          ? '••••••••' + settings.telegramBotToken.slice(-4)
          : '',
        hasToken: !!settings.telegramBotToken
      });
    }

    // Si es usuario, solo mostrar branding público
    return NextResponse.json({
      brandName: settings.brandName || 'Micro Licenses',
      primaryColor: settings.primaryColor || '#3b82f6',
      appDescription: settings.appDescription || 'Gestiona y adquiere tus llaves de software premium',
      logoType: settings.logoType || 'ShieldCheck',
    });
  }, request);
}

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const data = await req.json();
      const result = updateSettings(data);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno al guardar ajustes' }, { status: 500 });
    }
  }, request);
}
