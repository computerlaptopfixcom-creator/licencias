import React from 'react';
import { Tag, PlusCircle, Pencil, Package, ShieldCheck, Monitor, Gamepad2, Music, FileText, Cloud } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Package,
  ShieldCheck,
  Monitor,
  Gamepad2,
  Music,
  FileText,
  Cloud
};

interface CatalogViewProps {
  db: any;
  role: string;
  setShowCatalogModal: (data: {show: boolean, mode: 'create'|'edit', item?: any}) => void;
}

export function CatalogView({
  db,
  role,
  setShowCatalogModal
}: CatalogViewProps) {
  if (role !== 'admin') return null;

  return (
    <div className="space-y-4">
      {/* Catalog Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Tag className="w-5 h-5 text-emerald-500" /></div>
          <div>
            <h3 className="font-black text-lg sm:text-xl tracking-tighter uppercase">Catálogo</h3>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{db.catalog.length} productos registrados</span>
          </div>
        </div>
        <button onClick={() => setShowCatalogModal({show: true, mode: 'create'})} className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 text-center">
          <PlusCircle className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {db.catalog.map((item: any) => {
          const IconComponent = iconMap[item.iconType || 'Package'] || Package;
          return (
            <div key={item.id} className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 group hover:border-emerald-500/40 transition-all hover:bg-white/[0.03] shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setShowCatalogModal({show: true, mode: 'edit', item})}
                  className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
             </div>
             
               <div className="flex justify-between items-start">
                 <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2 mb-1">
                     <IconComponent className="w-5 h-5 text-emerald-500/70" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{item.category}</span>
                   </div>
                   <h4 className="text-xl sm:text-2xl font-black text-white/90 leading-tight">{item.name}</h4>
                 </div>
               </div>
               
               <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Precio Sugerido</span>
                 <span className="text-2xl sm:text-3xl font-black text-white italic">{item.price} <span className="text-xs font-normal opacity-40 uppercase not-italic">USD</span></span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/40 mb-1">ID Producto</span>
                  <span className="font-mono text-[9px] text-white/20">{item.id.slice(0, 8)}...</span>
               </div>
               </div>
             </div>
          );
        })}
      </div>
    </div>
  );
}
