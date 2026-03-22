import React from 'react';
import { ShieldCheck, Bell } from 'lucide-react';
import { LogoIcon } from './LogoIcon';

interface MobileNavProps {
  settings: any;
  notifications: any[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  user: any;
  onLogout: () => void;
}

export function MobileNav({ 
  settings, 
  notifications, 
  showNotifications, 
  setShowNotifications, 
  user,
  onLogout 
}: MobileNavProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-[80] flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <LogoIcon logoType={settings.logoType} className="w-4 h-4 text-white" />
        </div>
        <span className="font-black text-sm tracking-tight">{settings.brandName.split(' ')[0]}</span>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Bell className="w-5 h-5 text-white/70" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
          )}
        </button>
        
        <button 
          onClick={onLogout} 
          className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 transition-all"
          title="Cerrar Sesión"
        >
          {user.name.charAt(0)}
        </button>
      </div>
    </div>
  );
}
