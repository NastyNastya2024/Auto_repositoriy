import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { initialState } from './seed.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const dbPath = process.env.DB_PATH || path.join(dataDir, 'autoschool.db');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const selectState = db.prepare('SELECT data FROM app_state WHERE id = 1');
const upsertState = db.prepare(`
  INSERT INTO app_state (id, data, updated_at)
  VALUES (1, @data, @updated_at)
  ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);

function loadState() {
  const row = selectState.get();
  if (!row) {
    const seeded = { ...initialState };
    saveState(seeded);
    return seeded;
  }
  return JSON.parse(row.data);
}

function saveState(state) {
  upsertState.run({
    data: JSON.stringify(state),
    updated_at: new Date().toISOString(),
  });
}

export { db, loadState, saveState, dbPath };
