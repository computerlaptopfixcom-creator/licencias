import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, PlusCircle, Download, Trash2, Link2, FolderOpen, Sparkles } from 'lucide-react';

const PRESET_CATEGORIES = ['Windows', 'Office', 'Activadores', 'Utilidades', 'Drivers', 'Servidores', 'Otros'];

interface DownloadItem {
  id: string;
  title: string;
  link: string;
  category: string;
  description?: string | null;
  featured?: boolean | number;
  createdAt?: string;
  updatedAt?: string | null;
}

interface DownloadsViewProps {
  downloads: DownloadItem[];
  role: string;
  onRefresh: () => void;
  userCategories?: string[];
}

export function DownloadsView({ downloads, role, onRefresh, userCategories = [] }: DownloadsViewProps) {
  const [loading, setLoading] = useState(false);
  const [editingDownload, setEditingDownload] = useState<DownloadItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const normalizedDownloads = useMemo(
    () => downloads.map((download) => ({ ...download, featured: Boolean(download.featured) })),
    [downloads]
  );

  const sortedDownloads = useMemo(
    () => [...normalizedDownloads].sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })),
    [normalizedDownloads]
  );

  const categories = useMemo(() => {
    const discovered = [...new Set(sortedDownloads.map((download) => download.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return [...new Set([...PRESET_CATEGORIES, ...discovered])];
  }, [sortedDownloads]);

  const relatedDownloads = useMemo(
    () => role === 'user'
      ? sortedDownloads.filter((download) => userCategories.includes(download.category)).slice(0, 4)
      : [],
    [role, sortedDownloads, userCategories]
  );

  const featuredDownloads = useMemo(
    () => sortedDownloads.filter((download) => download.featured).slice(0, 3),
    [sortedDownloads]
  );

  const filteredDownloads = useMemo(
    () => selectedCategory === 'Todas'
      ? sortedDownloads
      : sortedDownloads.filter((download) => download.category === selectedCategory),
    [selectedCategory, sortedDownloads]
  );

  const visibleCategories = useMemo(
    () => categories.filter((category) => filteredDownloads.some((download) => download.category === category)),
    [categories, filteredDownloads]
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Estas seguro de eliminar esta descarga?')) return;
    try {
      const res = await fetch(`/api/downloads?id=${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch {}
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const body = {
      title: String(formData.get('title') || ''),
      link: String(formData.get('link') || ''),
      category: String(formData.get('category') || ''),
      description: String(formData.get('description') || ''),
      featured: formData.get('featured') === 'on',
      ...(editingDownload && { id: editingDownload.id })
    };

    try {
      const res = await fetch('/api/downloads', {
        method: editingDownload ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        e.currentTarget.reset();
        setEditingDownload(null);
        onRefresh();
      }
    } catch {}
    setLoading(false);
  };

  const openDownload = (link: string) => {
    let url = link.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {role === 'admin' && (
        <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8 border-t-4 border-t-blue-600">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-blue-500">
              {editingDownload ? <Pencil className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
              <h3 className="text-xl font-black uppercase tracking-tighter">
                {editingDownload ? 'Editar recurso' : 'Agregar nueva descarga'}
              </h3>
            </div>
            {editingDownload && (
              <button onClick={() => setEditingDownload(null)} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                Cancelar edicion
              </button>
            )}
          </div>

          <form key={editingDownload?.id || 'new'} onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Titulo</label>
              <input name="title" required placeholder="Ej: Office 2024 LTSC" defaultValue={editingDownload?.title || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Categoria</label>
              <select name="category" defaultValue={editingDownload?.category || PRESET_CATEGORIES[0]} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[#0a0a0a] text-white">
                {PRESET_CATEGORIES.map((category) => (
                  <option key={category} value={category} className="bg-[#0a0a0a] text-white">{category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Enlace de descarga</label>
              <input name="link" required placeholder="https://..." defaultValue={editingDownload?.link || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors" />
            </div>
            <div className="space-y-1.5 flex flex-col md:col-span-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Descripcion corta</label>
              <textarea name="description" rows={3} placeholder="Ej: Instalador oficial x64 en espanol" defaultValue={editingDownload?.description || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors resize-none" />
            </div>
            <label className="md:col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer">
              <input type="checkbox" name="featured" defaultChecked={Boolean(editingDownload?.featured)} className="w-4 h-4 accent-blue-500" />
              <div>
                <p className="text-sm font-black text-white">Marcar como recomendada</p>
                <p className="text-xs text-white/45">Aparecera primero en la seccion destacada del usuario.</p>
              </div>
            </label>
            <div className="md:col-span-2 flex justify-end">
              <button disabled={loading} type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50">
                {editingDownload ? 'Actualizar recurso' : 'Guardar recurso'}
              </button>
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
          {role === 'user' && relatedDownloads.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Download className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Relacionadas con tus productos</h3>
                  <p className="text-white/35 text-xs uppercase tracking-widest font-bold">Lo mas util segun tus licencias actuales</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {relatedDownloads.map((download) => (
                  <motion.div key={download.id} whileHover={{ y: -5 }} className="bg-[#111] border border-blue-500/10 rounded-[2rem] p-6 flex flex-col gap-4 shadow-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">{download.category}</span>
                    <h4 className="text-lg font-black text-white">{download.title}</h4>
                    {download.description && <p className="text-sm text-white/55">{download.description}</p>}
                    <button onClick={() => openDownload(download.link)} className="mt-auto bg-white text-black py-3 rounded-xl font-black hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/10 text-center">
                      Abrir descarga
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {featuredDownloads.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Recomendadas</h3>
                  <p className="text-white/35 text-xs uppercase tracking-widest font-bold">Lo mas importante para empezar rapido</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {featuredDownloads.map((download) => (
                  <motion.div key={download.id} whileHover={{ y: -5 }} className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2rem] p-8 flex flex-col gap-5 shadow-2xl">
                    <div className="flex items-center justify-between gap-3">
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-300">Recomendada</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{download.category}</span>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-black text-white">{download.title}</h4>
                      {download.description && <p className="text-sm text-white/60 leading-relaxed">{download.description}</p>}
                    </div>
                    <button onClick={() => openDownload(download.link)} className="mt-auto bg-white text-black py-4 rounded-xl font-black hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/10 text-center">
                      Abrir descarga
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {['Todas', ...categories].map((category) => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === category ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  {category}
                </button>
              ))}
            </div>

            {visibleCategories.length === 0 ? (
              <div className="border border-white/10 rounded-[2rem] p-10 text-center text-white/35 font-bold">
                No hay descargas para esta categoria todavia.
              </div>
            ) : (
              visibleCategories.map((cat) => {
                const items = filteredDownloads.filter((download) => download.category === cat);
                return (
                  <div key={cat} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <FolderOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-widest text-blue-500 whitespace-nowrap">{cat}</h4>
                      <div className="h-px bg-blue-500/20 flex-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((download) => (
                        <motion.div key={download.id} whileHover={{ y: -5 }} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 group shadow-2xl relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
                          <div className="space-y-4 z-10">
                            <div className="flex justify-between items-start gap-3 w-full">
                              <div className="space-y-2 pr-2">
                                <div className="flex flex-wrap gap-2">
                                  {download.featured && <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest text-amber-300">Recomendada</span>}
                                  <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/45">{download.category}</span>
                                </div>
                                <h4 className="text-xl font-black group-hover:text-blue-400 transition-colors break-words">{download.title}</h4>
                              </div>
                              {role !== 'admin' && (
                                <div className="p-3 shrink-0 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                                  <Download className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            {download.description && <p className="text-sm text-white/55 leading-relaxed">{download.description}</p>}
                            <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-white/35">
                              <div className="flex items-center gap-2">
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="truncate">{download.link}</span>
                              </div>
                              <p>Actualizado: {new Date(download.updatedAt || download.createdAt || Date.now()).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-auto z-10">
                            {role === 'admin' ? (
                              <div className="flex items-center gap-2 w-full">
                                <button onClick={() => { setEditingDownload(download); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black hover:bg-white/10 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                                  <Pencil className="w-4 h-4" /> Editar
                                </button>
                                <button onClick={() => handleDelete(download.id)} className="p-4 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => openDownload(download.link)} className="flex-1 bg-white text-black py-4 rounded-xl font-black hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/10 text-center">
                                Abrir descarga
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      )}
    </div>
  );
}

