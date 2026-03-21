import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();
    
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
    }

    const db = getDb();
    const user = db.users.find((u: any) => u.id === userId);
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
