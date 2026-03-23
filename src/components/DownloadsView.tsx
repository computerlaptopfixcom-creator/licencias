import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, PlusCircle, Download, Trash2 } from 'lucide-react';

interface DownloadsViewProps {
  downloads: any[];
  role: string;
  onRefresh: () => void;
}

export function DownloadsView({ downloads, role, onRefresh }: DownloadsViewProps) {
  const [loading, setLoading] = useState(false);
  const [editingDownload, setEditingDownload] = useState<any>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta descarga?")) return;
    try {
      const res = await fetch(`/api/downloads?id=${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const target = e.target as any;
    const body = {
      title: target.title.value,
      link: target.link.value,
      category: target.category.value,
      ...(editingDownload && { id: editingDownload.id })
    };

    try {
      const res = await fetch('/api/downloads', {
        method: editingDownload ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        target.reset();
        setEditingDownload(null);
        onRefresh();
      }
    } catch (e) {}
    setLoading(false);
  };

  const categories = [...new Set(downloads.map(d => d.category))];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {role === 'admin' && (
        <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 border-t-4 border-t-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-blue-500">
              {editingDownload ? <Pencil className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
              <h3 className="text-xl font-black uppercase tracking-tighter">
                {editingDownload ? 'Editar Descarga ISO' : 'Agregar Nueva Descarga ISO'}
              </h3>
            </div>
            {editingDownload && (
              <button 
                onClick={() => setEditingDownload(null)}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Cancelar Edición
              </button>
            )}
          </div>
          <form key={editingDownload?.id || 'new'} onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Título</label>
              <input name="title" required placeholder="Ej: Office 2024 LTSC" defaultValue={editingDownload?.title || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Enlace de Descarga</label>
              <input name="link" required placeholder="https://..." defaultValue={editingDownload?.link || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Categoría</label>
              <div className="flex gap-2">
                <input name="category" required placeholder="Ej: Office" defaultValue={editingDownload?.category || ''} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
                <button disabled={loading} type="submit" className="bg-blue-600 text-white px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
                  {editingDownload ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {downloads.length === 0 ? (
        <div className="border-2 border-dashed border-white/5 rounded-[3rem] p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-white/30 font-black uppercase tracking-widest">No hay descargas disponibles por ahora</p>
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map(cat => (
            <div key={cat} className="space-y-6">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-black uppercase tracking-widest text-blue-500 whitespace-nowrap">{cat}</h4>
                <div className="h-px bg-blue-500/20 flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {downloads.filter(d => d.category === cat).map(d => (
                  <motion.div key={d.id} whileHover={{ y: -5 }} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 group shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                    <div className="flex justify-between items-start z-10 w-full">
                      <h4 className="text-xl font-black group-hover:text-blue-400 transition-colors pr-2 break-all">{d.title}</h4>
                      {role !== 'admin' && (
                        <div className="p-3 shrink-0 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                          <Download className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto z-10">
                      {role === 'admin' ? (
                        <div className="flex items-center gap-2 w-full">
                          <button 
                            onClick={() => {
                              setEditingDownload(d);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black hover:bg-white/10 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Pencil className="w-4 h-4" /> Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(d.id)}
                            className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <a 
                          href={d.link}
                          download={`${d.title.replace(/[^a-zA-Z0-9-]/g, '_')}.iso`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-white text-black py-4 rounded-xl font-black hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/10 text-center block"
                        >
                          Descargar ISO
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
