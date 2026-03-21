'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Package, 
  Users, 
  Key, 
  LogOut, 
  Copy, 
  CheckCircle2, 
  PlusCircle,
  Settings,
  X,
  Bell,
  AlertTriangle,
  LayoutDashboard,
  Tag,
  Pencil,
  Trash2,
  DollarSign,
  Menu
} from 'lucide-react';
import { cn } from '../lib/utils';

// Catalog is now dynamic — loaded from database via /api/catalog

export default function Dashboard() {
  const [db, setDb] = useState<{ users: any[], licenses: any[], requests: any[], catalog: any[] }>({ users: [], licenses: [], requests: [], catalog: [] });
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showCatalogModal, setShowCatalogModal] = useState<{show: boolean, mode: 'create'|'edit', item?: any}>({show: false, mode: 'create'});

  // Derive PRODUCT_CATALOG and PRODUCT_PRICES from db.catalog
  const PRODUCT_CATALOG: Record<string, string[]> = {};
  const PRODUCT_PRICES: Record<string, number> = {};
  db.catalog.forEach((item: any) => {
    if (!PRODUCT_CATALOG[item.category]) PRODUCT_CATALOG[item.category] = [];
    PRODUCT_CATALOG[item.category].push(item.name);
    PRODUCT_PRICES[item.name] = item.price;
  });

  const [stats, setStats] = useState<any>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | string>('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'available' | 'assigned' | 'reported'>('available');
  const [viewUserLicenses, setViewUserLicenses] = useState<{show: boolean, userId: string, userName: string}>({show: false, userId: '', userName: ''});
  const [userInventoryFilter, setUserInventoryFilter] = useState<'all' | string>('all');
  const [userSubFilter, setUserSubFilter] = useState<string | null>(null);
  const [settings, setSettings] = useState({ telegramBotToken: '', telegramChatId: '' });

  useEffect(() => {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('session_user');
    let currentUser = null;
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
        refreshData(currentUser);
      } catch(e) { localStorage.removeItem('session_user'); }
    }
    refreshData(currentUser);
    refreshStats();

    // Auto-refresh polling every 15 seconds
    const interval = setInterval(() => {
      refreshData(currentUser);
      refreshStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  const refreshData = async (currentUser: any = user) => {
    try {
      const promises: any[] = [
        fetch('/api/users'),
        fetch('/api/licenses'),
        fetch('/api/requests'),
        fetch('/api/catalog'),
        currentUser ? fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.role === 'admin' ? 'admin' : currentUser.id })}) : Promise.resolve(null)
      ];
      if (currentUser?.role === 'admin') {
        promises.push(fetch('/api/settings'));
      }
      
      const results = await Promise.all(promises);
      const [resUsers, resLicenses, resRequests, resCatalog, resNotifs] = results;
      const resSettings = currentUser?.role === 'admin' ? results[5] : null;

      const users = await resUsers.json();
      const licenses = await resLicenses.json();
      const requests = await resRequests.json();
      const catalog = await resCatalog.json();
      const notifs = resNotifs ? await resNotifs.json() : [];
      setDb({ users, licenses, requests, catalog: Array.isArray(catalog) ? catalog : [] });
      if (resSettings) {
        const dataSettings = await resSettings.json();
        setSettings({ telegramBotToken: dataSettings.telegramBotToken || '', telegramChatId: dataSettings.telegramChatId || '' });
      }
      
      const newNotifs = Array.isArray(notifs) ? notifs : [];
      setNotifications(prev => {
        const prevUnread = prev.filter(n => !n.read).length;
        const currentUnread = newNotifs.filter(n => !n.read).length;
        if (currentUnread > prevUnread && prev.length > 0) {
          triggerToast("¡Nueva notificación recibida!", "success");
        }
        return newNotifs;
      });
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogin = async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('session_user', JSON.stringify(data));
        setActiveTab('dashboard');
        triggerToast(`Bienvenido de nuevo, ${data.name}`);
        refreshData(data);
      } else {
        triggerToast(data.error || "Credenciales inválidas", "error");
      }
    } catch (e) {
      triggerToast("Error de conexión", "error");
    }
  };

  const saveTelegramSettings = async (telegramBotToken: string, telegramChatId: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken, telegramChatId })
      });
      if (res.ok) {
        triggerToast("Ajustes de Telegram guardados");
        refreshData();
      } else {
        triggerToast("Error al guardar ajustes", "error");
      }
    } catch(e) { triggerToast("Error de conexión", "error"); }
  };
  
  const createUser = async (name: string, password?: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      });
      if (res.ok) {
        triggerToast(`Usuario ${name} creado con éxito`);
        refreshData();
      } else {
        const error = await res.json();
        triggerToast(error.error || 'Error al crear usuario', 'error');
      }
    } catch (e) {
      triggerToast('Error de conexión', 'error');
    }
  };

  const assignLicense = async (licenseId: string, userId: string) => {
    try {
      const res = await fetch('/api/licenses/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, userId })
      });
      if (res.ok) {
        triggerToast("Licencia asignada correctamente");
        refreshData();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error al asignar", "error");
    }
  };

  const revealLicense = async (licenseId: string) => {
    try {
      const res = await fetch('/api/users/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, userId: user.id })
      });
      if (res.ok) {
        triggerToast(`¡Licencia revelada con éxito!`);
        refreshData();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error al revelar licencia", "error");
    }
  };

  const requestLicense = async (product: string, count: number) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, product, count })
      });
      if (res.ok) {
        triggerToast("Solicitud enviada al administrador");
        refreshData();
        setShowRequestModal(false);
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error al solicitar licencia", "error");
    }
  };

  const addLicensesBulk = async (product: string, keysString: string, batchNote: string) => {
    const keys = keysString.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) {
      triggerToast("No se encontraron llaves para cargar", "error");
      return;
    }

    try {
      const res = await fetch('/api/licenses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, keys, batchNote })
      });
      if (res.ok) {
        const result = await res.json();
        triggerToast(`¡${result.added} nuevas cargadas! (${result.dupes} duplicados omitidos)`);
        refreshData();
        refreshStats();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error en carga masiva", "error");
    }
  };

  const assignLicensesBatch = async (userId: string, product: string, count: number) => {
    try {
      const res = await fetch('/api/users/assign-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, product, count })
      });
      if (res.ok) {
        triggerToast(`¡${count} licencias asignadas con éxito!`);
        refreshData();
        refreshStats();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error en asignación masiva", "error");
    }
  };

  const [bulkOpen, setBulkOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{show: boolean, userId: string, userName: string}>({show: false, userId: '', userName: ''});

  const changePassword = async (newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword })
      });
      if (res.ok) {
        triggerToast("Contraseña actualizada");
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error al cambiar contraseña", "error");
    }
  };

  const reportFailed = async (licenseId: string) => {
    try {
      const res = await fetch('/api/licenses/report-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, licenseId })
      });
      if (res.ok) {
        triggerToast("Fallo reportado al administrador", "error");
        refreshData(user);
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) {
      triggerToast("Error de conexión", "error");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Micro Licenses</h1>
            <p className="text-white/50 text-sm">Gestiona y adquiere tus llaves de software premium</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const target = e.target as any;
            handleLogin(target.identifier.value, target.password.value);
          }} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Usuario o Correo</label>
              <input required name="identifier" type="text" placeholder="hielo o correo@ejemplo.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Contraseña</label>
              <input required name="password" type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors" />
            </div>
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20">
              Entrar al Panel
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-white/20 italic">Acceso restringido a usuarios autorizados</p>
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 justify-center">
               <button onClick={() => handleLogin('hielo', 'admin123')} className="text-[10px] text-white/10 hover:text-white/30 uppercase tracking-widest font-bold">Modo Demo: hielo</button>
            </div>
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

  const role = user.role;
  const availableLicenses = db.licenses.filter(l => l.status === 'available').length;
  const assignedLicenses = db.licenses.filter(l => l.status === 'assigned' && !l.reportedFailed).length;
  const reportedLicensesCount = db.licenses.filter(l => l.reportedFailed).length;

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-white flex font-sans relative">
      <AnimatePresence>
        {showToast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            className={cn(
              "fixed bottom-10 left-1/2 px-8 py-4 rounded-3xl shadow-3xl flex items-center gap-3 z-[100] border backdrop-blur-md",
              showToast.type === 'success' ? "bg-emerald-500/90 border-emerald-400/50" : "bg-red-500/90 border-red-400/50"
            )}
          >
            {showToast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6 rotate-180" />}
            <span className="font-bold text-lg">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="hidden lg:flex w-72 border-r border-white/5 bg-[#080808] p-8 flex-col gap-10 z-50 relative">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-tight">MicroSec</span>
              <span className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Licensing</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          <NavItem active={activeTab === 'dashboard'} icon={LayoutDashboard} label="Resumen" onClick={() => setActiveTab('dashboard')} />
          {role === 'admin' ? (
            <>
              <NavItem active={activeTab === 'inventory'} icon={Package} label="Inventario" onClick={() => setActiveTab('inventory')} />
              <NavItem active={activeTab === 'users'} icon={Users} label="Usuarios" onClick={() => setActiveTab('users')} />
              <NavItem active={activeTab === 'catalog'} icon={Tag} label="Catálogo" onClick={() => setActiveTab('catalog')} />
            </>
          ) : (
            <>
              <NavItem active={activeTab === 'my-keys'} icon={Key} label="Mis Llaves" onClick={() => setActiveTab('my-keys')} />
            </>
          )}
          <div className="py-4"><div className="h-px bg-white/5 mx-2" /></div>
          <NavItem active={activeTab === 'settings'} icon={Settings} label="Ajustes" onClick={() => setActiveTab('settings')} />
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
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#111]" />
                )}
              </div>
              <span className="text-sm">Notificaciones</span>
            </div>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-md font-black">
                {notifications.filter(n => !n.read).length}
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
          <button onClick={() => { setUser(null); localStorage.removeItem('session_user'); setActiveTab('dashboard'); }} className="p-2 hover:bg-red-500/20 rounded-xl transition-all group/logout">
            <LogOut className="w-4 h-4 text-white/50 group-hover/logout:text-red-500" />
          </button>
        </div>
      </aside>

      {/* Notifications Panel Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="fixed top-0 bottom-0 left-0 lg:left-72 w-full sm:w-[22rem] bg-[#0a0a0a] border-r border-white/10 shadow-3xl z-[60] flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                <h3 className="font-black tracking-widest uppercase text-sm">Notificaciones</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="text-center text-white/30 font-bold uppercase tracking-widest text-[10px] mt-10 px-8">
                  No tienes notificaciones
                </div>
              ) : (
                [...notifications].reverse().slice(0, 20).map(n => (
                  <div key={n.id} className={cn(
                    "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                    !n.read ? "bg-blue-500/10 border-blue-500/20 shadow-lg shadow-blue-500/5 translate-x-1" : "bg-white/[0.02] border-white/5 opacity-60"
                  )}>
                    {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />}
                    <p className={cn(
                      "text-xs leading-snug mb-2 pr-4",
                      !n.read ? "font-bold text-white" : "font-medium text-white/50"
                    )}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="text-[9px] font-bold text-white/20 capitalize">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.filter(n => !n.read).length > 0 && (
              <div className="p-4 border-t border-white/10">
                <button 
                  onClick={async () => {
                   await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: role === 'admin' ? 'admin' : user.id }) });
                   refreshData(user);
                  }}
                  className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all"
                >
                  Marcar como Leídas (Limpiar)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top App Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 z-[80] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight">MicroSec</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5 text-white/70" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
            )}
          </button>
          
          <button 
            onClick={() => { setUser(null); localStorage.removeItem('session_user'); setActiveTab('dashboard'); }} 
            className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/20 transition-all"
            title="Cerrar Sesión"
          >
            {user.name.charAt(0)}
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 pt-20 sm:p-6 sm:pt-6 lg:p-12 overflow-auto relative z-10 bg-black/40 pb-24 lg:pb-12">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 lg:mb-12 gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                  role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                )}>
                  {role === 'admin' ? 'Administrative Access' : 'Verified User'}
                </span>
              </div>
              <h2 className="text-[1.35rem] sm:text-3xl lg:text-4xl font-extrabold tracking-tight capitalize leading-none mt-1">
                {activeTab === 'dashboard' ? 'Centro de Operaciones' : activeTab === 'inventory' ? 'Inventario Global' : activeTab === 'users' ? 'Gestión de Usuarios' : activeTab === 'settings' ? 'Seguridad y Perfil' : activeTab === 'catalog' ? 'Catálogo de Productos' : activeTab}
              </h2>
            </div>
          </div>
          
          <div className="bg-[#111] border border-white/10 rounded-2xl p-2 flex gap-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
             {role !== 'admin' && (
               <button className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors">Soporte</button>
             )}
             {role === 'admin' && activeTab === 'inventory' && (
               <button 
                 onClick={() => setBulkOpen(!bulkOpen)}
                 className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-extrabold hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 w-full justify-center sm:w-auto"
               >
                 <PlusCircle className="w-4 h-4" /> {bulkOpen ? 'Cerrar Cargador' : 'Cargar Inventario'}
               </button>
             )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-10">
                {role === 'admin' ? (
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
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Users className="w-6 h-6" /></div>
                        <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Keys Entregadas</span>
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
                ) : (
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
                )}

                {/* Low Stock Alerts */}
                {role === 'admin' && stats?.lowStock?.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8">
                    <h4 className="text-amber-500 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                       ⚠ Alerta: Inventario Bajo (Menos de 5 unidades)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {stats.lowStock.map((s: any) => (
                        <div key={s.product} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-sm font-bold text-white/80">{s.product}</span>
                          <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-lg">{s.count} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Requests Alerts */}
                {role === 'admin' && db.requests?.filter((r: any) => r.status === 'pending').length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 mt-6">
                    <h4 className="text-blue-500 font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                       🔔 Solicitudes Pendientes ({db.requests.filter((r: any) => r.status === 'pending').length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {db.requests.filter((r: any) => r.status === 'pending').map((r: any) => {
                        const rUser = db.users.find((u: any) => u.id === r.userId);
                        return (
                          <div key={r.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                            <div>
                               <span className="text-sm font-bold text-white/90 block">
                                 <span className="text-blue-400 mr-2">{r.count || 1}x</span>
                                 {r.product}
                               </span>
                               <span className="text-[10px] text-white/40">{rUser?.name} ({rUser?.email})</span>
                            </div>
                            <button onClick={async () => {
                               await fetch('/api/requests/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reqId: r.id }) });
                               triggerToast("Solicitud Resuelta");
                               refreshData();
                            }} className="text-[10px] bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-500 text-white font-bold py-2 rounded-lg transition-colors uppercase tracking-widest text-center mt-auto">
                               Marcar como Resuelta
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="bg-[#111] border border-white/10 rounded-[3rem] p-12 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-80" />
                  <div className="relative z-10">
                    <h3 className="text-5xl font-black mb-6 tracking-tighter uppercase">SISTEMA CONTROL<br /><span className="text-blue-500">KEY MANAGER</span></h3>
                    <p className="text-white/40 text-lg max-w-xl mb-10 leading-relaxed font-medium">Administra licencias, gestiona usuarios y monitorea el inventario en tiempo real con seguridad total.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && role === 'admin' && (
              <div className="space-y-6">
                {/* Sección de Carga Masiva (Acordeón) */}
                <AnimatePresence>
                  {bulkOpen && (
                    <motion.section 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-10"
                    >
                      <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-8 border-t-4 border-t-blue-600">
                        <div className="flex items-center gap-3 text-blue-500">
                          <PlusCircle className="w-6 h-6" />
                          <h3 className="text-xl font-black uppercase tracking-tighter">Cargar Inventario (Panel Directo)</h3>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as any;
                          addLicensesBulk(target.product.value, target.keysArr.value, target.batchNote.value);
                          target.reset();
                        }} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Producto Objetivo</label>
                              <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none scrollbar-hide">
                                {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                                  <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white">
                                    {items.map(item => (
                                      <option key={item} value={item} className="text-white bg-[#0f0f0f]">{item}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Nota del Lote (Proveedor)</label>
                              <input name="batchNote" placeholder="Ej: Lote #5 Proveedor X" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors" />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest pl-1">Claves de Producto (Pega tu lista aquí, una por línea)</label>
                            <textarea 
                              name="keysArr" 
                              required 
                              rows={6} 
                              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY-YYYYY" 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 font-mono text-sm focus:border-blue-500 outline-none transition-colors resize-none"
                            />
                          </div>

                          <button type="submit" className="w-full md:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs">
                            Iniciar Carga Masiva
                          </button>
                        </form>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Category Filters */}
                  <div className="flex flex-wrap gap-2 flex-1">
                    <button 
                      onClick={() => setInventoryFilter('all')}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryFilter === 'all' ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
                    >
                      🚀 Todo
                    </button>
                    {Object.keys(PRODUCT_CATALOG).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setInventoryFilter(cat)}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryFilter === cat ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
                      >
                        {cat.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex bg-[#111] border border-white/10 rounded-2xl p-1.5 shrink-0">
                     <button 
                       onClick={() => setInventoryStatusFilter('available')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'available' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-white/40 hover:text-white")}
                     >
                       🟢 Disponibles ({availableLicenses})
                     </button>
                     <button 
                       onClick={() => setInventoryStatusFilter('assigned')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'assigned' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white")}
                     >
                       📦 Asignadas ({assignedLicenses})
                     </button>
                     <button 
                       onClick={() => setInventoryStatusFilter('reported')}
                       className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", inventoryStatusFilter === 'reported' ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-white/40 hover:text-red-500/60")}
                     >
                       ⚠️ Reportadas ({reportedLicensesCount})
                     </button>
                   </div>
                 </div>

                <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><Package className="w-5 h-5 text-blue-500" /></div>
                        <h3 className="font-black text-xl tracking-tighter uppercase">Inventario: {inventoryFilter === 'all' ? 'Completo' : inventoryFilter}</h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                        <thead>
                          <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                            <th className="px-8 py-4">Producto</th>
                            <th className="px-8 py-4">Serial / Key</th>
                            {inventoryStatusFilter === 'available' ? (
                              <th className="px-8 py-4">Nota / Lote</th>
                            ) : (
                              <>
                                <th className="px-8 py-4">Asignado A</th>
                                <th className="px-8 py-4">Fecha de Asignación</th>
                              </>
                            )}
                          </tr>
                        </thead>
                         <tbody className="divide-y divide-white/5">
                           {db.licenses
                             .filter(l => {
                               if (inventoryStatusFilter === 'reported') return l.reportedFailed;
                               if (inventoryStatusFilter === 'assigned') return l.status === 'assigned' && !l.reportedFailed;
                               return l.status === 'available';
                             })
                             .filter(l => {
                               if (inventoryFilter === 'all') return true;
                               return PRODUCT_CATALOG[inventoryFilter as keyof typeof PRODUCT_CATALOG]?.includes(l.product);
                             })
                            .map(l => {
                               const assignedUser = (inventoryStatusFilter === 'assigned' || inventoryStatusFilter === 'reported') ? db.users.find(u => u.id === l.assignedTo) : null;
                              return (
                                 <tr key={l.id} className="group hover:bg-white/[0.01]">
                                   <td className="px-8 py-5 font-bold text-white/90">
                                     <div className="flex items-center gap-2">
                                       {l.product}
                                       {l.reportedFailed && <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">⚠️ Fallida</span>}
                                     </div>
                                   </td>
                                   <td className="px-8 py-5 font-mono text-xs text-blue-400/80">{l.key}</td>
                                  {inventoryStatusFilter === 'available' ? (
                                    <td className="px-8 py-5 text-white/40 text-xs italic">{l.batchNote || '—'}</td>
                                  ) : (
                                    <>
                                      <td className="px-8 py-5">
                                        <div className="font-bold text-white/90 text-sm">{assignedUser ? assignedUser.name : 'Desconocido'}</div>
                                        {assignedUser?.email && <div className="text-white/40 text-[10px] mt-0.5">{assignedUser.email}</div>}
                                      </td>
                                      <td className="px-8 py-5 text-white/40 text-xs">
                                        {l.assignedAt ? new Date(l.assignedAt).toLocaleString() : '—'}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'my-keys' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { setUserInventoryFilter('all'); setUserSubFilter(null); }}
                      className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userInventoryFilter === 'all' ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
                    >
                      🚀 Todo
                    </button>
                    {Object.keys(PRODUCT_CATALOG).filter(cat => 
                       db.licenses.some((l: any) => l.assignedTo === user.id && PRODUCT_CATALOG[cat as keyof typeof PRODUCT_CATALOG].includes(l.product))
                    ).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => { setUserInventoryFilter(cat); setUserSubFilter(null); }}
                        className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userInventoryFilter === cat ? "bg-white/10 text-white shadow-lg shadow-white/5" : "bg-white/5 text-white/40 hover:bg-white/10")}
                      >
                        {cat.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 shrink-0 flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Solicitar Nueva Licencia
                  </button>
                </div>

                {/* Sub Filter */}
                {userInventoryFilter !== 'all' && (
                  <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30 w-full mb-1">Filtrar por Variante (En Propiedad)</span>
                    {PRODUCT_CATALOG[userInventoryFilter as keyof typeof PRODUCT_CATALOG].map(productName => {
                      const count = db.licenses.filter((l: any) => l.assignedTo === user.id && l.product === productName).length;
                      if(count === 0) return null;
                      return (
                        <button 
                          key={productName}
                          onClick={() => setUserSubFilter(userSubFilter === productName ? null : productName)}
                          className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", userSubFilter === productName ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-black/40 text-white/60 hover:bg-black/60")}
                        >
                          {productName} <span className="text-white/40 ml-1">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 sm:p-8 border-b border-white/10 bg-white/[0.02]">
                      <h3 className="font-black text-xl tracking-tighter uppercase">Mis Licencias {userInventoryFilter !== 'all' && `- ${userInventoryFilter}`}</h3>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                      <thead>
                        <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                          <th className="px-8 py-4">Producto</th>
                          <th className="px-8 py-4">Serial / Key</th>
                          <th className="px-8 py-4">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {db.licenses
                          .filter((l: any) => l.assignedTo === user.id)
                          .filter((l: any) => {
                            if (userInventoryFilter === 'all') return true;
                            if (userSubFilter && l.product !== userSubFilter) return false;
                            return PRODUCT_CATALOG[userInventoryFilter as keyof typeof PRODUCT_CATALOG]?.includes(l.product);
                          })
                          .map((l: any) => (
                          <tr key={l.id} className="group hover:bg-white/[0.01]">
                            <td className="px-8 py-5 font-bold text-white/90">{l.product}</td>
                            <td className="px-8 py-5">
                              {l.claimed ? (
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs text-emerald-400 tracking-wider bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{l.key}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(l.key); triggerToast('Llave copiada al portapapeles'); }} className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors group" title="Copiar Llave">
                                    <Copy className="w-3.5 h-3.5 text-white/20 group-hover:text-blue-400" />
                                  </button>
                                  {!l.reportedFailed ? (
                                    <button onClick={() => reportFailed(l.id)} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors group" title="Reportar Falla">
                                      <AlertTriangle className="w-4 h-4 text-white/20 group-hover:text-red-500" />
                                    </button>
                                  ) : (
                                    <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 rounded border border-red-500/20">Falla Reportada</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-white/30 tracking-[0.3em] font-mono select-none">•••••••••••••••••••••</span>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              {l.claimed ? (
                                <span className="text-white/40 text-xs">{new Date(l.claimedAt || l.createdAt).toLocaleString()}</span>
                              ) : (
                                <button onClick={() => revealLicense(l.id)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                                  Revelar Llave
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {db.licenses.filter((l: any) => l.assignedTo === user.id && (userInventoryFilter === 'all' || PRODUCT_CATALOG[userInventoryFilter as keyof typeof PRODUCT_CATALOG]?.includes(l.product)) && (!userSubFilter || l.product === userSubFilter)).length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-8 py-10 text-center text-white/30 font-bold uppercase tracking-widest text-[10px]">
                              Aún no tienes licencias en esta categoría o variante
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && role === 'admin' && (
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
                  }} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95">
                    Crear Nuevo
                  </button>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {db.users.map(u => {
                    const userLicenses = db.licenses.filter(l => l.assignedTo === u.id).length;
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
                          <span className="font-mono text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">{userLicenses} keys</span>
                        </div>
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
                        </div>
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
                      {db.users.map(u => {
                        const userLicenses = db.licenses.filter(l => l.assignedTo === u.id).length;
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
                            <td className="px-8 py-5 font-mono text-xs">{userLicenses} keys active</td>
                            <td className="px-8 py-5 text-right">
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
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'catalog' && role === 'admin' && (
              <div className="space-y-4">
                {/* Catalog Header - stacks on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20"><Tag className="w-5 h-5 text-emerald-500" /></div>
                    <div>
                      <h3 className="font-black text-lg sm:text-xl tracking-tighter uppercase">Catálogo</h3>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{db.catalog.length} productos</span>
                    </div>
                  </div>
                  <button onClick={() => setShowCatalogModal({show: true, mode: 'create'})} className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95">
                    <PlusCircle className="w-4 h-4" /> Nuevo Producto
                  </button>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                    <div key={cat} className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1 border-b border-white/5 pb-2 mb-3">
                        {cat} — {items.length} items
                      </div>
                      {items.map((item, idx) => {
                        const catItem = db.catalog.find((c: any) => c.name === item);
                        const availableCount = db.licenses.filter((l: any) => l.product === item && l.status === 'available').length;
                        return (
                          <div key={catItem?.id || idx} className="bg-[#111] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 active:bg-white/[0.03] transition-colors shadow-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white/90 text-sm truncate">{item}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="font-mono text-emerald-400 font-black text-xs">${PRODUCT_PRICES[item]?.toFixed(2)}</span>
                                <span className={cn("font-mono text-[10px] font-black px-2 py-0.5 rounded-md", availableCount > 5 ? "text-emerald-400 bg-emerald-500/10" : availableCount > 0 ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10")}>{availableCount} in stock</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setShowCatalogModal({show: true, mode: 'edit', item: catItem})} className="p-2.5 bg-white/5 hover:bg-blue-500/20 rounded-xl transition-colors border border-white/5" title="Editar">
                                <Pencil className="w-4 h-4 text-blue-400" />
                              </button>
                              <button onClick={async () => {
                                if (confirm(`¿Eliminar "${item}" del catálogo?`)) {
                                  await fetch('/api/catalog', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: catItem?.id }) });
                                  triggerToast('Producto eliminado del catálogo');
                                  refreshData();
                                }
                              }} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors border border-white/5" title="Eliminar">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/40 h-14">
                        <th className="px-8 font-black">Producto</th>
                        <th className="px-8 font-black text-center">Precio (USD)</th>
                        <th className="px-8 font-black text-center">Stock Disponible</th>
                        <th className="px-8 font-black text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                        <React.Fragment key={cat}>
                          <tr className="bg-white/[0.02]">
                             <td colSpan={4} className="px-8 py-3.5 border-b border-white/5">
                               <div className="flex items-center gap-4">
                                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 shadow-lg shadow-blue-500/5">{cat}</span>
                                 <div className="h-px flex-1 bg-white/5" />
                                 <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{items.length} items</span>
                               </div>
                             </td>
                          </tr>
                          {items.map((item, idx) => {
                            const catItem = db.catalog.find((c: any) => c.name === item);
                            const availableCount = db.licenses.filter((l: any) => l.product === item && l.status === 'available').length;
                            return (
                              <tr key={catItem?.id || idx} className="group hover:bg-white/[0.01] transition-colors h-16">
                                <td className="px-8">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-white/90 text-[14px]">{item}</span>
                                  </div>
                                </td>
                                <td className="px-8 text-center">
                                  <span className="font-mono text-emerald-400 font-black text-sm">${PRODUCT_PRICES[item]?.toFixed(2)}</span>
                                </td>
                                <td className="px-8 text-center">
                                  <span className={cn("inline-flex font-mono text-xs font-black px-4 py-1.5 rounded-xl border", 
                                    availableCount > 5 ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : 
                                    availableCount > 0 ? "text-yellow-400 bg-yellow-500/5 border-yellow-500/10" : 
                                    "text-red-400 bg-red-500/5 border-red-500/10"
                                  )}>
                                    {availableCount}
                                  </span>
                                </td>
                                <td className="px-8 text-right">
                                  <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                                    <button onClick={() => setShowCatalogModal({show: true, mode: 'edit', item: catItem})} className="p-2.5 bg-white/5 hover:bg-blue-500/20 rounded-xl transition-colors border border-white/5" title="Editar">
                                      <Pencil className="w-4 h-4 text-blue-400" />
                                    </button>
                                    <button onClick={async () => {
                                      if (confirm(`¿Eliminar "${item}" del catálogo?`)) {
                                        await fetch('/api/catalog', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: catItem?.id }) });
                                        triggerToast('Producto eliminado del catálogo');
                                        refreshData();
                                      }
                                    }} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl transition-colors border border-white/5" title="Eliminar">
                                      <Trash2 className="w-4 h-4 text-red-400" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        }
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Catalog Create/Edit Modal */}
            <AnimatePresence>
              {showCatalogModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCatalogModal({show: false, mode: 'create'})} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-4xl text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                      <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase">
                      {showCatalogModal.mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
                    </h3>
                    <p className="text-white/40 text-sm mb-8 px-4 font-medium">
                      {showCatalogModal.mode === 'create' ? 'Agrega un nuevo producto a tu catálogo.' : 'Modifica la información del producto.'}
                    </p>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const target = e.target as any;
                      if (showCatalogModal.mode === 'create') {
                        const res = await fetch('/api/catalog', {
                          method: 'POST', headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ category: target.category.value, name: target.productName.value, price: target.price.value })
                        });
                        if (res.ok) { triggerToast('Producto agregado al catálogo'); } else { const d = await res.json(); triggerToast(d.error, 'error'); }
                      } else {
                        const res = await fetch('/api/catalog', {
                          method: 'PUT', headers: {'Content-Type': 'application/json'},
                          body: JSON.stringify({ id: showCatalogModal.item?.id, category: target.category.value, name: target.productName.value, price: target.price.value })
                        });
                        if (res.ok) { triggerToast('Producto actualizado'); } else { const d = await res.json(); triggerToast(d.error, 'error'); }
                      }
                      setShowCatalogModal({show: false, mode: 'create'});
                      refreshData();
                    }} className="space-y-6 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Categoría</label>
                        <select name="category" required defaultValue={showCatalogModal.item?.category || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-emerald-500 transition-colors">
                          <option value="Windows Keys" className="bg-[#0f0f0f] text-white">Windows Keys</option>
                          <option value="Office Keys" className="bg-[#0f0f0f] text-white">Office Keys</option>
                          <option value="Visio Keys" className="bg-[#0f0f0f] text-white">Visio Keys</option>
                          <option value="Project Keys" className="bg-[#0f0f0f] text-white">Project Keys</option>
                          <option value="Server Keys" className="bg-[#0f0f0f] text-white">Server Keys</option>
                          <option value="Antivirus" className="bg-[#0f0f0f] text-white">Antivirus</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Nombre del Producto</label>
                        <input name="productName" type="text" required defaultValue={showCatalogModal.item?.name || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-emerald-500 transition-colors" placeholder="Ej: Windows Pro 10/11 Phone" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Precio (USD)</label>
                        <input name="price" type="number" step="0.01" min="0" required defaultValue={showCatalogModal.item?.price || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-emerald-500 transition-colors" placeholder="Ej: 2.50" />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowCatalogModal({show: false, mode: 'create'})} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 bg-emerald-600 py-4 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all">
                          {showCatalogModal.mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal para Asignar Lote a Usuario */}
            <AnimatePresence>
              {showAssignModal.show && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignModal({show: false, userId: '', userName: ''})} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-4xl text-center"
                  >
                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                      <Key className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase">ASIGNAR A: {showAssignModal.userName}</h3>
                    <p className="text-white/40 text-sm mb-8 px-4 font-medium">Selecciona el producto y la cantidad de llaves que deseas transferir.</p>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const target = e.target as any;
                      assignLicensesBatch(showAssignModal.userId, target.product.value, parseInt(target.count.value));
                      setShowAssignModal({show: false, userId: '', userName: ''});
                    }} className="space-y-6 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Producto a Asignar</label>
                        <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-colors">
                          {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                            <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white">
                              {items.map(item => {
                                const availableCount = db.licenses.filter((l: any) => l.product === item && l.status === 'available').length;
                                return (
                                  <option key={item} value={item} disabled={availableCount === 0} className="text-white bg-[#0f0f0f]">
                                    {item} ({availableCount} disponibles)
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Cantidad de Llaves</label>
                        <input name="count" type="number" min="1" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-colors" placeholder="Ej: 5" />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowAssignModal({show: false, userId: '', userName: ''})} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all">Confirmar</button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-[#111] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-2xl border-l-[6px] border-l-blue-600">
                  <h3 className="text-3xl font-black mb-8 tracking-tighter uppercase">Seguridad y Cuenta</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const target = e.target as any;
                    if (target.pass.value === target.conf.value) {
                      changePassword(target.pass.value);
                    } else triggerToast("Contraseñas no coinciden", "error");
                  }} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nueva Contraseña</label>
                      <input name="pass" type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Confirmar Contraseña</label>
                      <input name="conf" type="password" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <button className="bg-blue-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Guardar Cambios</button>
                  </form>
                </div>

                {role === 'admin' && (
                  <div className="bg-[#111] border border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 max-w-2xl border-l-[6px] border-l-[#0088cc]">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-[#0088cc]/10 rounded-2xl">
                        <svg className="w-8 h-8 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                      </div>
                      <h3 className="text-3xl font-black tracking-tighter uppercase">Integración Telegram</h3>
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const target = e.target as any;
                      saveTelegramSettings(target.botToken.value, target.chatId.value);
                    }} className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#0088cc] tracking-widest">Bot API Token</label>
                        <input name="botToken" type="text" defaultValue={settings.telegramBotToken} placeholder="123456789:ABCdefGHIjklmNOPqrStuvwXYZ" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#0088cc] transition-colors font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#0088cc] tracking-widest">Admin Chat ID</label>
                        <input name="chatId" type="text" defaultValue={settings.telegramChatId} placeholder="-100123456789" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#0088cc] transition-colors font-mono text-xs" />
                      </div>
                      <button className="bg-[#0088cc] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#0077b3] transition-all shadow-lg shadow-[#0088cc]/20">Guardar API</button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0c0c0c] border-t border-white/5 lg:hidden flex items-center justify-around pb-safe h-16 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <MobileNavItem active={activeTab === 'dashboard'} icon={LayoutDashboard} label="Resumen" onClick={() => setActiveTab('dashboard')} />
        {role === 'admin' ? (
          <>
            <MobileNavItem active={activeTab === 'inventory'} icon={Package} label="Inventario" onClick={() => setActiveTab('inventory')} />
            <MobileNavItem active={activeTab === 'users'} icon={Users} label="Usuarios" onClick={() => setActiveTab('users')} />
            <MobileNavItem active={activeTab === 'catalog'} icon={Tag} label="Catálogo" onClick={() => setActiveTab('catalog')} />
            <MobileNavItem active={activeTab === 'settings'} icon={Settings} label="Ajustes" onClick={() => setActiveTab('settings')} />
          </>
        ) : (
          <>
            <MobileNavItem active={activeTab === 'my-keys'} icon={Key} label="Mis Llaves" onClick={() => setActiveTab('my-keys')} />
            <MobileNavItem active={activeTab === 'settings'} icon={Settings} label="Ajustes" onClick={() => setActiveTab('settings')} />
          </>
        )}
      </nav>

      {/* Ver Llaves del Usuario Modal */}
      <AnimatePresence>
        {viewUserLicenses.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewUserLicenses({show: false, userId: '', userName: ''})} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 sm:p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Llaves de {viewUserLicenses.userName}</h3>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Historial de licencias asignadas</p>
                </div>
                <button onClick={() => setViewUserLicenses({show: false, userId: '', userName: ''})} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6 text-white/40" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="bg-[#111] border border-white/10 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left whitespace-nowrap min-w-[600px]">
                    <thead>
                      <tr className="text-white/40 text-[10px] font-black border-b border-white/5 uppercase tracking-widest bg-black/20">
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4">Key</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {db.licenses.filter(l => l.assignedTo === viewUserLicenses.userId).length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-white/20 text-xs font-bold uppercase">No hay llaves asignadas</td></tr>
                      ) : (
                        db.licenses.filter(l => l.assignedTo === viewUserLicenses.userId).map(l => (
                          <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-xs font-bold">{l.product}</td>
                            <td className="px-6 py-4 font-mono text-[10px] text-blue-400">{l.key}</td>
                            <td className="px-6 py-4">
                              {l.reportedFailed ? (
                                <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-1 w-fit">⚠️ FALLIDA</span>
                              ) : l.claimed ? (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-1 w-fit">✅ REVELADA</span>
                              ) : (
                                <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-1 w-fit">📦 ASIGNADA</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[10px] text-white/30">{new Date(l.assignedAt || l.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request License Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-[#0d0d0d] border border-white/10 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 w-full max-w-md shadow-4xl relative"
            >
              <button onClick={() => setShowRequestModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col mb-8 items-center text-center">
                <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20 mb-6">
                   <PlusCircle className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                   <h3 className="text-2xl font-black tracking-tighter uppercase leading-none mb-2">Solicitar Licencia</h3>
                   <span className="text-sm tracking-widest text-white/40 font-medium font-sans block px-4">El admin recibirá tu petición directamente en su panel de control.</span>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                requestLicense(target.product.value, parseInt(target.count.value));
              }} className="space-y-6">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Seleccionar Producto</label>
                  <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none scrollbar-hide">
                    {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                      <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white">
                        {items.map(item => (
                          <option key={item} value={item} className="text-white bg-[#0f0f0f] py-2">
                            {item} — ${PRODUCT_PRICES[item]?.toFixed(2)} USD
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Cantidad Solicitada</label>
                  <input name="count" type="number" min="1" required defaultValue="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all">Enviar Solicitud</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function ProductCard({ product, credits, onClick }: { product: string, credits: number, onClick: () => void }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6 group shadow-2xl">
      <div className="flex justify-between items-start">
        <h4 className="text-2xl font-black">{product}</h4>
        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20"><Package className="w-6 h-6" /></div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Créditos Disp.</span>
          <span className="text-4xl font-black text-blue-500">{credits}</span>
        </div>
        <button onClick={onClick} className="bg-white text-black px-6 py-3 rounded-xl font-black hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest shadow-lg shadow-white/20">Reclamar 1</button>
      </div>
    </motion.div>
  );
}

function NavItem({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-xl sm:rounded-2xl transition-all font-bold",
      active ? "bg-white/10 text-white shadow-inner" : "text-white/70 hover:text-white hover:bg-white/5 active:scale-95"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-blue-500" : "text-white/70 group-hover:text-white")} />
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MobileNavItem({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "flex flex-col items-center justify-center w-full h-full transition-all gap-1 relative",
      active ? "text-blue-500" : "text-white/40 hover:text-white/70"
    )}>
      {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-1", active && "scale-110 drop-shadow-md")} />
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}

function StatCard({ title, value, color, subtitle }: { title: string, value: number, color: 'blue'|'emerald'|'purple', subtitle: string }) {
  const themes = {
    blue: "border-blue-500/10 text-blue-500",
    emerald: "border-emerald-500/10 text-emerald-500",
    purple: "border-purple-500/10 text-purple-500"
  };
  return (
    <div className={cn("bg-[#111] border rounded-[2rem] p-5 sm:p-8", themes[color])}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{title}</span>
      <div className="text-4xl sm:text-6xl font-black text-white mt-2 mb-2">{value}</div>
      <span className="text-xs font-bold opacity-30">{subtitle}</span>
    </div>
  );
}
