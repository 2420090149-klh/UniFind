const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Get credentials from environment
const url = "https://dheeran-dheeran.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUyMjI3ODUsImlkIjoiMDE5ZDUzODUtZDQwMS03ZWZjLTgwY2YtZDdhY2M5ODM5YmMxIiwicmlkIjoiNThhNmY3NzYtMzZhZC00NTQ4LTk4MDMtY2I5MDNjMjEyZmJmIn0.5KbVdUGf-olXoFqCJvZMy82IDzpGAQQ6INbgBO45ZngtcpCBHd0qKviFBPbuI1rJyO_rXYRHNtos4eAXcsruAg";

const client = createClient({
  url: url,
  authToken: authToken,
});

async function main() {
    console.log('🌱 Starting Cloud Seed with Raw SQL...');
    
    const password = await bcrypt.hash('admin123', 10);
    const superPassword = await bcrypt.hash('Dheeran@15019d', 10);

    // Create Tables if they don't exist
    console.log('🔍 Creating tables in Turso...');
    
    await client.execute(`
        CREATE TABLE IF NOT EXISTS College (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            subdomain TEXT UNIQUE NOT NULL
        )
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS User (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            permissions TEXT,
            collegeId TEXT NOT NULL,
            resetToken TEXT,
            resetTokenExpiry DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collegeId) REFERENCES College(id)
        )
    `);

    await client.execute(`
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
            updatedAt DATETIME,
            FOREIGN KEY (finderId) REFERENCES User(id),
            FOREIGN KEY (ownerId) REFERENCES User(id),
            FOREIGN KEY (collegeId) REFERENCES College(id)
        )
    `);

    console.log('📦 Inserting initial data...');

    // Insert College
    await client.execute({
        sql: "INSERT INTO College (id, name, subdomain) VALUES (?, ?, ?) ON CONFLICT(subdomain) DO UPDATE SET name=excluded.name",
        args: ['college-1', 'KL University', 'klhb']
    });

    // Insert Admin
    await client.execute({
        sql: "INSERT INTO User (id, email, password, name, role, collegeId) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET password=excluded.password, role=excluded.role",
        args: [crypto.randomUUID(), 'admin@klhb.com', password, 'Floor Admin', 'ADMIN', 'college-1']
    });

    // Insert Super Admin
    await client.execute({
        sql: "INSERT INTO User (id, email, password, name, role, permissions, collegeId) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET password=excluded.password, role=excluded.role, permissions=excluded.permissions",
        args: [crypto.randomUUID(), '2420090149@klh.edu.in', superPassword, 'Main Super Admin', 'SUPER_ADMIN', 'MANAGE_ADMINS,VIEW_ALL_DATA', 'college-1']
    });

    console.log('✅ Turso Database initialized and seeded successfully!');
}

main().catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
});
