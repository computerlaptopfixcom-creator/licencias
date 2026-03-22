import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryViewProps {
  db: any;
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
  reportedLicensesCount
}: InventoryViewProps) {
  if (role !== 'admin') return null;

  return (
    <div className="space-y-6">
      {/* Bulk Upload Section */}
      <AnimatePresence>
        {bulkOpen && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-10"
          >
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 border-t-4 border-t-blue-600">
              <div className="flex items-center gap-3 text-blue-500">
                <PlusCircle className="w-6 h-6" />
                <h3 className="text-xl font-black uppercase tracking-tighter">Cargar Inventario (Panel Directo)</h3>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                addLicensesBulk(target.product.value, target.keysArr.value, target.batchNote.value);
                target.reset();
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Producto Objetivo</label>
                    <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none scrollbar-hide bg-[#0a0a0a]">
                      {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                        <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white">
                          {items.map(item => (
                            <option key={item} value={item} className="text-white bg-[#0f0f0f]">{item}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Nota del Lote (Proveedor)</label>
                    <input name="batchNote" placeholder="Ej: Lote #5 Proveedor X" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Claves de Producto (Pega tu lista aquí, una por línea)</label>
                  <textarea 
                    name="keysArr" 
                    required 
                    rows={6} 
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-colors resize-none"
                  />
                </div>

                <button type="submit" className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs">
                  Iniciar Carga Masiva
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 flex-1">
          <button 
            onClick={() => setInventoryFilter('all')}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryFilter === 'all' ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
          >
            🚀 Todo
          </button>
          {Object.keys(PRODUCT_CATALOG).map(cat => (
            <button 
              key={cat}
              onClick={() => setInventoryFilter(cat)}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryFilter === cat ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Status Toggle */}
        <div className="flex bg-[#111] border border-white/10 rounded-2xl p-1.5 shrink-0">
           <button 
             onClick={() => setInventoryStatusFilter('available')}
             className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'available' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-white/40 hover:text-white")}
           >
             🟢 Disponibles ({availableLicenses})
           </button>
           <button 
             onClick={() => setInventoryStatusFilter('assigned')}
             className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'assigned' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white")}
           >
             📦 Asignadas ({assignedLicenses})
           </button>
           <button 
             onClick={() => setInventoryStatusFilter('reported')}
             className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'reported' ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-white/40 hover:text-red-500/60")}
           >
             ⚠️ Reportadas ({reportedLicensesCount})
           </button>
         </div>
       </div>

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-5 h-5 text-blue-500" /></div>
              <h3 className="font-black text-xl tracking-tighter uppercase">Inventario: {inventoryFilter === 'all' ? 'Completo' : inventoryFilter}</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
              <thead>
                <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                  <th className="px-8 py-4">Producto</th>
                  <th className="px-8 py-4">Serial / Key</th>
                  {inventoryStatusFilter === 'available' ? (
                    <th className="px-8 py-4">Nota / Lote</th>
                  ) : (
                    <>
                      <th className="px-8 py-4">Asignado A</th>
                      <th className="px-8 py-4">Fecha de Asignación</th>
                    </>
                  )}
                </tr>
              </thead>
               <tbody className="divide-y divide-white/5">
                 {db.licenses
                   .filter((l: any) => {
                     if (inventoryStatusFilter === 'reported') return l.reportedFailed;
                     if (inventoryStatusFilter === 'assigned') return l.status === 'assigned' && !l.reportedFailed;
                     return l.status === 'available';
                   })
                   .filter((l: any) => {
                     if (inventoryFilter === 'all') return true;
                     return PRODUCT_CATALOG[inventoryFilter as keyof typeof PRODUCT_CATALOG]?.includes(l.product);
                   })
                  .map((l: any) => {
                     const assignedUser = (inventoryStatusFilter === 'assigned' || inventoryStatusFilter === 'reported') ? db.users.find((u: any) => u.id === l.assignedTo) : null;
                    return (
                       <tr key={l.id} className="group hover:bg-white/[0.01]">
                         <td className="px-8 py-5 font-bold text-white/90">
                           <div className="flex items-center gap-2">
                             {l.product}
                             {l.reportedFailed && <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">⚠️ Fallida</span>}
                           </div>
                         </td>
                         <td className="px-8 py-5 font-mono text-xs text-blue-400/80">{l.key}</td>
                        {inventoryStatusFilter === 'available' ? (
                          <td className="px-8 py-5 text-white/40 text-xs italic">{l.batchNote || '—'}</td>
                        ) : (
                          <>
                            <td className="px-8 py-5">
                              <div className="font-bold text-white/90 text-sm">{assignedUser ? assignedUser.name : 'Desconocido'}</div>
                              {assignedUser?.email && <div className="text-white/40 text-[10px] mt-0.5">{assignedUser.email}</div>}
                            </td>
                            <td className="px-8 py-5 text-white/40 text-xs">
                              {l.assignedAt ? new Date(l.assignedAt).toLocaleString() : '—'}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
