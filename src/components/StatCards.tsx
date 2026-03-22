import React from 'react';
import { Package, Key, ShieldCheck, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { StatCard } from './ui/StatCard';

interface StatCardsProps {
  role: string;
  stats: any;
  user: any;
  db: any;
}

export function StatCards({ role, stats, user, db }: StatCardsProps) {
  if (role === 'admin') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-emerald-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Package className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Stock Disponible</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.available || 0}</div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-blue-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Key className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Llaves Asignadas</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.assigned || 0}</div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-amber-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><ShieldCheck className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Total en Base</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.total || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-purple-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500"><Users className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Usuarios Activos</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.users || 0}</div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-red-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><AlertTriangle className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Solicitudes Pendientes</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.requests?.pending || 0}</div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-orange-500 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><ShieldAlert className="w-6 h-6" /></div>
              <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Llaves Fallidas</span>
            </div>
            <div className="text-5xl font-black tabular-nums">{stats?.failed || 0}</div>
          </div>
        </div>
      </div>
    );
  }

  // Regular user stats
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-amber-500 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Package className="w-6 h-6" /></div>
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Total Asignadas</span>
          </div>
          <div className="text-5xl font-black tabular-nums">{db.licenses.filter((l:any) => l.assignedTo === user.id).length}</div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-blue-500 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><ShieldCheck className="w-6 h-6" /></div>
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Por Revelar</span>
          </div>
          <div className="text-5xl font-black tabular-nums">{db.licenses.filter((l:any) => l.assignedTo === user.id && !l.claimed).length}</div>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 border-t-4 border-t-emerald-500 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Key className="w-6 h-6" /></div>
            <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Llaves Gastadas</span>
          </div>
          <div className="text-5xl font-black tabular-nums">{db.licenses.filter((l:any) => l.assignedTo === user.id && l.claimed).length}</div>
        </div>
      </div>
      
      <h4 className="text-lg font-black uppercase tracking-widest mb-4">Desglose por Producto</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(
          db.licenses.filter((l:any) => l.assignedTo === user.id).reduce((acc: any, l: any) => {
            acc[l.product] = (acc[l.product] || 0) + 1;
            return acc;
          }, {})
        ).map(([prod, count]) => (
          <StatCard key={prod} title={prod} value={count as number} color="blue" subtitle="Licencias Total Asignadas" />
        ))}
        {db.licenses.filter((l:any) => l.assignedTo === user.id).length === 0 && (
          <div className="col-span-full border border-white/10 border-dashed rounded-[2rem] p-12 text-center text-white/30 font-black uppercase tracking-widest text-sm">
            Aún no tienes licencias asignadas
          </div>
        )}
      </div>
    </div>
  );
}
