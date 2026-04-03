import path from 'path';
import fs from 'fs';
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'unifind.db');

console.log(`[DB] initializing at ${dbPath}`);
console.log(`[DB] CWD is ${process.cwd()}`);

let db: any;

// Use global object to cache the connection in development
// to avoid "database is locked" errors on hot reload
const globalWithDb = global as typeof globalThis & {
    sqliteDb?: any;
};

if (!globalWithDb.sqliteDb) {
    try {
        if (!fs.existsSync(dbPath)) {
            console.error(`[DB] ERROR: File not found at ${dbPath}`);
        }

        db = new Database(dbPath, {
            verbose: console.log
        });
        db.pragma('journal_mode = WAL');
        globalWithDb.sqliteDb = db;
    } catch (e) {
        console.error('[DB] Failed to open database:', e);
        throw e;
    }
} else {
    db = globalWithDb.sqliteDb;
}

export default db;
