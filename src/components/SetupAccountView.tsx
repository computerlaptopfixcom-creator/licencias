import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoIcon } from './LogoIcon';

interface SetupAccountViewProps {
  settings: any;
  onComplete: (user: any) => void;
  user: any;
  triggerToast: (msg: string, type?: 'success'|'error') => void;
}

export function SetupAccountView({ settings, onComplete, user, triggerToast }: SetupAccountViewProps) {
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [strength, setStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    setStrength(score);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return triggerToast("La contraseña debe tener 6+ caracteres", "error");
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: newName || user.name, password: newPassword })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        triggerToast("¡Cuenta configurada con éxito!");
        onComplete(updatedUser);
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error de conexión", "error"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-10 shadow-3xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <LogoIcon logoType={settings.logoType} size={120} />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Seguridad Obligatoria</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Configura tu Cuenta</h2>
          <p className="text-white/40 text-sm leading-relaxed">Por seguridad, debes actualizar tu nombre y contraseña en el primer inicio de sesión.</p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6 relative z-10">
          <div className="space-y-1.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nombre Público</label>
             <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder={user.name} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-blue-500 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nueva Contraseña</label>
             <input required type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); calculateStrength(e.target.value); }} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-blue-500 outline-none transition-all font-mono" />
             <div className="flex gap-1.5 mt-2 px-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-500", i < strength ? (strength <= 1 ? "bg-red-500" : strength <= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-white/5")} />
                ))}
             </div>
             <p className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-2 ml-1">Usa mayúsculas, números y símbolos para mayor seguridad</p>
          </div>
          
          <button disabled={loading || newPassword.length < 6} type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95">
            {loading ? 'Procesando...' : 'Finalizar Configuración'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
