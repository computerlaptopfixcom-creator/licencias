'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  ArrowRight,
  Clock3,
  ShieldAlert,
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
import { FirstRunSetup } from '@/components/FirstRunSetup';
import { ProductCard } from '@/components/ui/ProductCard';

const INITIAL_DB = { users: [], licenses: [], requests: [], catalog: [], downloads: [], movements: [] };
const INITIAL_SETTINGS = {
  telegramBotToken: '',
  telegramChatId: '',
  brandName: 'Micro Licenses',
  appDescription: 'Gestiona y adquiere tus llaves de software premium',
  logoType: 'ShieldCheck',
  primaryColor: '#3b82f6',
  telegramWebhookUrl: ''
};

export default function Dashboard() {
  const [db, setDb] = useState<{ users: any[], licenses: any[], requests: any[], catalog: any[], downloads: any[], movements: any[] }>(INITIAL_DB);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showToast, setShowToast] = useState({ show: false, message: '', type: 'success' });
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
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  // Derive PRODUCT_CATALOG and PRODUCT_PRICES from db.catalog
  const PRODUCT_CATALOG: Record<string, string[]> = {};
  db.catalog.forEach((item: any) => {
    if (!PRODUCT_CATALOG[item.category]) PRODUCT_CATALOG[item.category] = [];
    PRODUCT_CATALOG[item.category].push(item.name);
  });

  async function refreshStats() {
    if (!user || user.role !== 'admin') {
      setStats(null);
      return;
    }
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (e) {}
  }

  async function refreshData(currentUser: any = user) {
    try {
      const isAdmin = currentUser?.role === 'admin';
      const requestsPromise = [
        isAdmin ? fetch('/api/users') : Promise.resolve(null),
        fetch('/api/licenses'),
        fetch('/api/requests'),
        fetch('/api/catalog'),
        fetch('/api/downloads'),
        fetch('/api/movements'),
        currentUser ? fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: isAdmin ? 'admin' : currentUser.id })}) : Promise.resolve(null),
        fetch('/api/settings')
      ];
      
      const [resUsers, resLicenses, resRequests, resCatalog, resDownloads, resMovements, resNotifs, resSettings] = await Promise.all(requestsPromise);
      
      if (resLicenses?.status === 401 || resRequests?.status === 401 || resSettings?.status === 401) {
        if (currentUser) {
          handleLogout();
        }
        return;
      }

      const users = resUsers && resUsers.ok ? await resUsers.clone().json().catch(() => []) : [];
      const licenses = resLicenses && resLicenses.ok ? await resLicenses.clone().json().catch(() => []) : [];
      const requests = resRequests && resRequests.ok ? await resRequests.clone().json().catch(() => []) : [];
      const catalog = resCatalog && resCatalog.ok ? await resCatalog.clone().json().catch(() => []) : [];
      const movements = resMovements && resMovements.ok ? await resMovements.clone().json().catch(() => []) : [];
      const notifs = resNotifs && resNotifs.ok ? await resNotifs.clone().json().catch(() => []) : [];
      const downloads = resDownloads && resDownloads.ok ? await resDownloads.clone().json().catch(() => []) : [];
      
      setDb({ 
        users: isAdmin && Array.isArray(users) ? users : [], 
        licenses: Array.isArray(licenses) ? licenses : [], 
        requests: Array.isArray(requests) ? requests : [], 
        catalog: Array.isArray(catalog) ? catalog : [],
        downloads: Array.isArray(downloads) ? downloads : [],
        movements: Array.isArray(movements) ? movements : []
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
  }

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
    setDb(INITIAL_DB);
    setNotifications([]);
    setStats(null);
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

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
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
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.role === 'admin' ? 'admin' : user.id })
      });
      if (res.ok) refreshData();
    } catch (e) {}
  };

  const createUser = async (name: string, password: string) => {
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
    const reviewNote = window.prompt('Nota opcional para esta aprobacion:', '') || '';
    try {
      const assignRes = await fetch('/api/users/assign-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, product, count })
      });

      if (!assignRes.ok) {
        const data = await assignRes.json();
        triggerToast(data.error || 'No se pudo asignar el stock', 'error');
        return;
      }

      const resolveRes = await fetch('/api/requests/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqId: id, reviewNote })
      });

      if (resolveRes.ok) {
        triggerToast('Solicitud aprobada');
        refreshData();
        refreshStats();
      } else {
        const data = await resolveRes.json();
        triggerToast(data.error, 'error');
      }
    } catch (e) { triggerToast('Error de conexion', 'error'); }
  };

  const rejectRequest = async (reqId: string) => {
    if (!window.confirm('Rechazar solicitud?')) return;
    const reviewNote = window.prompt('Motivo o nota para el usuario:', '') || '';
    try {
      const res = await fetch('/api/requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reqId, reviewNote })
      });
      if (res.ok) {
        triggerToast('Solicitud rechazada', 'error');
        refreshData();
        refreshStats();
      }
    } catch (e) { triggerToast('Error', 'error'); }
  };

  const revealLicense = async (licenseId: string) => {
    try {
      const res = await fetch('/api/users/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId, userId: user.id })
      });
      if (res.ok) {
        triggerToast('Licencia revelada');
        refreshData();
      } else {
        const data = await res.json();
        triggerToast(data.error, 'error');
      }
    } catch (e) { triggerToast('Error', 'error'); }
  };

  const reportFailed = async (licenseId: string) => {
    if (!window.confirm('Reportar falla?')) return;
    try {
      const res = await fetch('/api/licenses/report-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, licenseId })
      });
      if (res.ok) {
        triggerToast('Reportado', 'error');
        refreshData(user);
      }
    } catch (e) {}
  };

  const replaceLicense = async (licenseId: string) => {
    if (!window.confirm('Reemplazar automaticamente usando el inventario disponible?')) return;
    try {
      const res = await fetch('/api/licenses/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId })
      });
      if (res.ok) {
        triggerToast('Licencia reemplazada exitosamente');
        refreshData();
        refreshStats();
      } else {
        const data = await res.json();
        triggerToast(data.error || 'Error', 'error');
      }
    } catch (e) {
      triggerToast('Error de conexion', 'error');
    }
  };

  const requestLicense = async (product: string, count: number, priority: string, note: string) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, product, count, priority, note })
      });
      if (res.ok) {
        triggerToast('Solicitud enviada');
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
      minStock: Number(target.minStock.value),
      iconType: target.iconType.value,
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

  useEffect(() => {
    const savedUser = localStorage.getItem('session_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('session_user');
      }
    }

    fetch('/api/auth/init')
      .then((r) => r.json())
      .then((d) => {
        setNeedsSetup(d.needsSetup);
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  useEffect(() => {
    if (needsSetup === null) return;

    const runRefresh = () => {
      if (document.visibilityState !== 'visible') return;
      refreshData(user);
      if (user?.role === 'admin') {
        refreshStats();
      }
    };

    runRefresh();
    const interval = setInterval(runRefresh, user?.role === 'admin' ? 15000 : 30000);
    document.addEventListener('visibilitychange', runRefresh);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', runRefresh);
    };
  }, [needsSetup, user]);

  if (needsSetup === null) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (needsSetup) {
    return <FirstRunSetup onComplete={(u) => { setUser(u); setNeedsSetup(false); refreshData(u); refreshStats(); }} />;
  }

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
  const pendingRequests = db.requests.filter((request: any) => request.status === 'pending');
  const recentRequests = [...db.requests]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const recentReveals = [...db.licenses]
    .filter((license: any) => license.claimed)
    .sort((a: any, b: any) => new Date(b.claimedAt || b.createdAt || 0).getTime() - new Date(a.claimedAt || a.createdAt || 0).getTime())
    .slice(0, 5);
  const recentFailures = [...db.licenses]
    .filter((license: any) => license.reportedFailed)
    .sort((a: any, b: any) => new Date(b.reportedAt || 0).getTime() - new Date(a.reportedAt || 0).getTime())
    .slice(0, 5);
  const usersWithoutStock = db.users.filter((dbUser: any) => dbUser.role !== 'admin' && !db.licenses.some((license: any) => license.assignedTo === dbUser.id && !license.reportedFailed));
  const availableCountsByProduct = db.licenses.reduce((acc: Record<string, number>, license: any) => {
    if (license.status === 'available') {
      acc[license.product] = (acc[license.product] || 0) + 1;
    }
    return acc;
  }, {});
  const replenishmentProducts = [...db.catalog]
    .map((item: any) => {
      const minStock = Number(item.minStock ?? 5);
      const availableCount = availableCountsByProduct[item.name] || 0;
      return {
        ...item,
        minStock,
        availableCount,
        deficit: Math.max(minStock - availableCount, 0),
        recommendedLoad: Math.max(minStock * 2 - availableCount, 0)
      };
    })
    .filter((item: any) => item.availableCount <= item.minStock)
    .sort((a: any, b: any) => {
      if (b.deficit !== a.deficit) return b.deficit - a.deficit;
      return a.availableCount - b.availableCount;
    })
    .slice(0, 5);
  const myLicenses = db.licenses.filter((license: any) => license.assignedTo === user.id);
  const myPendingRequests = pendingRequests.filter((request: any) => request.userId === user.id);
  const myRequests = db.requests.filter((request: any) => request.userId === user.id);
  const myRecentLicenses = [...myLicenses]
    .sort((a: any, b: any) => new Date(b.assignedAt || b.createdAt || 0).getTime() - new Date(a.assignedAt || a.createdAt || 0).getTime())
    .slice(0, 4);
  const availableCatalog = db.catalog.filter((item: any) => (availableCountsByProduct[item.name] || 0) > 0);
  const userOwnedCategories = [...new Set(myLicenses.map((license: any) => {
    const catalogItem = db.catalog.find((item: any) => item.name === license.product);
    return catalogItem?.category;
  }).filter(Boolean))] as string[];

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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
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
                <>
                  <section className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Atencion Inmediata</h3>
                        <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest">Lo que requiere accion ahora mismo</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-400">
                          <Clock3 className="w-5 h-5" />
                          <h4 className="font-black uppercase tracking-widest text-sm">Solicitudes Pendientes</h4>
                        </div>
                        {pendingRequests.length === 0 ? (
                          <p className="text-white/30 font-bold text-sm">No hay solicitudes pendientes.</p>
                        ) : (
                          <div className="space-y-3">
                            {pendingRequests.slice(0, 3).map((request: any) => (
                              <button
                                key={request.id}
                                onClick={() => setActiveTab('dashboard')}
                                className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-black text-white">{request.userName}</p>
                                    <p className="text-white/40 text-xs">{request.count}x {request.product}</p>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-white/30" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                        <div className="flex items-center gap-3 text-red-400">
                          <ShieldAlert className="w-5 h-5" />
                          <h4 className="font-black uppercase tracking-widest text-sm">Licencias Fallidas</h4>
                        </div>
                        {recentFailures.length === 0 ? (
                          <p className="text-white/30 font-bold text-sm">No hay fallas por atender.</p>
                        ) : (
                          <div className="space-y-3">
                            {recentFailures.slice(0, 3).map((license: any) => (
                              <div key={license.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="font-black text-white">{license.product}</p>
                                <p className="text-white/40 text-xs">{license.reportedAt ? new Date(license.reportedAt).toLocaleString() : 'Sin fecha'}</p>
                              </div>
                            ))}
                            <button onClick={() => setActiveTab('inventory')} className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">
                              Revisar inventario reportado
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                        <div className="flex items-center gap-3 text-blue-400">
                          <AlertTriangle className="w-5 h-5" />
                          <h4 className="font-black uppercase tracking-widest text-sm">Reposicion</h4>
                        </div>
                        {replenishmentProducts.length === 0 ? (
                          <p className="text-white/30 font-bold text-sm">No hay productos por debajo de su minimo.</p>
                        ) : (
                          <div className="space-y-3">
                            {replenishmentProducts.map((item: any) => (
                              <div key={item.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-black text-white">{item.name}</p>
                                  <p className="text-white/40 text-xs">Disponible: {item.availableCount} / Minimo: {item.minStock}</p>
                                  <p className="text-white/20 text-[11px] uppercase tracking-widest mt-1">Sugerido cargar: {item.recommendedLoad}</p>
                                </div>
                                <button onClick={() => { setInventoryFilter(item.name); setActiveTab('inventory'); setBulkOpen(true); }} className="px-3 py-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                                  Cargar
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-black uppercase tracking-widest text-sm text-white/80">Actividad Reciente</h4>
                          <p className="text-white/30 text-xs">Ultimas revelaciones y solicitudes</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {recentReveals.slice(0, 3).map((license: any) => {
                          const owner = db.users.find((dbUser: any) => dbUser.id === license.assignedTo);
                          return (
                            <div key={license.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="font-black text-white">{owner?.name || 'Usuario'} revelo {license.product}</p>
                              <p className="text-white/40 text-xs">{license.claimedAt ? new Date(license.claimedAt).toLocaleString() : 'Sin fecha'}</p>
                            </div>
                          );
                        })}
                        {recentRequests.slice(0, 2).map((request: any) => (
                          <div key={request.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                            <p className="font-black text-white">{request.userName} solicito {request.count}x {request.product}</p>
                            <p className="text-white/40 text-xs">{new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                        ))}
                        {recentReveals.length === 0 && recentRequests.length === 0 && (
                          <p className="text-white/30 font-bold text-sm">Aun no hay actividad reciente para mostrar.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                      <div>
                        <h4 className="font-black uppercase tracking-widest text-sm text-white/80">Usuarios a Reabastecer</h4>
                        <p className="text-white/30 text-xs">Cuentas sin licencias activas</p>
                      </div>
                      {usersWithoutStock.length === 0 ? (
                        <p className="text-white/30 font-bold text-sm">Todos los usuarios tienen stock asignado o no requieren accion.</p>
                      ) : (
                        <div className="space-y-3">
                          {usersWithoutStock.slice(0, 5).map((dbUser: any) => (
                            <div key={dbUser.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3">
                              <div>
                                <p className="font-black text-white">{dbUser.name}</p>
                                <p className="text-white/40 text-xs">{dbUser.email || 'Sin email'}</p>
                              </div>
                              <button onClick={() => { setActiveTab('users'); setShowAssignModal({ show: true, userId: dbUser.id, userName: dbUser.name }); }} className="px-3 py-2 rounded-xl bg-white/5 text-white/70 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                                Asignar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <RequestsView requests={db.requests} role={role} onApprove={approveRequest} onReject={rejectRequest} />
                </>
              )}

              {role === 'user' && (
                <div className="space-y-10">
                  <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Estado Personal</h3>
                        <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest">Tu situacion actual dentro del sistema</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Licencias Totales</p>
                          <p className="text-4xl font-black mt-3">{myLicenses.length}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Por Revelar</p>
                          <p className="text-4xl font-black mt-3">{myLicenses.filter((license: any) => !license.claimed).length}</p>
                        </div>
                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Solicitudes Pendientes</p>
                          <p className="text-4xl font-black mt-3">{myPendingRequests.length}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={() => setActiveTab('my-keys')} className="px-5 py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all">
                          Ver mis llaves
                        </button>
                        <button onClick={() => setShowRequestModal(true)} className="px-5 py-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">
                          Solicitar licencia
                        </button>
                        <button onClick={() => setActiveTab('downloads')} className="px-5 py-4 rounded-2xl bg-white/5 text-white/70 border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                          Abrir descargas
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                      <div>
                        <h4 className="font-black uppercase tracking-widest text-sm text-white/80">Tu Actividad</h4>
                        <p className="text-white/30 text-xs">Movimientos recientes de tu cuenta</p>
                      </div>
                      {myRecentLicenses.length === 0 ? (
                        <p className="text-white/30 font-bold text-sm">Aun no tienes licencias recientes.</p>
                      ) : (
                        <div className="space-y-3">
                          {myRecentLicenses.map((license: any) => (
                            <div key={license.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="font-black text-white">{license.product}</p>
                              <p className="text-white/40 text-xs">{license.claimed ? 'Revelada' : 'Pendiente de revelar'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-[#111] border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-5 shadow-2xl">
                    <div>
                      <h4 className="font-black uppercase tracking-widest text-sm text-white/80">Estado de Solicitudes</h4>
                      <p className="text-white/30 text-xs">Seguimiento de tus pedidos mas recientes</p>
                    </div>
                    {myRequests.length === 0 ? (
                      <p className="text-white/30 font-bold text-sm">Aun no has enviado solicitudes.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...myRequests]
                          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 4)
                          .map((request: any) => (
                            <div key={request.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-black text-white">{request.product}</p>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${request.status === 'resolved' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : request.status === 'rejected' ? 'text-red-300 bg-red-500/10 border-red-500/20' : 'text-blue-300 bg-blue-500/10 border-blue-500/20'}`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-white/45 text-sm mt-2">{request.count}x pedido</p>
                              {request.note && <p className="text-white/30 text-xs mt-2">{request.note}</p>}
                              {request.reviewNote && <p className="text-white/25 text-xs mt-2">Respuesta: {request.reviewNote}</p>}
                            </div>
                          ))}
                      </div>
                    )}
                  </section>

                  <div className="flex items-end justify-between">
                    <div className="space-y-2">
                      <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Productos Disponibles</h3>
                      <p className="text-white/30 text-xs sm:text-sm font-bold uppercase tracking-widest">Adquiere tus licencias directamente</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {availableCatalog
                      .map((item: any) => (
                        <ProductCard 
                          key={item.id} 
                          product={item.name} 
                          stock={availableCountsByProduct[item.name] || 0} 
                          price={item.price}
                          iconType={item.iconType}
                          onClick={() => requestLicense(item.name, 1, 'normal', '')} 
                        />
                      ))}
                    {availableCatalog.length === 0 && (
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
              replaceLicense={replaceLicense}
              movements={db.movements}
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
            <DownloadsView downloads={db.downloads} role={role} onRefresh={refreshData} userCategories={userOwnedCategories} />
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
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Categoría</label>
                     <input required name="category" defaultValue={showCatalogModal.item?.category || ''} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Precio</label>
                     <input required type="number" name="price" defaultValue={showCatalogModal.item?.price || 1} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Stock Minimo</label>
                     <input required type="number" min="0" name="minStock" defaultValue={showCatalogModal.item?.minStock ?? 5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors" />
                   </div>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Icono de Marca (Opcional)</label>
                   <select name="iconType" defaultValue={showCatalogModal.item?.iconType || 'Package'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition-colors appearance-none bg-[#0a0a0a] text-white">
                     <option className="bg-[#0a0a0a] text-white" value="Package">📦 Genérico (Package)</option>
                     <option className="bg-[#0a0a0a] text-white" value="ShieldCheck">🛡️ Escudo / Antivirus (ShieldCheck)</option>
                     <option className="bg-[#0a0a0a] text-white" value="Monitor">🖥️ Sistema / OS (Monitor)</option>
                     <option className="bg-[#0a0a0a] text-white" value="Gamepad2">🎮 Juegos (Gamepad2)</option>
                     <option className="bg-[#0a0a0a] text-white" value="Music">🎵 Multimedia (Music)</option>
                     <option className="bg-[#0a0a0a] text-white" value="FileText">📄 Ofimática (FileText)</option>
                     <option className="bg-[#0a0a0a] text-white" value="Cloud">☁️ Nube / Server (Cloud)</option>
                   </select>
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
                   <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500 outline-none transition-colors appearance-none bg-[#0a0a0a] text-white">
                     {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                       <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white font-bold">
                         {items.map(item => (
                           <option className="bg-[#0a0a0a] text-white font-normal" key={item} value={item}>{item} ({db.licenses.filter(l => l.product === item && l.status === 'available').length} disponibles)</option>
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
                requestLicense(target.product.value, Number(target.count.value), target.priority.value, target.note.value);
              }} className="space-y-6 text-left">
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Seleccionar Producto</label>
                  <select name="product" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-blue-500 outline-none appearance-none bg-[#0a0a0a] text-white">
                    {Object.entries(PRODUCT_CATALOG).map(([cat, items]) => (
                      <optgroup key={cat} label={cat} className="bg-[#0a0a0a] text-white font-bold">
                        {items.map(item => (
                          <option key={item} value={item} className="bg-[#0a0a0a] text-white font-normal">{item}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Cantidad Solicitada</label>
                    <input name="count" type="number" min="1" required defaultValue="1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors appearance-none" />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Prioridad</label>
                    <select name="priority" defaultValue="normal" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none appearance-none bg-[#0a0a0a] text-white">
                      <option value="baja">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-white/40 tracking-widest pl-1">Nota o contexto</label>
                  <textarea name="note" rows={3} placeholder="Ej: La necesito para un cliente o renovacion urgente" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-colors resize-none" />
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

