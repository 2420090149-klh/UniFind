const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(process.cwd(), 'unifind.db');
const db = new Database(dbPath);

async function main() {
    const password = await bcrypt.hash('admin123', 10);
    const superPassword = await bcrypt.hash('Dheeran@15019d', 10);

    // Create College
    db.prepare(`
        INSERT INTO College (id, name, subdomain)
        VALUES (?, ?, ?)
        ON CONFLICT(subdomain) DO UPDATE SET name=excluded.name
    `).run('college-1', 'KL University', 'klhb');

    const college = db.prepare('SELECT id FROM College WHERE subdomain = ?').get('klhb');

    // Create Admin
    const adminEmail = 'admin@klhb.com';
    db.prepare(`
        INSERT INTO User (id, email, password, name, role, collegeId)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET 
            password=excluded.password, role=excluded.role
    `).run(crypto.randomUUID(), adminEmail, password, 'Floor Admin', 'ADMIN', college.id);

    // Create Super Admin
    const superEmail = '2420090149@klh.edu.in';
    db.prepare(`
        INSERT INTO User (id, email, password, name, role, permissions, collegeId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET 
            password=excluded.password, role=excluded.role, permissions=excluded.permissions
    `).run(crypto.randomUUID(), superEmail, superPassword, 'Main Super Admin', 'SUPER_ADMIN', 'MANAGE_ADMINS,VIEW_ALL_DATA', college.id);

    console.log('Database seeded successfully');
}

main().catch(console.error);
