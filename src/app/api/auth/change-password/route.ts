import { NextResponse } from 'next/server';
import { getDb, updateUserPassword } from '@/lib/db';
import { withAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  return withAuth(async (authUser, req) => {
    try {
      const { currentPassword, newPassword } = await req.json();
      
      if (!newPassword) {
        return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
      }

      const db = getDb();
      const user = db.users.find((u: any) => u.id === authUser.userId);
      
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Verify current password before allowing change
      if (currentPassword) {
        let match = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          match = await bcrypt.compare(currentPassword, user.password);
        } else {
          match = user.password === currentPassword;
        }
        if (!match) {
          return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
        }
      }
      updateUserPassword(user.id, await bcrypt.hash(newPassword, 10));

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
