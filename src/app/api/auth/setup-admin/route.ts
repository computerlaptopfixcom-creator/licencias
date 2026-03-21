import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { withAuth, signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  return withAuth(async (user, req) => {
    try {
      const { newName, newPassword } = await req.json();

      if (!newName || !newPassword) {
        return NextResponse.json({ error: 'Nombre y contraseña requeridos' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
      }

      const db = getDb();
      const dbUser = db.users.find((u: any) => u.id === user.userId);

      if (!dbUser) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      // Check if new name is already taken (excluding current user)
      const nameExists = db.users.find((u: any) => u.name.toLowerCase() === newName.toLowerCase() && u.id !== user.userId);
      if (nameExists) {
        return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
      }

      // Update credentials
      dbUser.name = newName;
      dbUser.password = await bcrypt.hash(newPassword, 10);
      dbUser.mustChangeCredentials = false;
      
      saveDb(db);

      // Create a fresh token reflecting the changes
      const newToken = signToken({ 
        userId: dbUser.id, 
        role: dbUser.role, 
        name: dbUser.name,
        mustChangeCredentials: false
      });

      const { password: _, ...safeUser } = dbUser;
      const response = NextResponse.json({ 
        success: true, 
        user: { ...safeUser, mustChangeCredentials: false } 
      });
      
      setAuthCookie(response, newToken);
      return response;

    } catch (error) {
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
    }
  }, request);
}
