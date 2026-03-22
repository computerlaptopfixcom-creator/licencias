import React from 'react';
import { Settings, ShieldCheck, ShieldAlert, Key, LogOut } from 'lucide-react';

interface SettingsViewProps {
  settings: any;
  setSettings: (settings: any) => void;
  saveSettings: (e: React.FormEvent) => void;
  setupTelegram: () => void;
  deactivateTelegram: () => void;
  changePassword: (newPass: string) => void;
  user: any;
}

export function SettingsView({
  settings,
  setSettings,
  saveSettings,
  setupTelegram,
  deactivateTelegram,
  changePassword,
  user
}: SettingsViewProps) {
  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl space-y-12">
        {/* General Branding */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-500">
              <Settings className="w-6 h-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter">Branding y Personalización</h3>
            </div>
            <form onSubmit={saveSettings} className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Nombre de la Marca</label>
                <input value={settings.brandName} onChange={(e) => setSettings({...settings, brandName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Color Principal (Hex)</label>
                <div className="flex gap-3">
                  <input value={settings.primaryColor} onChange={(e) => setSettings({...settings, primaryColor: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono focus:border-blue-500 outline-none transition-colors uppercase" />
                  <div className="w-12 h-12 rounded-xl border border-white/10 shadow-inner shrink-0" style={{ backgroundColor: settings.primaryColor }} />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Descripción de la App</label>
                <input value={settings.appDescription} onChange={(e) => setSettings({...settings, appDescription: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="px-10 py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">Guardar Cambios Visuales</button>
              </div>
            </form>
          </div>
        )}

        {/* Telegram Integration */}
        {user.role === 'admin' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter">Integración Telegram Bot</h3>
            </div>
            <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Bot Token</label>
                  <input type="password" value={settings.telegramBotToken} onChange={(e) => setSettings({...settings, telegramBotToken: e.target.value})} placeholder="7483...:AAH..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono focus:border-blue-500 outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Chat ID Admin</label>
                  <input value={settings.telegramChatId} onChange={(e) => setSettings({...settings, telegramChatId: e.target.value})} placeholder="123456789" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono focus:border-blue-500 outline-none transition-colors" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">URL Base del Webhook</label>
                  <input value={settings.telegramWebhookUrl} onChange={(e) => setSettings({...settings, telegramWebhookUrl: e.target.value})} placeholder="https://tu-app.vercel.app" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono focus:border-blue-500 outline-none transition-colors" />
                  <p className="text-[10px] text-white/20 italic pl-1">Importante: Sin '/' al final. Al configurar se añadirá automáticamente '/api/telegram/webhook'</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={setupTelegram}
                  className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5"
                >
                  Conectar y Activar Bot
                </button>
                <button 
                  onClick={deactivateTelegram}
                  className="flex-1 border border-red-500/20 text-red-500/50 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  Desactivar Webhook
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Settings */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-white/40">
            <Key className="w-6 h-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Cuenta y Seguridad</h3>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white font-black text-lg">{user.name}</span>
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{user.role}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10"><ShieldCheck className="w-6 h-6 text-white/20" /></div>
            </div>
            <div className="h-px bg-white/5" />
            <button onClick={() => {
              const pass = prompt("Nueva contraseña (mínimo 6 caracteres):");
              if (pass && pass.length >= 6) changePassword(pass);
              else if (pass) alert("Demasiado corta");
            }} className="w-full py-4 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all mb-4">Cambiar mi Contraseña</button>
            
            <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-red-500/10 transition-all">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform"><ShieldAlert className="w-5 h-5" /></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black uppercase tracking-wider text-red-500">Zona de Riesgo</span>
                    <span className="text-xs font-bold text-red-500/40">La eliminación de la cuenta es irreversible</span>
                  </div>
               </div>
               <button className="px-4 py-2 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Eliminar permanentemente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
