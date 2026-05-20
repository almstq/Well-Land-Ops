/**
 * JSON-file data store — drop-in replacement for the PostgreSQL pool.
 * Used when STORAGE_MODE=json (or when PostgreSQL is not configured).
 *
 * app_data  → wl-local-app/data/db.json
 * app_users → wl-local-app/data/users.json
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH   = path.join(DATA_DIR, 'db.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

fs.mkdirSync(DATA_DIR,   { recursive: true });
fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────
function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function readDb() {
  return readJson(DB_PATH, {});
}

function writeDb(db) {
  // Auto-backup before write
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = path.join(BACKUP_DIR, `db-${stamp}-autosave.json`);
  if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, bak);
  writeJson(DB_PATH, db);
}

function readUsers() {
  return readJson(USERS_PATH, []);
}

function writeUsers(users) {
  writeJson(USERS_PATH, users);
}

// ── App data operations ────────────────────────────────────────────────────
const store = {
  // Get all tables as { table_name, data } rows
  getAllTables() {
    const db = readDb();
    return Object.entries(db)
      .filter(([k]) => k !== 'meta')
      .map(([k, v]) => ({ table_name: k, data: Array.isArray(v) ? v : [] }));
  },

  // Get single table data
  getTable(tableName) {
    const db = readDb();
    return db[tableName] ?? [];
  },

  // Upsert a single table
  setTable(tableName, data) {
    const db = readDb();
    db[tableName] = data;
    writeDb(db);
  },

  // Bulk write (full db object)
  setAll(incoming) {
    const db = readDb();
    for (const [key, value] of Object.entries(incoming)) {
      if (key === 'meta') continue;
      if (Array.isArray(value)) db[key] = value;
    }
    writeDb(db);
  },

  // Full snapshot for backup/export
  snapshot() {
    return readDb();
  },

  manualBackup() {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(BACKUP_DIR, `backup-${stamp}.json`);
    fs.copyFileSync(DB_PATH, file);
    return path.basename(file);
  },

  // ── User operations ──────────────────────────────────────────────────────
  findUserByUsername(username) {
    return readUsers().find(u => u.username === username.trim().toLowerCase() && u.is_active !== false) || null;
  },

  findUserById(id) {
    return readUsers().find(u => u.id === id) || null;
  },

  createUser(user) {
    const users = readUsers();
    const newUser = { id: Date.now(), created_at: new Date().toISOString(), ...user };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },

  updateUserLastLogin(id) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx].last_login = new Date().toISOString();
      writeUsers(users);
    }
  },

  updateUserPassword(id, hash) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx].password_hash = hash;
      writeUsers(users);
      return true;
    }
    return false;
  },

  userCount() {
    return readUsers().length;
  },
};

module.exports = store;
