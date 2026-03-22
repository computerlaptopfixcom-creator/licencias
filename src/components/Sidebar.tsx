import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Tag, 
  Key, 
  Download, 
  Settings, 
  Bell, 
  LogOut 
} from 'lucide-react';
import { NavItem } from './ui/NavItem';
import { LogoIcon } from './LogoIcon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  role: string;
  settings: any;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifications: any[];
  onLogout: () => void;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user, 
  role, 
  settings, 
  showNotifications, 
  setShowNotifications, 
  notifications, 
  onLogout 
}: SidebarProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className="hidden lg:flex w-72 border-r border-white/5 bg-[#080808] p-8 flex-col gap-10 z-50 relative">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to bottom right, ${settings.primaryColor}, ${settings.primaryColor}dd)`, boxShadow: `0 4px 6px -1px ${settings.primaryColor}30` }}>
            <LogoIcon logoType={settings.logoType} className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-tight truncate max-w-[140px]">{settings.brandName}</span>
            <span className="text-[10px] uppercase tracking-widest font-black" style={{ color: settings.primaryColor }}>Sistema</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        <NavItem active={activeTab === 'dashboard'} icon={LayoutDashboard} label="Resumen" onClick={() => setActiveTab('dashboard')} color={settings.primaryColor} />
        {role === 'admin' ? (
          <>
            <NavItem active={activeTab === 'inventory'} icon={Package} label="Inventario" onClick={() => setActiveTab('inventory')} color={settings.primaryColor} />
            <NavItem active={activeTab === 'users'} icon={Users} label="Usuarios" onClick={() => setActiveTab('users')} color={settings.primaryColor} />
            <NavItem active={activeTab === 'catalog'} icon={Tag} label="Catálogo" onClick={() => setActiveTab('catalog')} color={settings.primaryColor} />
          </>
        ) : (
          <>
            <NavItem active={activeTab === 'my-keys'} icon={Key} label="Mis Llaves" onClick={() => setActiveTab('my-keys')} color={settings.primaryColor} />
          </>
        )}
        <NavItem active={activeTab === 'downloads'} icon={Download} label="Descargas" onClick={() => setActiveTab('downloads')} color={settings.primaryColor} />
        <div className="py-2"><div className="h-px bg-white/5 mx-2" /></div>
        <NavItem active={activeTab === 'settings'} icon={Settings} label="Ajustes" onClick={() => setActiveTab('settings')} color={settings.primaryColor} />
      </nav>

      {/* Notifications Trigger */}
      <div className="mt-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all font-bold text-white/70 hover:text-white hover:bg-white/5 active:scale-95"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111]" />
              )}
            </div>
            <span className="text-sm">Notificaciones</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-md font-black">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-auto p-5 bg-white/[0.03] border border-white/10 rounded-3xl flex items-center gap-4 group">
        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
          {user.name.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden flex-1">
          <span className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors uppercase">{user.name}</span>
          <span className="text-[11px] text-white/60 truncate">{user.email || user.role}</span>
        </div>
        <button onClick={onLogout} className="p-2 hover:bg-red-500/20 rounded-xl transition-all group/logout">
          <LogOut className="w-4 h-4 text-white/50 group-hover/logout:text-red-500" />
        </button>
      </div>
    </aside>
  );
}
