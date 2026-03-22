import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'src/data/database.json');
const TEMPLATE_PATH = path.join(process.cwd(), 'src/data/database.template.json');

// Auto-initialize from template if database.json doesn't exist
function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    try {
      if (fs.existsSync(TEMPLATE_PATH)) {
        fs.copyFileSync(TEMPLATE_PATH, DB_PATH);
        console.log('✅ Database auto-initialized from template. Login: admin / admin123');
      }
    } catch (e) {
      console.error('Error auto-initializing database:', e);
    }
  }
}

const DEFAULT_CATALOG = [
  { id: 'cat_1', category: 'Windows Keys', name: 'Windows Pro 10/11 Phone', price: 3.00 },
  { id: 'cat_2', category: 'Windows Keys', name: 'Windows Home 10/11 Phone', price: 2.50 },
  { id: 'cat_3', category: 'Windows Keys', name: 'Win Cloud Retail Phone', price: 2.50 },
  { id: 'cat_4', category: 'Windows Keys', name: 'Win Enterprise MAK Phone', price: 5.00 },
  { id: 'cat_5', category: 'Windows Keys', name: 'Win Pro Workstation MAK Phone', price: 4.50 },
  { id: 'cat_6', category: 'Windows Keys', name: 'Win 2021 MAK LTSC Phone', price: 10.00 },
  { id: 'cat_7', category: 'Windows Keys', name: 'Windows Pro 10/11 Online (OEM)', price: 6.00 },
  { id: 'cat_8', category: 'Windows Keys', name: 'Windows Pro 10/11 Online (RETAIL)', price: 6.00 },
  { id: 'cat_9', category: 'Windows Keys', name: 'Windows Home 10/11 Online (OEM)', price: 6.00 },
  { id: 'cat_10', category: 'Office Keys', name: 'Office 2024 PP MAK & LTSC Phone', price: 7.00 },
  { id: 'cat_11', category: 'Office Keys', name: 'Office 2021 Pro Plus Phone', price: 3.00 },
  { id: 'cat_12', category: 'Office Keys', name: 'Office 2019 Pro Plus Phone', price: 2.50 },
  { id: 'cat_13', category: 'Office Keys', name: 'Office 2019 Home Business Phone', price: 4.00 },
  { id: 'cat_14', category: 'Office Keys', name: 'Office 2016 Pro Plus Phone', price: 2.50 },
  { id: 'cat_15', category: 'Office Keys', name: 'Office 2013 Pro Plus Phone', price: 3.50 },
  { id: 'cat_16', category: 'Visio Keys', name: 'Visio 2021 Pro Phone', price: 3.00 },
  { id: 'cat_17', category: 'Visio Keys', name: 'Visio 2019 Pro Phone', price: 3.00 },
  { id: 'cat_18', category: 'Project Keys', name: 'Project 2021 Pro Phone', price: 3.00 },
  { id: 'cat_19', category: 'Project Keys', name: 'Project 2019 Pro Phone', price: 3.00 },
  { id: 'cat_20', category: 'Server Keys', name: 'Server 2025 Datacenter Azure Phone', price: 6.00 },
  { id: 'cat_21', category: 'Server Keys', name: 'Server 2025 Standard Phone', price: 5.00 },
  { id: 'cat_22', category: 'Server Keys', name: 'Server 2021 Standard Phone', price: 4.00 },
  { id: 'cat_23', category: 'Server Keys', name: 'Server 2019 Standard Phone', price: 4.00 },
  { id: 'cat_24', category: 'Server Keys', name: 'Server 2016 Datacenter Phone', price: 4.00 },
  { id: 'cat_25', category: 'Server Keys', name: 'Server 2016 Standard Phone', price: 4.00 },
  { id: 'cat_26', category: 'Server Keys', name: 'Server 2012 Datacenter Phone', price: 7.00 }
];

export function getDb() {
  ensureDb();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(data);
    if (!db.requests) db.requests = [];
    if (!db.notifications) db.notifications = [];
    if (!db.settings) db.settings = { 
      telegramBotToken: '', 
      telegramChatId: '',
      brandName: 'Micro Licenses',
      appDescription: 'Gestiona y adquiere tus llaves de software premium',
      logoType: 'ShieldCheck',
      primaryColor: '#3b82f6',
      telegramWebhookUrl: ''
    };
    if (!db.downloads) db.downloads = [];
    if (!db.catalog || db.catalog.length === 0) {
      db.catalog = DEFAULT_CATALOG;
      saveDb(db);
    }
    return db;
  } catch (error) {
    return { 
      users: [], 
      licenses: [], 
      requests: [], 
      notifications: [], 
      catalog: DEFAULT_CATALOG, 
      downloads: [],
      settings: { 
        telegramBotToken: '', 
        telegramChatId: '',
        brandName: 'Micro Licenses',
        appDescription: 'Gestiona y adquiere tus llaves de software premium',
        logoType: 'ShieldCheck',
        primaryColor: '#3b82f6',
        telegramWebhookUrl: ''
      } 
    };
  }
}

export function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving db:', error);
  }
}

export function getSettings() {
  return getDb().settings;
}

export function updateSettings(data: { 
  telegramBotToken?: string, 
  telegramChatId?: string,
  brandName?: string,
  appDescription?: string,
  logoType?: string,
  primaryColor?: string,
  telegramWebhookUrl?: string
}) {
  const db = getDb();
  db.settings = { ...db.settings, ...data };
  saveDb(db);
  return { success: true };
}

export function getLicenses() {
  return getDb().licenses;
}

export function getUsers() {
  return getDb().users.map(({ password, ...safe }: any) => safe);
}

export function findUser(identifier: string) {
  const db = getDb();
  return db.users.find((u: any) => u.email === identifier || u.name === identifier);
}

export function findUserSafe(identifier: string) {
  const user = findUser(identifier);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

// Security: strip HTML-dangerous characters from user names to prevent stored XSS
function sanitizeName(name: string): string {
  return name.replace(/[<>"'&]/g, '').trim();
}

export function addUser(name: string, email?: string, password?: string, _role?: string) {
  const db = getDb();
  const role: 'admin' | 'user' = 'user'; // Always enforce 'user' role for security
  const safeName = sanitizeName(name);
  if (!safeName) return null; // Reject empty names after sanitization
  
  const existing = db.users.find((u: any) => (email && u.email === email) || u.name === safeName);
  if (existing) return null;
  
  const newUser = {
    id: `u_${crypto.randomUUID().slice(0, 8)}`,
    name: safeName,
    email: email || '',
    password: bcrypt.hashSync(password || '123456', 10),
    role,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb(db);
  return newUser;
}

export function deleteUser(userId: string) {
  const db = getDb();
  const userIdx = db.users.findIndex((u: any) => u.id === userId);
  if (userIdx === -1) return { success: false, error: 'Usuario no encontrado' };
  
  // Protect admin from self-deletion or deleting other admins for safety
  if (db.users[userIdx].role === 'admin') {
     return { success: false, error: 'No se pueden eliminar cuentas de administrador' };
  }

  // Unassign licenses to recover stock
  db.licenses.forEach((l: any) => {
    if (l.assignedTo === userId) {
      l.status = 'available';
      l.assignedTo = null;
      delete l.assignedAt;
      delete l.claimed;
      delete l.claimedAt;
    }
  });

  db.users.splice(userIdx, 1);
  saveDb(db);
  return { success: true };
}

export function addLicense(product: string, key: string) {
  const db = getDb();
  const newLicense = {
    id: `l_${crypto.randomUUID().slice(0, 8)}`,
    product,
    key,
    status: 'available',
    assignedTo: null
  };
  db.licenses.push(newLicense);
  saveDb(db);
  return newLicense;
}

export function addLicensesBulk(product: string, keys: string[], batchNote: string = '') {
  const db = getDb();
  const timestamp = new Date().toISOString();
  
  const existingKeysNormalized = db.licenses.map((l: any) => l.key.replace(/\s+/g, '').toUpperCase());
  
  let added = 0;
  let dupes = 0;

  keys.forEach(key => {
    const normKey = key.replace(/\s+/g, '').toUpperCase();
    if (existingKeysNormalized.includes(normKey)) {
      dupes++;
      return;
    }

    const newLicense = {
      id: `l_${crypto.randomUUID().slice(0, 8)}`,
      product,
      key,
      status: 'available',
      assignedTo: null,
      batchNote,
      createdAt: timestamp
    };
    db.licenses.push(newLicense);
    existingKeysNormalized.push(normKey);
    added++;
  });

  saveDb(db);
  return { added, dupes };
}

export function getInventoryStats() {
  const db = getDb();
  const stats: any = {
    total: db.licenses.length,
    available: db.licenses.filter((l: any) => l.status === 'available').length,
    assigned: db.licenses.filter((l: any) => l.status === 'assigned').length,
    failed: db.licenses.filter((l: any) => l.reportedFailed).length,
    users: db.users.length,
    requests: {
      total: db.requests.length,
      pending: db.requests.filter((r: any) => r.status === 'pending').length,
      resolved: db.requests.filter((r: any) => r.status === 'resolved').length,
      rejected: db.requests.filter((r: any) => r.status === 'rejected').length
    },
    lowStock: []
  };

  const products = [...new Set(db.licenses.map((l: any) => l.product))] as string[];
  products.forEach(p => {
    const count = db.licenses.filter((l: any) => l.product === p && l.status === 'available').length;
    if (count < 5) {
      stats.lowStock.push({ product: p, count });
    }
  });

  return stats;
}

export function assignLicense(licenseId: string, userId: string) {
  const db = getDb();
  const license = db.licenses.find((l: any) => l.id === licenseId);
  if (license && license.status === 'available') {
    license.status = 'assigned';
    license.assignedTo = userId;
    license.assignedAt = new Date().toISOString();
    saveDb(db);
    return true;
  }
  return false;
}

export function assignLicensesBatch(userId: string, product: string, count: number) {
  const db = getDb();
  let assignedCount = 0;
  const timestamp = new Date().toISOString();

  for (const license of db.licenses) {
    if (assignedCount >= count) break;
    if (license.product === product && license.status === 'available') {
      license.status = 'assigned';
      license.assignedTo = userId;
      license.assignedAt = timestamp;
      assignedCount++;
    }
  }

  if (assignedCount > 0) {
    createNotification(db, userId, `📦 <b>LICENCIAS ASIGNADAS</b>: Te han asignado <b>${assignedCount} licencia(s)</b> de <b>${product}</b>. ✅`);
    saveDb(db);
    return { success: true, count: assignedCount };
  }
  return { success: false, error: 'No hay suficientes licencias disponibles' };
}

export function claimOneLicense(userId: string, product: string) {
  const db = getDb();
  const license = db.licenses.find((l: any) => l.assignedTo === userId && l.product === product && !l.claimed);
  
  if (license) {
    license.claimed = true;
    license.claimedAt = new Date().toISOString();
    saveDb(db);
    return { success: true, license };
  }
  return { success: false, error: 'No tienes unidades/licencias sin reclamar de este producto' };
}

export function revealLicense(userId: string, licenseId: string) {
  const db = getDb();
  const license = db.licenses.find((l: any) => l.id === licenseId && l.assignedTo === userId && !l.claimed);
  
  if (license) {
    license.claimed = true;
    license.claimedAt = new Date().toISOString();
    
    const user = db.users.find((u: any) => u.id === userId);
    const userName = user ? user.name : 'Un usuario';
    createNotification(db, 'admin', `🔑 <b>LLAVE REVELADA</b>: ${userName} ha revelado una llave de <b>${license.product}</b>. ✨`);
    
    saveDb(db);
    return { success: true, license };
  }
  return { success: false, error: 'Licencia no encontrada o ya revelada' };
}

export function reportFailedLicense(userId: string, licenseId: string) {
  const db = getDb();
  const license = db.licenses.find((l: any) => l.id === licenseId && l.assignedTo === userId);
  
  if (license && !license.reportedFailed) {
    license.reportedFailed = true;
    license.reportedFailedAt = new Date().toISOString();
    
    const user = db.users.find((u: any) => u.id === userId);
    const userName = user ? user.name : 'Un usuario';
    
    createNotification(db, 'admin', `🚨 <b>REPORTE DE FALLO</b>: ${userName} indicó que la llave de <b>${license.product}</b> (<code>${license.key}</code>) no funciona. 🛠️`);
    
    saveDb(db);
    return { success: true };
  }
  return { success: false, error: 'Licencia no encontrada o ya reportada' };
}

export function getRequests() {
  return getDb().requests;
}

export function createRequest(userId: string, product: string, count: number = 1) {
  const db = getDb();
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substr(2, 9),
    userId,
    product,
    count,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  db.requests.push(newRequest);
  
  const user = db.users.find((u: any) => u.id === userId);
  const userName = user ? user.name : 'Un usuario';
  createNotification(db, 'admin', `🆕 <b>NUEVA SOLICITUD</b>: ${userName} pide <b>${count}x ${product}</b>. ⚡`);
  
  saveDb(db);
  return { success: true, request: newRequest };
}

export function resolveRequest(reqId: string) {
  const db = getDb();
  const req = db.requests.find((r: any) => r.id === reqId);
  if (req) {
    req.status = 'resolved';
    req.resolvedAt = new Date().toISOString();
    saveDb(db);
    return { success: true };
  }
  return { success: false, error: 'Solicitud no encontrada' };
}

export function rejectRequest(reqId: string) {
  const db = getDb();
  const req = db.requests.find((r: any) => r.id === reqId);
  if (req) {
    req.status = 'rejected';
    req.rejectedAt = new Date().toISOString();
    
    const user = db.users.find((u: any) => u.id === req.userId);
    if (user) {
      createNotification(db, user.id, `❌ <b>SOLICITUD RECHAZADA</b>: Tu pedido de <b>${req.count}x ${req.product}</b> no ha podido ser procesado. Contacta a soporte para más detalles. 🛠️`);
    }
    
    saveDb(db);
    return { success: true };
  }
  return { success: false, error: 'Solicitud no encontrada' };
}

// Notifications Handling
export function createNotification(db: any, userId: string, message: string) {
  db.notifications.push({
    id: 'notif_' + crypto.randomUUID().slice(0, 8),
    userId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });

  // Telegram Notifications Integration (Push to Admin)
  if (userId === 'admin' && db.settings?.telegramBotToken && db.settings?.telegramChatId) {
    fetch(`https://api.telegram.org/bot${db.settings.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: db.settings.telegramChatId, 
        text: message,
        parse_mode: 'HTML'
      })
    }).catch(e => console.error('Telegram notification error:', e));
  }
}

export function getNotifications(userId: string) {
  const db = getDb();
  return db.notifications.filter((n: any) => n.userId === userId);
}

export function markNotificationsAsRead(userId: string) {
  const db = getDb();
  let changed = false;
  db.notifications.forEach((n: any) => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) saveDb(db);
  return { success: true };
}

// Catalog Management
export function getCatalog() {
  return getDb().catalog;
}

export function addCatalogItem(category: string, name: string, price: number) {
  const db = getDb();
  const existing = db.catalog.find((c: any) => c.name === name);
  if (existing) return null;
  
  const newItem = {
    id: `cat_${crypto.randomUUID().slice(0, 8)}`,
    category,
    name,
    price
  };
  db.catalog.push(newItem);
  saveDb(db);
  return newItem;
}

export function updateCatalogItem(id: string, data: { category?: string, name?: string, price?: number }) {
  const db = getDb();
  const item = db.catalog.find((c: any) => c.id === id);
  if (!item) return { success: false, error: 'Producto no encontrado' };
  
  if (data.category !== undefined) item.category = data.category;
  if (data.name !== undefined) item.name = data.name;
  if (data.price !== undefined) item.price = data.price;
  
  saveDb(db);
  return { success: true, item };
}

export function deleteCatalogItem(id: string) {
  const db = getDb();
  const idx = db.catalog.findIndex((c: any) => c.id === id);
  if (idx === -1) return { success: false, error: 'Producto no encontrado' };
  
  db.catalog.splice(idx, 1);
  saveDb(db);
  return { success: true };
}

// Downloads Management
export function getDownloads() {
  return getDb().downloads || [];
}

export function addDownload(title: string, link: string, category: string) {
  const db = getDb();
  const newDownload = {
    id: `dw_${crypto.randomUUID().slice(0, 8)}`,
    title: title.trim(),
    link: link.trim(),
    category: category.trim(),
    createdAt: new Date().toISOString()
  };
  if (!db.downloads) db.downloads = [];
  db.downloads.push(newDownload);
  saveDb(db);
  return newDownload;
}

export function deleteDownload(id: string) {
  const db = getDb();
  if (!db.downloads) return { success: false, error: 'No hay descargas' };
  const idx = db.downloads.findIndex((d: any) => d.id === id);
  if (idx === -1) return { success: false, error: 'Descarga no encontrada' };
  
  db.downloads.splice(idx, 1);
  saveDb(db);
  return { success: true };
}

export function updateDownload(id: string, data: { title?: string, link?: string, category?: string }) {
  const db = getDb();
  if (!db.downloads) return { success: false, error: 'No hay descargas' };
  const download = db.downloads.find((d: any) => d.id === id);
  if (!download) return { success: false, error: 'Descarga no encontrada' };
  
  if (data.title !== undefined) download.title = data.title.trim();
  if (data.link !== undefined) download.link = data.link.trim();
  if (data.category !== undefined) download.category = data.category.trim();
  
  download.updatedAt = new Date().toISOString();
  saveDb(db);
  return { success: true, download };
}
