// Registration endpoint removed for security.
// Users are created by admins through the /api/users endpoint.
// This file kept as a placeholder to avoid 404s during deployment transitions.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Registro deshabilitado. Contacta al administrador.' }, { status: 403 });
}
