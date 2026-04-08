process.env.DATABASE_URL = 'file:./unifind.db';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const dbUrl = process.env.DATABASE_URL || 'file:./unifind.db';
const filePath = path.resolve(dbUrl.replace('file:', '').replace('./', ''));

const database = new Database(filePath);

async function main() {
    console.log('Seeding local SQLite database...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const superPassword = await bcrypt.hash('Dheeran@15019d', 10);
    
    const now = new Date().toISOString();

    // Upsert College
    database.prepare(`
        INSERT INTO College (id, name, subdomain) 
        VALUES ('college-1', 'KL University', 'klhb')
        ON CONFLICT(subdomain) DO UPDATE SET name = 'KL University'
    `).run();
    console.log('College: KL University');

    // Upsert Admin
    database.prepare(`
        INSERT INTO User (id, email, password, name, role, permissions, collegeId, createdAt) 
        VALUES ('admin-1', 'admin@klhb.com', ?, 'Floor Admin', 'ADMIN', NULL, 'college-1', ?)
        ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = excluded.role
    `).run(adminPassword, now);
    console.log('Admin: admin@klhb.com');

    // Upsert Super Admin
    database.prepare(`
        INSERT INTO User (id, email, password, name, role, permissions, collegeId, createdAt) 
        VALUES ('superadmin-1', '2420090149@klh.edu.in', ?, 'Main Super Admin', 'SUPER_ADMIN', 'MANAGE_ADMINS,VIEW_ALL_DATA', 'college-1', ?)
        ON CONFLICT(email) DO UPDATE SET password = excluded.password, role = excluded.role, permissions = excluded.permissions
    `).run(superPassword, now);
    console.log('Super Admin: 2420090149@klh.edu.in');
    
    console.log('Done seeding!');
}

main()
    .catch((e) => {
        console.error('SEED FAILED:', e.stack);
        process.exit(1);
    });
