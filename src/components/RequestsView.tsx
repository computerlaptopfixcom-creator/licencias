import React from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RequestsViewProps {
  requests: any[];
  role: string;
  onApprove: (id: string, userId: string, product: string, count: number) => void;
  onReject: (id: string) => void;
}

export function RequestsView({
  requests,
  role,
  onApprove,
  onReject
}: RequestsViewProps) {
  if (role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20"><Key className="w-5 h-5 text-purple-500" /></div>
        <h3 className="font-black text-xl tracking-tighter uppercase">Solicitudes Pendientes</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.filter(r => r.status === 'pending').map(r => (
          <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Pendiente</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Solicitante</span>
              <span className="text-xl font-black text-white">{r.userName}</span>
            </div>

            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/50">Producto:</span>
                <span className="text-blue-400">{r.product}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/50">Cantidad:</span>
                <span className="text-white bg-white/10 px-3 py-1 rounded-lg tabular-nums">{r.count}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => onApprove(r.id, r.userId, r.product, r.count)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Aprobar
              </button>
              <button 
                onClick={() => onReject(r.id)}
                className="p-4 bg-white/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-white/5"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {requests.filter(r => r.status === 'pending').length === 0 && (
          <div className="col-span-full border border-white/10 border-dashed rounded-[3rem] p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-widest text-sm">No hay solicitudes por procesar</p>
          </div>
        )}
      </div>
    </div>
  );
}
