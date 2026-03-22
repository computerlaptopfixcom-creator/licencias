'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import Modular Components
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { StatCards } from '@/components/StatCards';
import { InventoryView } from '@/components/InventoryView';
import { MyKeysView } from '@/components/MyKeysView';
import { UsersView } from '@/components/UsersView';
import { CatalogView } from '@/components/CatalogView';
import { SettingsView } from '@/components/SettingsView';
import { RequestsView } from '@/components/RequestsView';
import { DownloadsView } from '@/components/DownloadsView';
import { LoginForm } from '@/components/LoginForm';
import { SetupAccountView } from '@/components/SetupAccountView';
import { ProductCard } from '@/components/ui/ProductCard';

export default function Dashboard() {
  const [db, setDb] = useState<{ users: any[], licenses: any[], requests: any[], catalog: any[], downloads: any[] }>({ users: [], licenses: [], requests: [], catalog: [], downloads: [] });
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showCatalogModal, setShowCatalogModal] = useState<{show: boolean, mode: 'create'|'edit', item?: any}>({show: false, mode: 'create'});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<{show: boolean, userId: string, userName: string}>({show: false, userId: '', userName: ''});
  const [viewUserLicenses, setViewUserLicenses] = useState<{show: boolean, userId: string, userName: string}>({show: false, userId: '', userName: ''});
  const [inventoryFilter, setInventoryFilter] = useState<'all' | string>('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'available' | 'assigned' | 'reported'>('available');
  const [userInventoryFilter, setUserInventoryFilter] = useState<'all' | string>('all');
  const [userSubFilter, setUserSubFilter] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const [settings, setSettings] = useState({ 
    telegramBotToken: '', 
    telegramChatId: '',
    brandName: 'Micro Licenses',
    appDescription: 'Gestiona y adquiere tus llaves de software premium',
    logoType: 'ShieldCheck',
    primaryColor: '#3b82f6',
    telegramWebhookUrl: ''
  });

  // Derive PRODUCT_CATALOG and PRODUCT_PRICES from db.catalog
  const PRODUCT_CATALOG: Record<string, string[]> = {};
  const PRODUCT_PRICES: Record<string, number> = {};
  db.catalog.forEach((item: any) => {
    if (!PRODUCT_CATALOG[item.category]) PRODUCT_CATALOG[item.category] = [];
    PRODUCT_CATALOG[item.category].push(item.name);
    PRODUCT_PRICES[item.name] = item.price;
  });

  useEffect(() => {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('session_user');
    let currentUser = null;
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        setUser(currentUser);
      } catch(e) { localStorage.removeItem('session_user'); }
    }
    refreshData(currentUser);
    refreshStats();

    const interval = setInterval(() => {
      refreshData(currentUser);
      refreshStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const refreshStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  };

  const refreshData = async (currentUser: any = user) => {
    try {
      const endpoints = [
        fetch('/api/users'),
        fetch('/api/licenses'),
        fetch('/api/requests'),
        fetch('/api/catalog'),
        fetch('/api/downloads'),
        currentUser ? fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.role === 'admin' ? 'admin' : currentUser.id })}) : Promise.resolve(null),
        fetch('/api/settings')
      ];
      
      const [resUsers, resLicenses, resRequests, resCatalog, resDownloads, resNotifs, resSettings] = await Promise.all(endpoints);
      
      if (resUsers?.status === 401 || resLicenses?.status === 401) {
        if (currentUser) {
          handleLogout();
        }
        return;
      }

      const users = resUsers && resUsers.ok ? await resUsers.clone().json().catch(() => []) : [];
      const licenses = resLicenses && resLicenses.ok ? await resLicenses.clone().json().catch(() => []) : [];
      const requests = resRequests && resRequests.ok ? await resRequests.clone().json().catch(() => []) : [];
      const catalog = resCatalog && resCatalog.ok ? await resCatalog.clone().json().catch(() => []) : [];
      const notifs = resNotifs && resNotifs.ok ? await resNotifs.clone().json().catch(() => []) : [];
      const downloads = resDownloads && resDownloads.ok ? await resDownloads.clone().json().catch(() => []) : [];
      
      setDb({ 
        users: Array.isArray(users) ? users : [], 
        licenses: Array.isArray(licenses) ? licenses : [], 
        requests: Array.isArray(requests) ? requests : [], 
        catalog: Array.isArray(catalog) ? catalog : [],
        downloads: Array.isArray(downloads) ? downloads : []
      });

      if (resSettings && resSettings.ok) {
        const dataSettings = await resSettings.json();
        setSettings({ 
          telegramBotToken: dataSettings.telegramBotToken || '', 
          telegramChatId: dataSettings.telegramChatId || '',
          brandName: dataSettings.brandName || 'Micro Licenses',
          appDescription: dataSettings.appDescription || 'Gestiona y adquiere tus llaves de software premium',
          logoType: dataSettings.logoType || 'ShieldCheck',
          primaryColor: dataSettings.primaryColor || '#3b82f6',
          telegramWebhookUrl: dataSettings.telegramWebhookUrl || ''
        });
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
    const cleanMessage = message.replace(/<[^>]*>?/gm, '');
    setShowToast({ show: true, message: cleanMessage, type });
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('session_user');
    setActiveTab('dashboard');
  };

  const updateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        triggerToast("Ajustes guardados correctamente");
        refreshData();
      } else {
        triggerToast("Error al guardar ajustes", "error");
      }
    } catch(e) { triggerToast("Error de conexión", "error"); }
  };

  const setupTelegram = async () => {
    try {
      const res = await fetch('/api/telegram/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) triggerToast("Webhook de Telegram configurado");
      else triggerToast(data.error, "error");
    } catch (e) { triggerToast("Error de conexión", "error"); }
  };

  const deactivateTelegram = async () => {
    try {
      const res = await fetch('/api/telegram/setup', { method: 'DELETE' });
      if (res.ok) triggerToast("Webhook eliminado");
    } catch (e) {}
  };

  const changePassword = async (newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword })
      });
      if (res.ok) triggerToast("Contraseña actualizada");
      else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error al cambiar contraseña", "error"); }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.role === 'admin' ? 'admin' : user.id })
      });
      if (res.ok) refreshData();
    } catch (e) {}
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
    } catch (e) { triggerToast('Error de conexión', 'error'); }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario "${name}"? Se recuperará su stock asignado.`)) return;
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        triggerToast(`Usuario eliminado correctamente`);
        refreshData();
      } else {
        const data = await res.json();
        triggerToast(data.error || "Error al eliminar usuario", "error");
      }
    } catch (e) { triggerToast("Error de conexión", "error"); }
  };

  const addLicensesBulk = async (product: string, keysString: string, batchNote: string) => {
    const keys = keysString.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) return triggerToast("No hay llaves para cargar", "error");
    try {
      const res = await fetch('/api/licenses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, keys, batchNote })
      });
      if (res.ok) {
        const result = await res.json();
        triggerToast(`¡${result.added} nuevas cargadas! (${result.dupes} omitidos)`);
        refreshData();
        refreshStats();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error en carga masiva", "error"); }
  };

  const assignLicensesBatch = async (userId: string, product: string, count: number) => {
    try {
      const res = await fetch('/api/users/assign-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, product, count })
      });
      if (res.ok) {
        triggerToast(`¡${count} licencias asignadas!`);
        refreshData();
        refreshStats();
        setShowAssignModal({show: false, userId: '', userName: ''});
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error en asignación", "error"); }
  };

  const approveRequest = async (id: string, userId: string, product: string, count: number) => {
    try {
      const res = await fetch('/api/requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: id, userId, product, count })
      });
      if (res.ok) {
        triggerToast("Solicitud aprobada");
        refreshData();
        refreshStats();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error de conexión", "error"); }
  };

  const rejectRequest = async (reqId: string) => {
    if (!window.confirm("¿Rechazar solicitud?")) return;
    try {
      const res = await fetch('/api/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqId })
      });
      if (res.ok) {
        triggerToast("Solicitud rechazada", "error");
        refreshData();
        refreshStats();
      }
    } catch (e) { triggerToast("Error", "error"); }
  };

  const revealLicense = async (licenseId: string) => {
    try {
      const res = await fetch('/api/users/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, userId: user.id })
      });
      if (res.ok) {
        triggerToast(`¡Licencia revelada!`);
        refreshData();
      } else {
        const data = await res.json();
        triggerToast(data.error, "error");
      }
    } catch (e) { triggerToast("Error", "error"); }
  };

  const reportFailed = async (licenseId: string) => {
    if (!window.confirm("¿Reportar falla?")) return;
    try {
      const res = await fetch('/api/licenses/report-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, licenseId })
      });
      if (res.ok) {
        triggerToast("Reportado", "error");
        refreshData(user);
      }
    } catch (e) {}
  };

  const requestLicense = async (product: string, count: number) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, product, count })
      });
      if (res.ok) {
        triggerToast("Solicitud enviada");
        refreshData();
        setShowRequestModal(false);
      }
    } catch (e) {}
  };

  const handleCatalogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const body = {
      name: target.name.value,
      category: target.category.value,
      price: Number(target.price.value),
      ...(showCatalogModal.item && { id: showCatalogModal.item.id })
    };
    try {
      const res = await fetch('/api/catalog', {
        method: showCatalogModal.mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        triggerToast("Catálogo actualizado");
        setShowCatalogModal({show: false, mode: 'create'});
        refreshData();
      }
    } catch (e) {}
  };

  if (!user) {
    return <LoginForm settings={settings} handleLogin={handleLogin} showToast={showToast} />;
  }

  if (user && user.mustChangeCredentials) {
    return <SetupAccountView settings={settings} user={user} onComplete={(u) => { setUser(u); localStorage.setItem('session_user', JSON.stringify(u)); }} triggerToast={triggerToast} />;
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
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-bold">{showToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        role={role} 
        settings={settings} 
        showNotifications={showNotifications} 
        setShowNotifications={setShowNotifications} 
        notifications={notifications} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <MobileNav 
          settings={settings} 
          notifications={notifications} 
          showNotifications={showNotifications} 
          setShowNotifications={setShowNotifications} 
          user={user} 
          onLogout={handleLogout} 
        />

        <NotificationsPanel 
          show={showNotifications} 
          onClose={() => setShowNotifications(false)} 
          notifications={notifications} 
          onMarkAllRead={markAllRead} 
        />

        <div className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 pt-24 lg:pt-16 pb-32">
          {activeTab === 'dashboard' && (
            <div className="space-y-16 lg:space-y-24">
              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Bienvenido, {user.name}</span>
                </div>
                <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tightest leading-[0.9] uppercase bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                  {role === 'admin' ? 'Estado del Panel' : 'Panel de Adquisición'}
                </h2>
              </div>

              <StatCards role={role} stats={stats} user={user} db={db} />

              {role === 'admin' && (
                <RequestsView requests={db.requests} role={role} onApprove={approveRequest} onReject={rejectRequest} />
              )}

              {role === 'user' && (
                <div className="space-y-10">
                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Productos Disponibles</h3>
                      <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest">Adquiere tus licencias directamente</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {db.catalog
                      .filter((item: any) => db.licenses.filter(l => l.product === item.name && l.status === 'available').length > 0)
                      .map((item: any) => (
                        <ProductCard 
                          key={item.id} 
                          product={item.name} 
                          stock={db.licenses.filter(l => l.product === item.name && l.status === 'available').length} 
                          price={item.price}
                          onClick={() => requestLicense(item.name, 1)} 
                        />
                      ))}
                    {db.catalog.filter((item: any) => db.licenses.filter(l => l.product === item.name && l.status === 'available').length > 0).length === 0 && (
                      <div className="col-span-full border border-white/10 border-dashed rounded-[3rem] p-20 text-center space-y-4">
                        <p className="text-white/20 font-black uppercase tracking-widest text-sm">No hay productos con stock disponible hoy</p>
                        <button onClick={() => setShowRequestModal(true)} className="px-8 py-3 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Solicitar Pedido Especial</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inventory' && role === 'admin' && (
            <InventoryView 
              db={db} role={role} 
              inventoryFilter={inventoryFilter} setInventoryFilter={setInventoryFilter} 
              inventoryStatusFilter={inventoryStatusFilter} setInventoryStatusFilter={setInventoryStatusFilter} 
              bulkOpen={bulkOpen} setBulkOpen={setBulkOpen} 
              PRODUCT_CATALOG={PRODUCT_CATALOG} 
              addLicensesBulk={addLicensesBulk} 
              availableLicenses={availableLicenses} assignedLicenses={assignedLicenses} reportedLicensesCount={reportedLicensesCount} 
            />
          )}

          {activeTab === 'my-keys' && (
            <MyKeysView 
              db={db} user={user} 
              userInventoryFilter={userInventoryFilter} setUserInventoryFilter={setUserInventoryFilter} 
              userSubFilter={userSubFilter} setUserSubFilter={setUserSubFilter} 
              PRODUCT_CATALOG={PRODUCT_CATALOG} 
              setShowRequestModal={setShowRequestModal} 
              triggerToast={triggerToast} 
              reportFailed={reportFailed} revealLicense={revealLicense} 
            />
          )}

          {activeTab === 'users' && role === 'admin' && (
            <UsersView 
              db={db} role={role} 
              createUser={createUser} 
              deleteUser={deleteUser}
              setViewUserLicenses={setViewUserLicenses} 
              setShowAssignModal={setShowAssignModal}
            />
          )}

          {activeTab === 'catalog' && role === 'admin' && (
            <CatalogView db={db} role={role} setShowCatalogModal={setShowCatalogModal} />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              settings={settings} setSettings={setSettings} 
              saveSettings={updateSettings} 
              setupTelegram={setupTelegram} deactivateTelegram={deactivateTelegram} 
              changePassword={changePassword} user={user} 
            />
          )}


          {activeTab === 'downloads' && (
            <DownloadsView downloads={db.downloads} role={role} onRefresh={refreshData} />
          )}
        </div>
      </main>

      {/* Modals & Dialogs */}
      <AnimatePresence>
        {showCatalogModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-3xl space-y-8">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black uppercase tracking-tighter">{showCatalogModal.mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}</h3>
                 <button onClick={() => setShowCatalogModal({show: false, mode: 'create'})} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleCatalogAction} className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Nombre</label>
                   <input required name="name" defaultValue={showCatalogModal.item?.name || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Categoría</label>
                     <input required name="category" defaultValue={showCatalogModal.item?.category || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Precio</label>
                     <input required type="number" name="price" defaultValue={showCatalogModal.item?.price || 1} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                   </div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">{showCatalogModal.mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}</button>
               </form>
             </motion.div>
          </div>
        )}

        {showAssignModal.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-3xl text-center space-y-8">
               <div className="space-y-2">
                 <h3 className="text-3xl font-black uppercase tracking-tight">Asignar Lote</h3>
                 <p className="text-white/40 text-sm">Transfiere llaves de stock al usuario <span className="text-blue-500 font-bold">{showAssignModal.userName}</span></p>
               </div>
               <form onSubmit={(e) => {
                 e.preventDefault();
                 const target = e.target as any;
                 assignLicensesBatch(showAssignModal.userId, target.product.value, Number(target.count.value));
               }} className="space-y-6 text-left">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Seleccionar Producto</label>
                   <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[#0a0a0a]">
                     {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                       <optgroup key={cat} label={cat}>
                         {items.map(item => (
                           <option key={item} value={item}>{item} ({db.licenses.filter(l => l.product === item && l.status === 'available').length} disponibles)</option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Cantidad a Transferir</label>
                   <input name="count" type="number" min="1" required defaultValue="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm" />
                 </div>
                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowAssignModal({show: false, userId: '', userName: ''})} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-colors">Cancelar</button>
                   <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-2xl text-xs font-black tracking-widest uppercase shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all">Confirmar Transferencia</button>
                 </div>
               </form>
             </motion.div>
          </div>
        )}

        {viewUserLicenses.show && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-[2.5rem] shadow-3xl flex flex-col max-h-[80vh]">
               <div className="p-8 border-b border-white/10 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-widest">Llaves de {viewUserLicenses.userName}</h3>
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1">Total: {db.licenses.filter(l => l.assignedTo === viewUserLicenses.userId).length} licencias</p>
                  </div>
                  <button onClick={() => setViewUserLicenses({show: false, userId: '', userName: ''})} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X className="w-5 h-5 text-white/40" /></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 scrollbar-hide">
                 {db.licenses.filter(l => l.assignedTo === viewUserLicenses.userId).length === 0 ? (
                   <div className="py-20 text-center text-white/20 font-black uppercase tracking-widest">Sin stock asignado</div>
                 ) : (
                   db.licenses.filter(l => l.assignedTo === viewUserLicenses.userId).map(l => (
                     <div key={l.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between group">
                       <div className="flex flex-col gap-1">
                         <span className="text-sm font-black text-white/90">{l.product}</span>
                         <span className="font-mono text-[10px] text-blue-500/60 uppercase tracking-widest">{l.key.slice(0, 10)}... (Protegido)</span>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", l.claimed ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20")}>{l.claimed ? 'Revelada' : 'No Revelada'}</span>
                          <span className="text-[9px] text-white/20 font-bold">{l.assignedAt ? new Date(l.assignedAt).toLocaleDateString() : 'Fecha Desconocida'}</span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
             </motion.div>
          </div>
        )}

        {showRequestModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#111] border border-white/10 rounded-[3rem] p-10 shadow-3xl text-center space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tight">Nueva Solicitud</h3>
                <p className="text-white/40 text-sm">Tu administrador procesará el pedido en breve</p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const target = e.target as any;
                requestLicense(target.product.value, Number(target.count.value));
              }} className="space-y-6 text-left">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Seleccionar Producto</label>
                  <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500 outline-none appearance-none bg-[#0a0a0a]">
                    {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                      <optgroup key={cat} label={cat} className="bg-[#0a0a0a]">
                        {items.map(item => (
                          <option key={item} value={item} className="bg-[#0a0a0a]">{item}</option>
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
