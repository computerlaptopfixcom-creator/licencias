import { NextResponse } from 'next/server';
import { getCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } from '@/lib/db';
import { withAuth, withAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return withAuth(async () => {
    try {
      const catalog = getCatalog();
      return NextResponse.json(catalog);
    } catch {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function POST(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { category, name, price, iconType, minStock } = await req.json();
      if (!category || !name || price === undefined) {
        return NextResponse.json({ error: 'Categoria, nombre y precio son requeridos' }, { status: 400 });
      }

      const parsedMinStock = minStock === undefined ? 5 : Number(minStock);
      if (!Number.isFinite(parsedMinStock) || parsedMinStock < 0) {
        return NextResponse.json({ error: 'El stock minimo debe ser un numero valido' }, { status: 400 });
      }

      const item = addCatalogItem(category, name, parseFloat(price), iconType, Math.round(parsedMinStock));
      if (!item) {
        return NextResponse.json({ error: 'Ya existe un producto con ese nombre' }, { status: 409 });
      }
      return NextResponse.json(item, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function PUT(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { id, category, name, price, iconType, minStock } = await req.json();
      if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }

      const parsedMinStock = minStock === undefined ? undefined : Number(minStock);
      if (parsedMinStock !== undefined && (!Number.isFinite(parsedMinStock) || parsedMinStock < 0)) {
        return NextResponse.json({ error: 'El stock minimo debe ser un numero valido' }, { status: 400 });
      }

      const result = updateCatalogItem(id, {
        category,
        name,
        price: price !== undefined ? parseFloat(price) : undefined,
        iconType,
        minStock: parsedMinStock !== undefined ? Math.round(parsedMinStock) : undefined
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}

export async function DELETE(request: Request) {
  return withAdmin(async (_, req) => {
    try {
      const { id } = await req.json();
      if (!id) {
        return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      }
      const result = deleteCatalogItem(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  }, request);
}
