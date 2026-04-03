const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
console.log('Trying to open DB at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('File does not exist!');
    process.exit(1);
}

try {
    const db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    const users = db.prepare('SELECT count(*) as count FROM User').get();
    console.log('Success! User count:', users.count);
    db.close();
} catch (e) {
    console.error('Failed to open JS DB:', e);
}
