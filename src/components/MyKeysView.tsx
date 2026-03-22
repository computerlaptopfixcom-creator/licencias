import React from 'react';
import { PlusCircle, Copy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyKeysViewProps {
  db: any;
  user: any;
  userInventoryFilter: string;
  setUserInventoryFilter: (filter: string) => void;
  userSubFilter: string | null;
  setUserSubFilter: (filter: string | null) => void;
  PRODUCT_CATALOG: Record<string, string[]>;
  setShowRequestModal: (show: boolean) => void;
  triggerToast: (msg: string, type?: 'success'|'error') => void;
  reportFailed: (id: string) => void;
  revealLicense: (id: string) => void;
}

export function MyKeysView({
  db,
  user,
  userInventoryFilter,
  setUserInventoryFilter,
  userSubFilter,
  setUserSubFilter,
  PRODUCT_CATALOG,
  setShowRequestModal,
  triggerToast,
  reportFailed,
  revealLicense
}: MyKeysViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { setUserInventoryFilter('all'); setUserSubFilter(null); }}
            className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userInventoryFilter === 'all' ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
          >
            🚀 Todo
          </button>
          {Object.keys(PRODUCT_CATALOG).filter(cat => 
             db.licenses.some((l: any) => l.assignedTo === user.id && PRODUCT_CATALOG[cat].includes(l.product))
          ).map(cat => (
            <button 
              key={cat}
              onClick={() => { setUserInventoryFilter(cat); setUserSubFilter(null); }}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userInventoryFilter === cat ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowRequestModal(true)}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 shrink-0 flex items-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" /> Solicitar Nueva Licencia
        </button>
      </div>

      {/* Sub Filter */}
      {userInventoryFilter !== 'all' && (
        <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-1 duration-300">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 w-full mb-1">Filtrar por Variante (En Propiedad)</span>
          {PRODUCT_CATALOG[userInventoryFilter].map(productName => {
            const count = db.licenses.filter((l: any) => l.assignedTo === user.id && l.product === productName).length;
            if(count === 0) return null;
            return (
              <button 
                key={productName}
                onClick={() => setUserSubFilter(userSubFilter === productName ? null : productName)}
                className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userSubFilter === productName ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-black/40 text-white/60 hover:bg-black/60")}
              >
                {productName} <span className="text-white/40 ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-8 border-b border-white/10 bg-white/[0.02]">
            <h3 className="font-black text-xl tracking-tighter uppercase">Mis Licencias {userInventoryFilter !== 'all' && `- ${userInventoryFilter}`}</h3>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                <th className="px-8 py-4">Producto</th>
                <th className="px-8 py-4">Serial / Key</th>
                <th className="px-8 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {db.licenses
                .filter((l: any) => l.assignedTo === user.id)
                .filter((l: any) => {
                  if (userInventoryFilter === 'all') return true;
                  if (userSubFilter && l.product !== userSubFilter) return false;
                  return PRODUCT_CATALOG[userInventoryFilter]?.includes(l.product);
                })
                .map((l: any) => (
                <tr key={l.id} className="group hover:bg-white/[0.01]">
                  <td className="px-8 py-5 font-bold text-white/90">{l.product}</td>
                  <td className="px-8 py-5">
                    {l.claimed ? (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{l.key}</span>
                        <button onClick={() => { navigator.clipboard.writeText(l.key); triggerToast('Llave copiada al portapapeles'); }} className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors group" title="Copiar Llave">
                          <Copy className="w-3.5 h-3.5 text-white/20 group-hover:text-blue-400" />
                        </button>
                        {!l.reportedFailed ? (
                          <button onClick={() => reportFailed(l.id)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors group" title="Reportar Falla">
                            <AlertTriangle className="w-4 h-4 text-white/20 group-hover:text-red-500" />
                          </button>
                        ) : (
                          <span className="text-[9px] text-red-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">Falla Reportada</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-white/30 tracking-[0.3em] font-mono select-none">•••••••••••••••••••••</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {l.claimed ? (
                      <span className="text-white/40 text-xs">{new Date(l.claimedAt || l.createdAt).toLocaleString()}</span>
                    ) : (
                      <button onClick={() => revealLicense(l.id)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                        Revelar Llave
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {db.licenses.filter((l: any) => l.assignedTo === user.id && (userInventoryFilter === 'all' || PRODUCT_CATALOG[userInventoryFilter]?.includes(l.product)) && (!userSubFilter || l.product === userSubFilter)).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-white/30 font-bold uppercase tracking-widest text-[10px]">
                    Aún no tienes licencias en esta categoría o variante
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
