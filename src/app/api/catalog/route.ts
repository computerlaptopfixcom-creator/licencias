import { NextResponse } from 'next/server';
import { getCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const catalog = getCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { category, name, price } = await request.json();
    if (!category || !name || price === undefined) {
      return NextResponse.json({ error: 'Categoría, nombre y precio son requeridos' }, { status: 400 });
    }
    const item = addCatalogItem(category, name, parseFloat(price));
    if (!item) {
      return NextResponse.json({ error: 'Ya existe un producto con ese nombre' }, { status: 409 });
    }
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, category, name, price } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const result = updateCatalogItem(id, { category, name, price: price !== undefined ? parseFloat(price) : undefined });
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    const result = deleteCatalogItem(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
