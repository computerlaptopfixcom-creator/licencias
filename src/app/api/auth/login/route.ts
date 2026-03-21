import { NextResponse } from 'next/server';
import { findUser, getDb, saveDb } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();
    
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const user = findUser(identifier);
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Support both legacy plain-text and bcrypt hashed passwords
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Bcrypt hash
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text — migrate to hash on successful login
      passwordMatch = user.password === password;
      if (passwordMatch) {
        const db = getDb();
        const dbUser = db.users.find((u: any) => u.id === user.id);
        if (dbUser) {
          dbUser.password = await bcrypt.hash(password, 10);
          saveDb(db);
        }
      }
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;
    
    // Sign JWT and set httpOnly cookie
    const token = signToken({ userId: user.id, role: user.role, name: user.name });
    const response = NextResponse.json(safeUser);
    setAuthCookie(response, token);
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
