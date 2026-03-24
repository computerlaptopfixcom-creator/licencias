import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Generate a stable secret from the process — in production use env var
function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    if (!(globalThis as any)._ephemeralJwtSecret) {
      console.warn("⚠️ Advertencia: No se detectó JWT_SECRET en producción. Usando secreto efímero en memoria (las sesiones expirarán al reiniciar el servidor).");
      (globalThis as any)._ephemeralJwtSecret = crypto.randomBytes(32).toString('hex');
    }
    return (globalThis as any)._ephemeralJwtSecret;
  }

  return crypto
    .createHash('sha256')
    .update(`dev-secret:${process.cwd()}`)
    .digest('hex');
}

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface TokenPayload {
  userId: string;
  role: 'admin' | 'user';
  name: string;
  mustChangeCredentials?: boolean;
  iat: number;
  exp: number;
}

// Simple HMAC-based token (no external JWT library needed)
export function signToken(payload: { userId: string; role: string; name: string; mustChangeCredentials?: boolean }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Date.now();
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY
  })).toString('base64url');
  
  const secret = getJwtSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    
    const secret = getJwtSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// Extract and verify the current user from cookies
export async function getAuthUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// Middleware: require any authenticated user
export async function withAuth(handler: (user: TokenPayload, request: Request) => Promise<NextResponse>, request: Request): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return handler(user, request);
}

// Middleware: require admin role
export async function withAdmin(handler: (user: TokenPayload, request: Request) => Promise<NextResponse>, request: Request): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado — solo administradores' }, { status: 403 });
  }
  return handler(user, request);
}

// Helper to set auth cookie on login response
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_EXPIRY / 1000 // seconds
  });
  return response;
}

// Helper to clear auth cookie on logout
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete('auth_token');
  return response;
}
