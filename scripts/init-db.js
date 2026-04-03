const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'unifind.db');
const db = new Database(dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS College (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    permissions TEXT,
    collegeId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(collegeId) REFERENCES College(id)
);

CREATE TABLE IF NOT EXISTS Item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    dateLost DATETIME NOT NULL,
    locationFloor TEXT,
    locationRoom TEXT,
    imageUrl TEXT,
    status TEXT DEFAULT 'REPORTED',
    finderId TEXT,
    ownerId TEXT,
    collegeId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(finderId) REFERENCES User(id),
    FOREIGN KEY(ownerId) REFERENCES User(id),
    FOREIGN KEY(collegeId) REFERENCES College(id)
);
`;

try {
    db.exec(schema);
    console.log('Database initialized successfully');
} catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
}
