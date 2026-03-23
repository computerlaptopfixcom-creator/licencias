import { NextResponse } from 'next/server';
import { findUser, getDb, updateUserPassword } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// ── Rate Limiting ──────────────────────────────────────────────────
// In-memory store: tracks failed login attempts per IP
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;        // max failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15-minute window

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function isRateLimited(ip: string): { limited: boolean; retryAfterSecs?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { limited: false };

  // Window expired → reset
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { limited: false };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSecs = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);
    return { limited: true, retryAfterSecs };
  }

  return { limited: false };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count++;
  }
}

function clearFailedAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ── Login Handler ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Check rate limit BEFORE processing
    const { limited, retryAfterSecs } = isRateLimited(ip);
    if (limited) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${retryAfterSecs} segundos.` },
        { status: 429 }
      );
    }

    const { identifier, password } = await request.json();
    
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 });
    }

    const user = findUser(identifier);
    if (!user) {
      recordFailedAttempt(ip);
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
         updateUserPassword(user.id, await bcrypt.hash(password, 10));
      }
    }

    if (!passwordMatch) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Successful login → clear rate limit record
    clearFailedAttempts(ip);

    const { password: _, ...safeUser } = user;
    
    // Sign JWT and set httpOnly cookie
    const token = signToken({ 
      userId: user.id, 
      role: user.role, 
      name: user.name,
      mustChangeCredentials: !!user.mustChangeCredentials 
    });

    const response = NextResponse.json({
      ...safeUser,
      mustChangeCredentials: !!user.mustChangeCredentials
    });
    setAuthCookie(response, token);
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
