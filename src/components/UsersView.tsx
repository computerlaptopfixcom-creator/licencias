import React from 'react';
import { Users, PlusCircle, Trash2 } from 'lucide-react';

interface UsersViewProps {
  db: any;
  role: string;
  createUser: (name: string, pass: string) => void;
  deleteUser: (userId: string, name: string) => void;
  setViewUserLicenses: (data: {show: boolean, userId: string, userName: string}) => void;
  setShowAssignModal: (data: {show: boolean, userId: string, userName: string}) => void;
}

export function UsersView({
  db,
  role,
  createUser,
  deleteUser,
  setViewUserLicenses,
  setShowAssignModal
}: UsersViewProps) {
  if (role !== 'admin') return null;

  return (
    <div className="space-y-4">
      {/* Users Header - stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20"><Users className="w-5 h-5 text-blue-500" /></div>
          <h3 className="font-black text-lg sm:text-xl tracking-tighter uppercase">Usuarios</h3>
        </div>
        <button onClick={() => {
          const name = prompt("Nombre del Usuario:");
          const password = prompt("Asignar Contraseña (dejar vacío para '123456'):");
          if (name) createUser(name, password || '123456');
        }} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 text-center">
          <PlusCircle className="w-4 h-4" /> Crear Nuevo
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {db.users.map((u: any) => {
          const userLicenses = db.licenses.filter((l: any) => l.assignedTo === u.id).length;
          return (
            <div key={u.id} className="bg-[#111] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-white/90">{u.name}</span>
                    <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter opacity-60">{u.role}</span>
                  </div>
                  {userLicenses === 0 && <span className="text-[9px] text-red-500 font-black uppercase mt-1 tracking-widest flex items-center gap-1"><span className="animate-pulse">●</span> Sin stock</span>}
                </div>
                <span className="font-mono text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{userLicenses} llaves</span>
              </div>
              {u.role !== 'admin' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setViewUserLicenses({show: true, userId: u.id, userName: u.name})}
                    className="flex-1 py-2.5 bg-white/5 text-white/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95 text-center"
                  >
                    Ver Llaves
                  </button>
                  <button 
                    onClick={() => setShowAssignModal({show: true, userId: u.id, userName: u.name})}
                    className="flex-1 py-2.5 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 text-center"
                  >
                    Asignar Lote
                  </button>
                  <button 
                    onClick={() => deleteUser(u.id, u.name)}
                    className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
              <th className="px-8 py-4">Usuario / Rol</th>
              <th className="px-8 py-4">Stock Asignado</th>
              <th className="px-8 py-4 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {db.users.map((u: any) => {
              const userLicenses = db.licenses.filter((l: any) => l.assignedTo === u.id).length;
              return (
                <tr key={u.id} className="group hover:bg-white/[0.01]">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-white/90">{u.name}</span>
                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter opacity-50">{u.role}</span>
                      </div>
                      {userLicenses === 0 && <span className="text-[9px] text-red-500 font-black uppercase mt-1 tracking-widest flex items-center gap-1"><span className="animate-pulse">●</span> Reabastecimiento Necesario</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5 font-mono text-xs">{userLicenses} llaves activas</td>
                  <td className="px-8 py-5 text-right">
                    {u.role !== 'admin' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setViewUserLicenses({show: true, userId: u.id, userName: u.name})}
                          className="px-4 py-2 bg-white/5 text-white/40 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                        >
                          Ver Llaves
                        </button>
                        <button 
                          onClick={() => setShowAssignModal({show: true, userId: u.id, userName: u.name})}
                          className="px-4 py-2 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                        >
                          Asignar Lote
                        </button>
                        <button 
                          onClick={() => deleteUser(u.id, u.name)}
                          className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
