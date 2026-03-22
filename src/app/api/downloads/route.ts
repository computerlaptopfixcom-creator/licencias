import { NextResponse } from 'next/server';
import { getDownloads, addDownload, deleteDownload } from '@/lib/db';
import { withAuth, withAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async () => {
    try {
      const downloads = getDownloads();
      return NextResponse.json(downloads);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { title, link, category } = await req.json();
      if (!title || !link || !category) {
        return NextResponse.json({ error: 'Título, enlace y categoría son requeridos' }, { status: 400 });
      }
      const download = addDownload(title, link, category);
      return NextResponse.json(download, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function DELETE(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        // Fallback to body if not in query
        try {
          const body = await req.json();
          if (body.id) {
            const result = deleteDownload(body.id);
            if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 });
            return NextResponse.json(result);
          }
        } catch (e) {}
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }

      const result = deleteDownload(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function PUT(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { id, title, link, category } = await req.json();
      if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }
      const { updateDownload } = await import('@/lib/db');
      const result = updateDownload(id, { title, link, category });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
