import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'src/data/database.sqlite');
const LEGACY_JSON_PATH = path.join(process.cwd(), 'src/data/database.json');

let db: Database.Database;

const DEFAULT_CATALOG: any[] = [
  { id: 'cat_1', category: 'Windows Keys', name: 'Windows Pro 10/11 Phone', price: 3.00, minStock: 5 },
  { id: 'cat_2', category: 'Windows Keys', name: 'Windows Home 10/11 Phone', price: 2.50, minStock: 5 },
  { id: 'cat_3', category: 'Windows Keys', name: 'Win Cloud Retail Phone', price: 2.50, minStock: 5 },
  { id: 'cat_4', category: 'Windows Keys', name: 'Win Enterprise MAK Phone', price: 5.00, minStock: 4 },
  { id: 'cat_5', category: 'Windows Keys', name: 'Win Pro Workstation MAK Phone', price: 4.50, minStock: 4 },
  { id: 'cat_6', category: 'Windows Keys', name: 'Win 2021 MAK LTSC Phone', price: 10.00, minStock: 3 },
  { id: 'cat_7', category: 'Windows Keys', name: 'Windows Pro 10/11 Online (OEM)', price: 6.00, minStock: 4 },
  { id: 'cat_8', category: 'Windows Keys', name: 'Windows Pro 10/11 Online (RETAIL)', price: 6.00, minStock: 4 },
  { id: 'cat_9', category: 'Windows Keys', name: 'Windows Home 10/11 Online (OEM)', price: 6.00, minStock: 4 },
  { id: 'cat_10', category: 'Office Keys', name: 'Office 2024 PP MAK & LTSC Phone', price: 7.00, minStock: 4 },
  { id: 'cat_11', category: 'Office Keys', name: 'Office 2021 Pro Plus Phone', price: 3.00, minStock: 6 },
  { id: 'cat_12', category: 'Office Keys', name: 'Office 2019 Pro Plus Phone', price: 2.50, minStock: 6 },
  { id: 'cat_13', category: 'Office Keys', name: 'Office 2019 Home Business Phone', price: 4.00, minStock: 4 },
  { id: 'cat_14', category: 'Office Keys', name: 'Office 2016 Pro Plus Phone', price: 2.50, minStock: 4 },
  { id: 'cat_15', category: 'Office Keys', name: 'Office 2013 Pro Plus Phone', price: 3.50, minStock: 3 },
  { id: 'cat_16', category: 'Visio Keys', name: 'Visio 2021 Pro Phone', price: 3.00, minStock: 3 },
  { id: 'cat_17', category: 'Visio Keys', name: 'Visio 2019 Pro Phone', price: 3.00, minStock: 3 },
  { id: 'cat_18', category: 'Project Keys', name: 'Project 2021 Pro Phone', price: 3.00, minStock: 3 },
  { id: 'cat_19', category: 'Project Keys', name: 'Project 2019 Pro Phone', price: 3.00, minStock: 3 },
  { id: 'cat_20', category: 'Server Keys', name: 'Server 2025 Datacenter Azure Phone', price: 6.00, minStock: 2 },
  { id: 'cat_21', category: 'Server Keys', name: 'Server 2025 Standard Phone', price: 5.00, minStock: 2 },
  { id: 'cat_22', category: 'Server Keys', name: 'Server 2021 Standard Phone', price: 4.00, minStock: 2 },
  { id: 'cat_23', category: 'Server Keys', name: 'Server 2019 Standard Phone', price: 4.00, minStock: 2 },
  { id: 'cat_24', category: 'Server Keys', name: 'Server 2016 Datacenter Phone', price: 4.00, minStock: 2 },
  { id: 'cat_25', category: 'Server Keys', name: 'Server 2016 Standard Phone', price: 4.00, minStock: 2 },
  { id: 'cat_26', category: 'Server Keys', name: 'Server 2012 Datacenter Phone', price: 7.00, minStock: 2 }
];

export function initDb() {
  if (db) return;
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      mustChangeCredentials INTEGER DEFAULT 0,
      telegramUserId TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS catalog (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      iconType TEXT,
      minStock INTEGER NOT NULL DEFAULT 5
    );
    CREATE TABLE IF NOT EXISTS licenses (
      id TEXT PRIMARY KEY,
      product TEXT NOT NULL,
      key TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      assignedTo TEXT,
      assignedAt TEXT,
      assignedBy TEXT,
      claimed INTEGER DEFAULT 0,
      claimedAt TEXT,
      reportedFailed INTEGER DEFAULT 0,
      reportedAt TEXT,
      batchNote TEXT,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      product TEXT NOT NULL,
      count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      resolvedAt TEXT,
      rejectedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      link TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      telegramBotToken TEXT DEFAULT '',
      telegramChatId TEXT DEFAULT '',
      brandName TEXT DEFAULT 'Micro Licenses',
      appDescription TEXT DEFAULT 'Gestiona y adquiere tus llaves de software premium',
      logoType TEXT DEFAULT 'ShieldCheck',
      primaryColor TEXT DEFAULT '#3b82f6',
      telegramWebhookUrl TEXT DEFAULT ''
    );
  `);

  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as any;
  if (hasSettings.count === 0) {
    db.prepare('INSERT INTO settings (id) VALUES (1)').run();
  }

  const hasUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (hasUsers.count === 0 && fs.existsSync(LEGACY_JSON_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(LEGACY_JSON_PATH, 'utf8'));
      migrateData(data);
      console.log('✅ Base de datos migrada exitosamente de JSON a SQLite.');
    } catch (e) {
      console.error('Error migrando JSON a SQLite:', e);
    }
  }

  const hasCatalog = db.prepare('SELECT COUNT(*) as count FROM catalog').get() as any;
  if (hasCatalog.count === 0) {
    const insertCat = db.prepare(`INSERT INTO catalog (id, category, name, price, minStock) VALUES (?, ?, ?, ?, ?)`);
    db.transaction(() => {
      for (const c of DEFAULT_CATALOG) {
        insertCat.run(c.id, c.category, c.name, c.price, c.minStock);
      }
    })();
  }
}

function migrateData(data: any) {
  const insertUser = db.prepare(`INSERT OR REPLACE INTO users (id, name, email, password, role, mustChangeCredentials, telegramUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertLic = db.prepare(`INSERT OR REPLACE INTO licenses (id, product, key, status, assignedTo, assignedAt, assignedBy, claimed, claimedAt, reportedFailed, reportedAt, batchNote, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertReq = db.prepare(`INSERT OR REPLACE INTO requests (id, userId, userName, product, count, status, createdAt, resolvedAt, rejectedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertNotif = db.prepare(`INSERT OR REPLACE INTO notifications (id, userId, message, type, read, createdAt) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertCat = db.prepare(`INSERT OR REPLACE INTO catalog (id, category, name, price, iconType, minStock) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertDown = db.prepare(`INSERT OR REPLACE INTO downloads (id, title, link, category, description, featured, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  db.transaction(() => {
    for (const u of (data.users || [])) {
      insertUser.run(u.id, u.name, u.email, u.password, u.role, u.mustChangeCredentials ? 1 : 0, u.telegramUserId || null, u.createdAt || new Date().toISOString());
    }
    for (const l of (data.licenses || [])) {
      insertLic.run(l.id, l.product, l.key, l.status, l.assignedTo || null, l.assignedAt || null, l.assignedBy || null, l.claimed ? 1 : 0, l.claimedAt || null, l.reportedFailed ? 1 : 0, l.reportedAt || null, l.batchNote || null, l.createdAt || null);
    }
    for (const r of (data.requests || [])) {
      insertReq.run(r.id, r.userId, r.userName, r.product, r.count, r.status, r.createdAt || new Date().toISOString(), r.resolvedAt || null, r.rejectedAt || null);
    }
    for (const n of (data.notifications || [])) {
      insertNotif.run(n.id, n.userId, n.message, n.type || 'info', n.read ? 1 : 0, n.createdAt || new Date().toISOString());
    }
    for (const c of (data.catalog || [])) {
      insertCat.run(c.id, c.category, c.name, c.price, c.iconType || null, c.minStock || 5);
    }
    for (const d of (data.downloads || [])) {
      insertDown.run(d.id, d.title, d.link, d.category, d.description || null, d.featured ? 1 : 0, d.createdAt || new Date().toISOString(), d.updatedAt || null);
    }
    if (data.settings) {
      const s = data.settings;
      db.prepare(`UPDATE settings SET telegramBotToken=?, telegramChatId=?, brandName=?, appDescription=?, logoType=?, primaryColor=?, telegramWebhookUrl=? WHERE id=1`)
        .run(s.telegramBotToken || '', s.telegramChatId || '', s.brandName || 'Micro Licenses', s.appDescription || '', s.logoType || 'ShieldCheck', s.primaryColor || '#3b82f6', s.telegramWebhookUrl || '');
    }
  })();
}

initDb();

function mapUser(u: any) { return { ...u, mustChangeCredentials: !!u.mustChangeCredentials }; }
function mapLicense(l: any) { return { ...l, claimed: !!l.claimed, reportedFailed: !!l.reportedFailed }; }
function mapNotif(n: any) { return { ...n, read: !!n.read }; }

export function getDb() {
  const users = db.prepare('SELECT * FROM users').all().map(mapUser);
  const licenses = db.prepare('SELECT * FROM licenses').all().map(mapLicense);
  const requests = db.prepare('SELECT * FROM requests').all();
  const notifications = db.prepare('SELECT * FROM notifications').all().map(mapNotif);
  const catalog = db.prepare('SELECT * FROM catalog').all();
  const downloads = db.prepare('SELECT * FROM downloads').all();
  const settingsRow = db.prepare('SELECT * FROM settings WHERE id=1').get();
  
  return {
    users,
    licenses,
    requests,
    notifications,
    catalog,
    downloads,
    settings: settingsRow
  };
}

export function saveDb(data: any) {
  console.warn("saveDb() is deprecated in SQLite mode. Use atomic mutators instead.");
}

export function getSettings(): any {
  return db.prepare('SELECT * FROM settings WHERE id=1').get() as any;
}

export function getLicenses() {
  return db.prepare('SELECT * FROM licenses').all().map(mapLicense);
}

export function getUsers() {
  return db.prepare('SELECT * FROM users').all().map(u => {
    const user = mapUser(u);
    delete user.password;
    return user;
  });
}

export function findUser(identifier: string) {
  const u = db.prepare('SELECT * FROM users WHERE email = ? OR name = ?').get(identifier, identifier);
  return u ? mapUser(u) : null;
}

export function findUserSafe(identifier: string) {
  const user = findUser(identifier);
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

export function updateSettings(data: any) {
  const current = getSettings() as any;
  const merged = { ...current, ...data };
  db.prepare(`UPDATE settings SET telegramBotToken=?, telegramChatId=?, brandName=?, appDescription=?, logoType=?, primaryColor=?, telegramWebhookUrl=? WHERE id=1`)
    .run(merged.telegramBotToken, merged.telegramChatId, merged.brandName, merged.appDescription, merged.logoType, merged.primaryColor, merged.telegramWebhookUrl);
  return { success: true };
}

function sanitizeName(name: string): string {
  return name.replace(/[<>"'&]/g, '').trim();
}

export function createInitialAdmin(name: string, passwordHash: string) {
  const safeName = sanitizeName(name);
  if (!safeName) return null;
  const user = {
    id: `u_${crypto.randomUUID().slice(0, 8)}`,
    name: safeName,
    email: '',
    password: passwordHash,
    role: 'admin',
    mustChangeCredentials: 0,
    telegramUserId: null,
    createdAt: new Date().toISOString()
  };
  db.prepare(`INSERT INTO users (id, name, email, password, role, mustChangeCredentials, telegramUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, user.name, user.email, user.password, user.role, user.mustChangeCredentials, user.telegramUserId, user.createdAt);
  return user;
}

export function addUser(name: string, email?: string, password?: string, _role?: string) {
  const safeName = sanitizeName(name);
  const safeEmail = email?.trim().toLowerCase() || '';
  if (!safeName) return null;

  const existingByName = db.prepare('SELECT 1 FROM users WHERE LOWER(name) = LOWER(?)').get(safeName);
  const existingByEmail = safeEmail
    ? db.prepare('SELECT 1 FROM users WHERE LOWER(email) = ?').get(safeEmail)
    : null;
  if (existingByName || existingByEmail) return null;

  const user = {
    id: `u_${crypto.randomUUID().slice(0, 8)}`,
    name: safeName,
    email: safeEmail,
    password: password || '',
    role: _role || 'user',
    mustChangeCredentials: 0,
    telegramUserId: null,
    createdAt: new Date().toISOString()
  };
  
  db.prepare(`INSERT INTO users (id, name, email, password, role, mustChangeCredentials, telegramUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(user.id, user.name, user.email, user.password, user.role, user.mustChangeCredentials, user.telegramUserId, user.createdAt);
  
  return user;
}

export function updateUserPassword(userId: string, newHash: string) {
  db.prepare('UPDATE users SET password = ?, mustChangeCredentials = 0 WHERE id = ?').run(newHash, userId);
  return true;
}

export function updateUserCredentials(userId: string, newName: string, newHash: string) {
  const safeName = sanitizeName(newName);
  if (!safeName) return false;
  db.prepare('UPDATE users SET name = ?, password = ?, mustChangeCredentials = 0 WHERE id = ?').run(safeName, newHash, userId);
  return true;
}

export function deleteUser(userId: string) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
  if (!user) return { success: false, error: 'Usuario no encontrado' };
  if (user.role === 'admin') return { success: false, error: 'No se pueden eliminar cuentas de administrador' };

  db.transaction(() => {
    db.prepare(`UPDATE licenses SET status='available', assignedTo=NULL, assignedAt=NULL, claimed=0, claimedAt=NULL WHERE assignedTo=?`).run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  })();
  return { success: true };
}

export function clearMustChangeCredentials(userId: string) {
  db.prepare('UPDATE users SET mustChangeCredentials = 0 WHERE id = ?').run(userId);
}

export function getInventoryStats() {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get() as any;
  const reqTotal = db.prepare('SELECT COUNT(*) as c FROM requests').get() as any;
  const reqPending = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status='pending'`).get() as any;
  const reqResolved = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status='resolved'`).get() as any;
  const reqRejected = db.prepare(`SELECT COUNT(*) as c FROM requests WHERE status='rejected'`).get() as any;
  
  const licTotal = db.prepare('SELECT COUNT(*) as c FROM licenses').get() as any;
  const licAvail = db.prepare(`SELECT COUNT(*) as c FROM licenses WHERE status='available'`).get() as any;
  const licAssigned = db.prepare(`SELECT COUNT(*) as c FROM licenses WHERE status='assigned'`).get() as any;
  const licFailed = db.prepare(`SELECT COUNT(*) as c FROM licenses WHERE reportedFailed=1`).get() as any;

  const lowStock = db.prepare(`SELECT product, COUNT(*) as count FROM licenses WHERE status='available' GROUP BY product HAVING count < 5`).all();

  return {
    total: licTotal.c,
    available: licAvail.c,
    assigned: licAssigned.c,
    failed: licFailed.c,
    users: users.c,
    requests: {
      total: reqTotal.c,
      pending: reqPending.c,
      resolved: reqResolved.c,
      rejected: reqRejected.c
    },
    lowStock
  };
}

export function addLicense(product: string, key: string) {
  const newLicense = {
    id: `l_${crypto.randomUUID().slice(0, 8)}`,
    product,
    key,
    status: 'available',
    assignedTo: null
  };
  db.prepare(`INSERT INTO licenses (id, product, key, status) VALUES (?, ?, ?, ?)`).run(newLicense.id, product, key, 'available');
  return newLicense;
}

export function addLicensesBulk(product: string, keys: string[], batchNote: string = '') {
  const timestamp = new Date().toISOString();
  let added = 0;
  let dupes = 0;

  const insert = db.prepare(`INSERT INTO licenses (id, product, key, status, batchNote, createdAt) VALUES (?, ?, ?, 'available', ?, ?)`);
  const existCheck = db.prepare(`SELECT 1 FROM licenses WHERE UPPER(REPLACE(key, ' ', '')) = ?`);

  db.transaction(() => {
    for (const key of keys) {
      const normKey = key.replace(/\s+/g, '').toUpperCase();
      if (existCheck.get(normKey)) {
        dupes++;
        continue;
      }
      insert.run(`l_${crypto.randomUUID().slice(0, 8)}`, product, key, batchNote, timestamp);
      added++;
    }
  })();
  return { added, dupes };
}

export function assignLicense(licenseId: string, userId: string) {
  const res = db.prepare(`UPDATE licenses SET status='assigned', assignedTo=?, assignedAt=? WHERE id=? AND status='available'`)
    .run(userId, new Date().toISOString(), licenseId);
  return res.changes > 0;
}

export function assignLicensesBatch(userId: string, product: string, count: number) {
  const available = db.prepare(`SELECT id FROM licenses WHERE product=? AND status='available' LIMIT ?`).all(product, count) as any[];
  if (available.length === 0) return { success: false, error: 'No hay suficientes licencias disponibles' };
  
  const timestamp = new Date().toISOString();
  const updateStmt = db.prepare(`UPDATE licenses SET status='assigned', assignedTo=?, assignedAt=? WHERE id=?`);
  
  db.transaction(() => {
    for (const row of available) {
      updateStmt.run(userId, timestamp, row.id);
    }
    createNotification({}, userId, `📦 <b>LICENCIAS ASIGNADAS</b>: Te han asignado <b>${available.length} licencia(s)</b> de <b>${product}</b>. ✅`);
  })();
  
  return { success: true, count: available.length };
}

export function claimOneLicense(userId: string, product: string) {
  const license = db.prepare(`SELECT * FROM licenses WHERE assignedTo=? AND product=? AND claimed=0 LIMIT 1`).get(userId, product) as any;
  if (!license) return { success: false, error: 'No tienes unidades/licencias sin reclamar de este producto' };
  
  db.prepare(`UPDATE licenses SET claimed=1, claimedAt=? WHERE id=?`).run(new Date().toISOString(), license.id);
  license.claimed = true;
  return { success: true, license: mapLicense(license) };
}

export function revealLicense(userId: string, licenseId: string) {
  const license = db.prepare(`SELECT * FROM licenses WHERE id=? AND assignedTo=? AND claimed=0`).get(licenseId, userId) as any;
  if (!license) return { success: false, error: 'Licencia no encontrada o ya revelada' };
  
  db.prepare(`UPDATE licenses SET claimed=1, claimedAt=? WHERE id=?`).run(new Date().toISOString(), licenseId);
  
  const user = db.prepare('SELECT name FROM users WHERE id=?').get(userId) as any;
  const userName = user ? user.name : 'Un usuario';
  createNotification({}, 'admin', `🔑 <b>LLAVE REVELADA</b>: ${userName} ha revelado una llave de <b>${license.product}</b>. ✨`);
  
  return { success: true, license: mapLicense({ ...license, claimed: true }) };
}

export function reportFailedLicense(userId: string, licenseId: string) {
  const license = db.prepare(`SELECT * FROM licenses WHERE id=? AND assignedTo=?`).get(licenseId, userId) as any;
  if (!license || license.reportedFailed) return { success: false, error: 'Licencia no encontrada o ya reportada' };
  
  db.prepare(`UPDATE licenses SET reportedFailed=1, reportedAt=? WHERE id=?`).run(new Date().toISOString(), licenseId);
  
  const user = db.prepare('SELECT name FROM users WHERE id=?').get(userId) as any;
  const userName = user ? user.name : 'Un usuario';
  createNotification({}, 'admin', `🚨 <b>REPORTE DE FALLO</b>: ${userName} indicó que la llave de <b>${license.product}</b> (<code>${license.key}</code>) no funciona. 🛠️`);
  
  return { success: true };
}

export function getRequests() {
  return db.prepare('SELECT * FROM requests').all();
}

export function createRequest(userId: string, product: string, count: number = 1) {
  const req = {
    id: `req_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    product,
    count,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  const user = db.prepare('SELECT name FROM users WHERE id=?').get(userId) as any;
  const userName = user ? user.name : 'Un usuario';
  
  db.prepare(`INSERT INTO requests (id, userId, userName, product, count, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(req.id, req.userId, userName, req.product, req.count, req.status, req.createdAt);
    
  createNotification({}, 'admin', `🆕 <b>NUEVA SOLICITUD</b>: ${userName} pide <b>${count}x ${product}</b>. ⚡`);
  return { success: true, request: req };
}

export function resolveRequest(reqId: string) {
  const res = db.prepare(`UPDATE requests SET status='resolved', resolvedAt=? WHERE id=?`).run(new Date().toISOString(), reqId);
  return res.changes > 0 ? { success: true } : { success: false, error: 'Solicitud no encontrada' };
}

export function rejectRequest(reqId: string) {
  const req = db.prepare(`SELECT * FROM requests WHERE id=?`).get(reqId) as any;
  if (!req) return { success: false, error: 'Solicitud no encontrada' };
  
  db.prepare(`UPDATE requests SET status='rejected', rejectedAt=? WHERE id=?`).run(new Date().toISOString(), reqId);
  createNotification({}, req.userId, `❌ <b>SOLICITUD RECHAZADA</b>: Tu pedido de <b>${req.count}x ${req.product}</b> no ha podido ser procesado. Contacta a soporte para más detalles. 🛠️`);
  return { success: true };
}

export function createNotification(_db: any, userId: string, message: string) {
  const id = `notif_${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(`INSERT INTO notifications (id, userId, message, type, read, createdAt) VALUES (?, ?, ?, 'info', 0, ?)`)
    .run(id, userId, message, new Date().toISOString());

  if (userId === 'admin') {
    const s = getSettings() as any;
    if (s && s.telegramBotToken && s.telegramChatId) {
      fetch(`https://api.telegram.org/bot${s.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: s.telegramChatId, text: message, parse_mode: 'HTML' })
      }).catch(e => console.error('Telegram notification error:', e));
    }
  }
}

export function getNotifications(userId: string) {
  return db.prepare(`SELECT * FROM notifications WHERE userId=? ORDER BY createdAt DESC`).all(userId).map(mapNotif);
}

export function markNotificationsAsRead(userId: string) {
  db.prepare(`UPDATE notifications SET read=1 WHERE userId=? AND read=0`).run(userId);
  return { success: true };
}

export function getCatalog() {
  return db.prepare('SELECT * FROM catalog').all();
}

export function addCatalogItem(category: string, name: string, price: number, iconType: string | null = null, minStock: number = 5) {
  const existing = db.prepare(`SELECT 1 FROM catalog WHERE name=?`).get(name);
  if (existing) return null;
  
  const item = {
    id: `cat_${crypto.randomUUID().slice(0, 8)}`,
    category,
    name,
    price,
    iconType,
    minStock
  };
  db.prepare(`INSERT INTO catalog (id, category, name, price, iconType, minStock) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(item.id, item.category, item.name, item.price, item.iconType, item.minStock);
  return item;
}

export function updateCatalogItem(id: string, data: { category?: string, name?: string, price?: number, iconType?: string, minStock?: number }) {
  const item = db.prepare(`SELECT * FROM catalog WHERE id=?`).get(id) as any;
  if (!item) return { success: false, error: 'Producto no encontrado' };
  
  const category = data.category !== undefined ? data.category : item.category;
  const name = data.name !== undefined ? data.name : item.name;
  const price = data.price !== undefined ? data.price : item.price;
  const iconType = data.iconType !== undefined ? data.iconType : item.iconType;
  const minStock = data.minStock !== undefined ? data.minStock : item.minStock;
  
  db.prepare(`UPDATE catalog SET category=?, name=?, price=?, iconType=?, minStock=? WHERE id=?`).run(category, name, price, iconType, minStock, id);
  return { success: true, item: { ...item, category, name, price, iconType, minStock } };
}

export function deleteCatalogItem(id: string) {
  const res = db.prepare('DELETE FROM catalog WHERE id=?').run(id);
  return res.changes > 0 ? { success: true } : { success: false, error: 'Producto no encontrado' };
}

export function getDownloads() {
  return db.prepare('SELECT * FROM downloads').all() || [];
}

export function addDownload(title: string, link: string, category: string, description: string = '', featured: boolean = false) {
  const item = {
    id: `dw_${crypto.randomUUID().slice(0, 8)}`,
    title: title.trim(),
    link: link.trim(),
    category: category.trim(),
    description: description.trim() || null,
    featured,
    createdAt: new Date().toISOString()
  };
  db.prepare(`INSERT INTO downloads (id, title, link, category, description, featured, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(item.id, item.title, item.link, item.category, item.description, item.featured ? 1 : 0, item.createdAt);
  return item;
}

export function updateDownload(id: string, data: { title?: string, link?: string, category?: string, description?: string, featured?: boolean }) {
  const item = db.prepare(`SELECT * FROM downloads WHERE id=?`).get(id) as any;
  if (!item) return { success: false, error: 'Descarga no encontrada' };
  
  const title = data.title !== undefined ? data.title.trim() : item.title;
  const link = data.link !== undefined ? data.link.trim() : item.link;
  const category = data.category !== undefined ? data.category.trim() : item.category;
  const description = data.description !== undefined ? (data.description.trim() || null) : item.description;
  const featured = data.featured !== undefined ? data.featured : Boolean(item.featured);
  
  db.prepare(`UPDATE downloads SET title=?, link=?, category=?, description=?, featured=?, updatedAt=? WHERE id=?`).run(title, link, category, description, featured ? 1 : 0, new Date().toISOString(), id);
  return { success: true, download: { ...item, title, link, category, description, featured } };
}

export function deleteDownload(id: string) {
  const res = db.prepare('DELETE FROM downloads WHERE id=?').run(id);
  return res.changes > 0 ? { success: true } : { success: false, error: 'Descarga no encontrada' };
}

export function replaceFailedLicense(licenseId: string) {
  const badLic = db.prepare('SELECT * FROM licenses WHERE id = ?').get(licenseId) as any;
  if (!badLic || !badLic.reportedFailed) return { error: 'Licencia no encontrada o no reportada.' };

  let success = false;
  db.transaction(() => {
    db.prepare(`UPDATE licenses SET status='trashed' WHERE id=?`).run(licenseId);
    
    const newLic = db.prepare(`SELECT * FROM licenses WHERE product=? AND status='available' LIMIT 1`).get(badLic.product) as any;
    if (!newLic) throw new Error('No hay inventario disponible para reemplazo automático.');

    db.prepare(`UPDATE licenses SET status='assigned', assignedTo=?, assignedAt=?, claimed=0, reportedFailed=0 WHERE id=?`)
      .run(badLic.assignedTo, new Date().toISOString(), newLic.id);
      
    createNotification({}, badLic.assignedTo, `Tu licencia reportada de ${badLic.product} ha sido reemplazada automáticamente. Revisa 'Mis Llaves'.`);
    success = true;
  })();
  
  return { success };
}
  const catalogColumns = db.prepare(`PRAGMA table_info(catalog)`).all() as Array<{ name: string }>;
  if (!catalogColumns.some((column) => column.name === 'minStock')) {
    db.exec(`ALTER TABLE catalog ADD COLUMN minStock INTEGER NOT NULL DEFAULT 5`);
  }
  const downloadColumns = db.prepare(`PRAGMA table_info(downloads)`).all() as Array<{ name: string }>;
  if (!downloadColumns.some((column) => column.name === 'description')) {
    db.exec(`ALTER TABLE downloads ADD COLUMN description TEXT`);
  }
  if (!downloadColumns.some((column) => column.name === 'featured')) {
    db.exec(`ALTER TABLE downloads ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`);
  }
