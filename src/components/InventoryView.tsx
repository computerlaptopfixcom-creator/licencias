import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, PlusCircle, Package, Eye, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogItem {
  id: string;
  category: string;
  name: string;
  minStock?: number;
}

interface LicenseItem {
  id: string;
  product: string;
  key: string;
  status: string;
  assignedTo?: string | null;
  assignedAt?: string | null;
  claimed?: boolean;
  reportedFailed?: boolean;
  batchNote?: string | null;
  createdAt?: string | null;
}

interface UserItem {
  id: string;
  name: string;
  email?: string | null;
}

interface MovementItem {
  id: string;
  product: string;
  type: string;
  details?: string | null;
  targetUserName?: string | null;
  createdAt: string;
}

interface InventoryViewProps {
  db: {
    catalog: CatalogItem[];
    licenses: LicenseItem[];
    users: UserItem[];
  };
  role: string;
  inventoryFilter: string;
  setInventoryFilter: (filter: string) => void;
  inventoryStatusFilter: string;
  setInventoryStatusFilter: (status: 'available' | 'assigned' | 'reported') => void;
  bulkOpen: boolean;
  setBulkOpen: (open: boolean) => void;
  PRODUCT_CATALOG: Record<string, string[]>;
  addLicensesBulk: (product: string, keys: string, note: string) => void;
  availableLicenses: number;
  assignedLicenses: number;
  reportedLicensesCount: number;
  replaceLicense: (id: string) => void;
  movements: MovementItem[];
}

export function InventoryView({
  db,
  role,
  inventoryFilter,
  setInventoryFilter,
  inventoryStatusFilter,
  setInventoryStatusFilter,
  bulkOpen,
  setBulkOpen,
  PRODUCT_CATALOG,
  addLicensesBulk,
  availableLicenses,
  assignedLicenses,
  reportedLicensesCount,
  replaceLicense,
  movements
}: InventoryViewProps) {
  const [bulkPreview, setBulkPreview] = useState<null | {
    total: number;
    valid: number;
    duplicatesInPayload: string[];
    existingInSystem: string[];
  }>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const replenishmentProducts = useMemo(
    () => db.catalog
      .map((item) => {
        const availableCount = db.licenses.filter((license) => license.product === item.name && license.status === 'available').length;
        const minStock = Number(item.minStock ?? 5);
        return {
          ...item,
          availableCount,
          minStock,
          deficit: Math.max(minStock - availableCount, 0),
          recommendedLoad: Math.max(minStock * 2 - availableCount, 0)
        };
      })
      .filter((item) => item.availableCount <= item.minStock)
      .sort((a, b) => b.deficit - a.deficit || a.availableCount - b.availableCount)
      .slice(0, 6),
    [db.catalog, db.licenses]
  );

  const filteredLicenses = db.licenses
    .filter((license) => {
      if (inventoryStatusFilter === 'reported') return Boolean(license.reportedFailed);
      if (inventoryStatusFilter === 'assigned') return license.status === 'assigned' && !license.reportedFailed;
      return license.status === 'available';
    })
    .filter((license) => {
      if (inventoryFilter === 'all') return true;
      return PRODUCT_CATALOG[inventoryFilter]?.includes(license.product);
    });

  const recentMovements = movements.slice(0, 8);

  const previewBulk = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const keysString = String(formData.get('keysArr') || '');
    const keys = keysString.split('\n').map((key) => key.trim()).filter((key) => key.length > 0);
    if (keys.length === 0) {
      setBulkPreview(null);
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch('/api/licenses/bulk-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys })
      });
      if (res.ok) {
        const data = await res.json();
        setBulkPreview(data);
      }
    } catch {}
    setPreviewLoading(false);
  };

  if (role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="font-black text-xl tracking-tighter uppercase">Centro de Reposicion</h3>
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Productos que requieren accion</p>
            </div>
          </div>
          {replenishmentProducts.length === 0 ? (
            <p className="text-white/35 font-bold text-sm">Todo el catalogo esta por encima de su minimo configurado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {replenishmentProducts.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-white">{item.name}</p>
                    <p className="text-xs text-white/40">Disponible: {item.availableCount} / Minimo: {item.minStock}</p>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mt-1">Sugerido cargar: {item.recommendedLoad}</p>
                  </div>
                  <button onClick={() => { setInventoryFilter(item.category); setBulkOpen(true); }} className="px-4 py-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                    Reponer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 text-blue-400">
            <History className="w-5 h-5" />
            <div>
              <h3 className="font-black text-xl tracking-tighter uppercase">Movimientos</h3>
              <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Ultima actividad del stock</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {recentMovements.length === 0 ? (
              <p className="text-white/35 font-bold text-sm">Aun no hay historial reciente.</p>
            ) : recentMovements.map((movement) => (
              <div key={movement.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="font-black text-white text-sm">{movement.product}</p>
                <p className="text-white/45 text-xs">{movement.type.replace(/_/g, ' ')}</p>
                {movement.targetUserName && <p className="text-white/30 text-xs">Usuario: {movement.targetUserName}</p>}
                {movement.details && <p className="text-white/25 text-[11px] mt-1">{movement.details}</p>}
                <p className="text-white/20 text-[10px] uppercase tracking-widest mt-2">{new Date(movement.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {bulkOpen && (
          <motion.section initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-10">
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 border-t-4 border-t-blue-600">
              <div className="flex items-center gap-3 text-blue-500">
                <PlusCircle className="w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Carga Masiva con Previsualizacion</h3>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as typeof e.target & {
                  product: { value: string };
                  keysArr: { value: string };
                  batchNote: { value: string };
                  reset: () => void;
                };
                addLicensesBulk(target.product.value, target.keysArr.value, target.batchNote.value);
                target.reset();
                setBulkPreview(null);
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Producto objetivo</label>
                    <select name="product" required defaultValue="" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none scrollbar-hide bg-[#0a0a0a]">
                      <option value="" disabled>Selecciona un producto</option>
                      {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                        <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white">
                          {items.map((item) => (
                            <option key={item} value={item} className="text-white bg-[#0f0f0f]">{item}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Nota del lote</label>
                    <input name="batchNote" placeholder="Ej: Lote #5 Proveedor X" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Claves de producto</label>
                  <textarea name="keysArr" required rows={6} onBlur={(e) => previewBulk(e.currentTarget.form as HTMLFormElement)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-colors resize-none" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={(e) => previewBulk(e.currentTarget.form as HTMLFormElement)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
                    <Eye className="w-4 h-4" /> {previewLoading ? 'Analizando...' : 'Previsualizar'}
                  </button>
                  <button type="submit" className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs">
                    Confirmar carga masiva
                  </button>
                </div>

                {bulkPreview && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <p className="text-[10px] text-white/35 font-black uppercase tracking-widest">Total</p>
                      <p className="text-3xl font-black mt-2">{bulkPreview.total}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest">Validas</p>
                      <p className="text-3xl font-black mt-2 text-emerald-200">{bulkPreview.valid}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] text-amber-300 font-black uppercase tracking-widest">Duplicadas en lote</p>
                      <p className="text-3xl font-black mt-2 text-amber-200">{bulkPreview.duplicatesInPayload.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <p className="text-[10px] text-red-300 font-black uppercase tracking-widest">Ya existentes</p>
                      <p className="text-3xl font-black mt-2 text-red-200">{bulkPreview.existingInSystem.length}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2 flex-1">
          <button onClick={() => setInventoryFilter('all')} className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', inventoryFilter === 'all' ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'bg-white/5 text-white/40 hover:bg-white/10')}>
            Todo
          </button>
          {Object.keys(PRODUCT_CATALOG).map((cat) => (
            <button key={cat} onClick={() => setInventoryFilter(cat)} className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', inventoryFilter === cat ? 'bg-white/10 text-white shadow-lg shadow-white/5' : 'bg-white/5 text-white/40 hover:bg-white/10')}>
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="flex bg-[#111] border border-white/10 rounded-2xl p-1.5 shrink-0">
          <button onClick={() => setInventoryStatusFilter('available')} className={cn('px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', inventoryStatusFilter === 'available' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-white/40 hover:text-white')}>
            Disponibles ({availableLicenses})
          </button>
          <button onClick={() => setInventoryStatusFilter('assigned')} className={cn('px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', inventoryStatusFilter === 'assigned' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white')}>
            Asignadas ({assignedLicenses})
          </button>
          <button onClick={() => setInventoryStatusFilter('reported')} className={cn('px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all', inventoryStatusFilter === 'reported' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:text-red-500/60')}>
            Reportadas ({reportedLicensesCount})
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-5 h-5 text-blue-500" /></div>
            <h3 className="font-black text-xl tracking-tighter uppercase">Inventario: {inventoryFilter === 'all' ? 'Completo' : inventoryFilter}</h3>
          </div>
          <button onClick={() => setBulkOpen(!bulkOpen)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Cargar inventario
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[760px]">
            <thead>
              <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                <th className="px-8 py-4">Producto</th>
                <th className="px-8 py-4">Serial / Key</th>
                {inventoryStatusFilter === 'available' ? (
                  <>
                    <th className="px-8 py-4">Nota / Lote</th>
                    <th className="px-8 py-4">Creada</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-4">Asignado A</th>
                    <th className="px-8 py-4">Fecha de Asignacion</th>
                    <th className="px-8 py-4">Estado</th>
                    {inventoryStatusFilter === 'reported' && <th className="px-8 py-4 text-right">Acciones</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLicenses.map((license) => {
                const assignedUser = (inventoryStatusFilter === 'assigned' || inventoryStatusFilter === 'reported') ? db.users.find((user) => user.id === license.assignedTo) : null;
                return (
                  <tr key={license.id} className="group hover:bg-white/[0.01]">
                    <td className="px-8 py-5 font-bold text-white/90">
                      <div className="flex items-center gap-2">
                        {license.product}
                        {license.reportedFailed && <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Fallida</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs text-blue-400/80">{license.key}</td>
                    {inventoryStatusFilter === 'available' ? (
                      <>
                        <td className="px-8 py-5 text-white/40 text-xs italic">{license.batchNote || '—'}</td>
                        <td className="px-8 py-5 text-white/40 text-xs">{license.createdAt ? new Date(license.createdAt).toLocaleString() : '—'}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-5">
                          <div className="font-bold text-white/90 text-sm">{assignedUser ? assignedUser.name : 'Desconocido'}</div>
                          {assignedUser?.email && <div className="text-white/40 text-[10px] mt-0.5">{assignedUser.email}</div>}
                        </td>
                        <td className="px-8 py-5 text-white/40 text-xs">{license.assignedAt ? new Date(license.assignedAt).toLocaleString() : '—'}</td>
                        <td className="px-8 py-5 text-white/40 text-xs">{license.claimed ? 'Revelada' : license.reportedFailed ? 'Reportada' : 'Asignada'}</td>
                        {inventoryStatusFilter === 'reported' && (
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => replaceLicense(license.id)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer" title="Utilizara otra licencia de stock disponible para reponer este fallo.">
                              Reemplazar auto
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
              {filteredLicenses.length === 0 && (
                <tr>
                  <td colSpan={inventoryStatusFilter === 'available' ? 4 : inventoryStatusFilter === 'reported' ? 6 : 5} className="px-8 py-12 text-center text-white/30 font-bold uppercase tracking-widest text-[10px]">
                    No hay licencias para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

