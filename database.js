const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'estetica.db');

const defaultState = {
  clients: [],
  vehicles: [],
  services: [],
  schedules: [],
  orders: [],
  payments: []
};

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const existing = await get('SELECT id FROM app_state WHERE id = 1');
  if (!existing) {
    await run(
      'INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)',
      [JSON.stringify(defaultState), new Date().toISOString()]
    );
  }
}

async function getState() {
  const row = await get('SELECT data FROM app_state WHERE id = 1');
  if (!row || !row.data) {
    return { ...defaultState };
  }

  try {
    const parsed = JSON.parse(row.data);
    return {
      ...defaultState,
      ...parsed,
      clients: Array.isArray(parsed.clients) ? parsed.clients : [],
      vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
      services: Array.isArray(parsed.services) ? parsed.services : [],
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : []
    };
  } catch (_error) {
    return { ...defaultState };
  }
}

async function saveState(state) {
  const payload = {
    ...defaultState,
    ...state,
    clients: Array.isArray(state.clients) ? state.clients : [],
    vehicles: Array.isArray(state.vehicles) ? state.vehicles : [],
    services: Array.isArray(state.services) ? state.services : [],
    schedules: Array.isArray(state.schedules) ? state.schedules : [],
    orders: Array.isArray(state.orders) ? state.orders : [],
    payments: Array.isArray(state.payments) ? state.payments : []
  };

  await run(
    'UPDATE app_state SET data = ?, updated_at = ? WHERE id = 1',
    [JSON.stringify(payload), new Date().toISOString()]
  );

  return payload;
}

module.exports = {
  initializeDatabase,
  getState,
  saveState,
  DB_PATH
};
