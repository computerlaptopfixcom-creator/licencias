import React from 'react';
import { motion } from 'framer-motion';
import { Key, ShieldCheck, CheckCircle2, XCircle, Clock3 } from 'lucide-react';

interface RequestItem {
  id: string;
  userId: string;
  userName: string;
  product: string;
  count: number;
  status: string;
  priority?: string;
  note?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  rejectedAt?: string | null;
}

interface RequestsViewProps {
  requests: RequestItem[];
  role: string;
  onApprove: (id: string, userId: string, product: string, count: number) => void;
  onReject: (id: string) => void;
}

export function RequestsView({ requests, role, onApprove, onReject }: RequestsViewProps) {
  if (role !== 'admin') return null;

  const pendingRequests = requests.filter((request) => request.status === 'pending');
  const processedRequests = [...requests]
    .filter((request) => request.status !== 'pending')
    .sort((a, b) => new Date((b.resolvedAt || b.rejectedAt || b.createdAt) as string).getTime() - new Date((a.resolvedAt || a.rejectedAt || a.createdAt) as string).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20"><Key className="w-5 h-5 text-purple-500" /></div>
        <div>
          <h3 className="font-black text-xl tracking-tighter uppercase">Solicitudes</h3>
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Prioriza, revisa y resuelve pedidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingRequests.map((request) => (
          <motion.div key={request.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 flex gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">Pendiente</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${request.priority === 'alta' ? 'text-red-300 bg-red-500/10 border-red-500/20' : request.priority === 'baja' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-white/60 bg-white/5 border-white/10'}`}>
                {request.priority || 'normal'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Solicitante</span>
              <span className="text-xl font-black text-white">{request.userName}</span>
              <span className="text-white/25 text-[11px] uppercase tracking-widest">{new Date(request.createdAt).toLocaleString()}</span>
            </div>

            <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold gap-4">
                <span className="text-white/50">Producto:</span>
                <span className="text-blue-400 text-right">{request.product}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-white/50">Cantidad:</span>
                <span className="text-white bg-white/10 px-3 py-1 rounded-lg tabular-nums">{request.count}</span>
              </div>
              {request.note && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Nota del usuario</p>
                  <p className="text-sm text-white/65 leading-relaxed">{request.note}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-auto">
              <button onClick={() => onApprove(request.id, request.userId, request.product, request.count)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Aprobar
              </button>
              <button onClick={() => onReject(request.id)} className="p-4 bg-white/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}

        {pendingRequests.length === 0 && (
          <div className="col-span-full border border-white/10 border-dashed rounded-[3rem] p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-white/10" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-widest text-sm">No hay solicitudes por procesar</p>
          </div>
        )}
      </div>

      <section className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="flex items-center gap-3 text-white/80">
          <Clock3 className="w-5 h-5" />
          <div>
            <h4 className="font-black uppercase tracking-widest text-sm">Historial Reciente</h4>
            <p className="text-white/30 text-xs">Solicitudes ya atendidas o rechazadas</p>
          </div>
        </div>
        {processedRequests.length === 0 ? (
          <p className="text-white/30 font-bold text-sm">Aun no hay solicitudes procesadas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processedRequests.map((request) => (
              <div key={request.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-white">{request.userName}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${request.status === 'resolved' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-white/45 text-sm mt-2">{request.count}x {request.product}</p>
                {request.reviewNote && <p className="text-white/35 text-xs mt-2">{request.reviewNote}</p>}
                <p className="text-white/20 text-[10px] uppercase tracking-widest mt-3">{new Date(request.resolvedAt || request.rejectedAt || request.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

