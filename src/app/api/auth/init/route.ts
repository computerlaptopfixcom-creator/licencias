import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Check if system needs initial setup (no users exist)
export async function GET() {
  const db = getDb();
  return NextResponse.json({ needsSetup: db.users.length === 0 });
}

// POST: Create the first admin account (only works when zero users exist)
export async function POST(request: Request) {
  try {
    const db = getDb();

    // Security: only allow when no users exist
    if (db.users.length > 0) {
      return NextResponse.json(
        { error: 'El sistema ya fue configurado. Usa el login normal.' },
        { status: 403 }
      );
    }

    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ error: 'Nombre y contraseña son requeridos' }, { status: 400 });
    }

    if (name.trim().length < 3) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }

    const adminUser = {
      id: `u_${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: '',
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      mustChangeCredentials: false,
      createdAt: new Date().toISOString()
    };

    db.users.push(adminUser);
    saveDb(db);

    // Auto-login the new admin
    const token = signToken({
      userId: adminUser.id,
      role: 'admin',
      name: adminUser.name,
      mustChangeCredentials: false
    });

    const { password: _, ...safeUser } = adminUser;
    const response = NextResponse.json({ success: true, user: safeUser });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error al configurar el sistema' }, { status: 500 });
  }
}
