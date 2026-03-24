import React from 'react';
import { Bell } from 'lucide-react';
import { LogoIcon } from './LogoIcon';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
  settings: any;
  notifications: any[];
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  user: any;
  onLogout: () => void;
}

export function MobileNav({
  activeTab,
  setActiveTab,
  role,
  settings,
  notifications,
  showNotifications,
  setShowNotifications,
  user,
  onLogout
}: MobileNavProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const tabs = role === 'admin'
    ? [
        { value: 'dashboard', label: 'Resumen' },
        { value: 'inventory', label: 'Inventario' },
        { value: 'users', label: 'Usuarios' },
        { value: 'catalog', label: 'Catalogo' },
        { value: 'downloads', label: 'Descargas' },
        { value: 'settings', label: 'Ajustes' }
      ]
    : [
        { value: 'dashboard', label: 'Inicio' },
        { value: 'my-keys', label: 'Mis llaves' },
        { value: 'downloads', label: 'Descargas' },
        { value: 'settings', label: 'Ajustes' }
      ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 z-[80] px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LogoIcon logoType={settings.logoType} className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight truncate">{settings.brandName}</span>
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
            title="Cerrar Sesion"
          >
            {user.name.charAt(0)}
          </button>
        </div>
      </div>

      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
      >
        {tabs.map((tab) => (
          <option key={tab.value} value={tab.value} className="bg-[#0a0a0a]">
            {tab.label}
          </option>
        ))}
      </select>
    </div>
  );
}
