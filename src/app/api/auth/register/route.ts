import { NextResponse } from 'next/server';
import { addUser, findUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    if (findUser(email)) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const newUser = addUser(name, email);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
