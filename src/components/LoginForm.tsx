import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoIcon } from './LogoIcon';

interface LoginFormProps {
  settings: any;
  handleLogin: (id: string, pass: string) => void;
  showToast: { show: boolean, message: string, type: string };
}

export function LoginForm({ settings, handleLogin, showToast }: LoginFormProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ backgroundColor: `${settings.primaryColor}10`, borderColor: `${settings.primaryColor}30` }}>
            <LogoIcon logoType={settings.logoType} className="w-8 h-8" style={{ color: settings.primaryColor }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{settings.brandName}</h1>
          <p className="text-white/50 text-sm">{settings.appDescription}</p>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const target = e.target as any;
          handleLogin(target.identifier.value, target.password.value);
        }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Usuario</label>
            <input required name="identifier" type="text" placeholder="Usuario" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Contraseña</label>
            <input required name="password" type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors" />
          </div>
          
          <button type="submit" className="w-full text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg" style={{ backgroundColor: settings.primaryColor, boxShadow: `0 10px 15px -3px ${settings.primaryColor}30` }}>
            Entrar al Panel
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-white/20 italic">Acceso restringido a usuarios autorizados</p>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showToast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "fixed bottom-10 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border",
              showToast.type === 'success' ? "bg-emerald-500 border-emerald-400/50" : "bg-red-500 border-red-400/50"
            )}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
