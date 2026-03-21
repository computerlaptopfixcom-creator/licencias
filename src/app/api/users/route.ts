import { NextResponse } from 'next/server';
import { getUsers, addUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getUsers();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }
    const newUser = addUser(name, email, password, role || 'user');
    if (!newUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese nombre o correo' }, { status: 409 });
    }
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
