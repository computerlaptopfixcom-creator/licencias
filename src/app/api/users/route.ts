import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/db';
import { withAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAdmin(async () => {
    try {
      const users = getUsers();
      return NextResponse.json(users);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { name, email, password } = await req.json();
      if (!name || !password) {
        return NextResponse.json({ error: 'Nombre y contraseña requeridos' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = addUser(name, email, passwordHash);
      if (!newUser) {
        return NextResponse.json({ error: 'Ya existe un usuario con ese nombre o correo' }, { status: 409 });
      }
      const { password: _, ...safeUser } = newUser;
      return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function DELETE(request: Request) {
  return withAdmin(async () => {
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('id');
      if (!userId) {
        return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
      }
      const { deleteUser } = await import('@/lib/db');
      const result = deleteUser(userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
