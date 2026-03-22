import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, Rocket } from 'lucide-react';

interface FirstRunSetupProps {
  onComplete: (user: any) => void;
}

export function FirstRunSetup({ onComplete }: FirstRunSetupProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
  const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Excelente'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al configurar');
        setLoading(false);
        return;
      }

      localStorage.setItem('session_user', JSON.stringify(data.user));
      onComplete(data.user);
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Primera Configuración</p>
              <h1 className="text-3xl font-black text-white tracking-tight">Bienvenido</h1>
              <p className="text-white/40 text-sm mt-2">Crea tu cuenta de administrador para comenzar a usar el sistema.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Nombre de Usuario</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre de administrador"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-blue-500 outline-none transition-colors placeholder:text-white/20"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Contraseña Segura</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-blue-500 outline-none transition-colors placeholder:text-white/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength] : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest">
                    {strengthLabels[passwordStrength]} • Usa mayúsculas, números y símbolos
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || name.trim().length < 3 || password.length < 8}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Crear Cuenta y Comenzar
                </>
              )}
            </button>
          </form>

          <p className="text-white/20 text-[10px] text-center uppercase tracking-widest">
            Esta pantalla solo aparece la primera vez
          </p>
        </div>
      </motion.div>
    </div>
  );
}
