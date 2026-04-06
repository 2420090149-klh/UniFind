require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Prisma v7 requires adapter even for local SQLite
const dbUrl = process.env.DATABASE_URL || 'file:./unifind.db';
const filePath = path.resolve(dbUrl.replace('file:', '').replace('./', ''));

console.log('Using database file:', filePath);
const database = new Database(filePath);
const adapter = new PrismaBetterSqlite3(database);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding local SQLite database...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const superPassword = await bcrypt.hash('Dheeran@15019d', 10);

    const college = await prisma.college.upsert({
        where: { subdomain: 'klhb' },
        update: { name: 'KL University' },
        create: {
            id: 'college-1',
            name: 'KL University',
            subdomain: 'klhb',
        },
    });
    console.log('College:', college.name);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@klhb.com' },
        update: { password: adminPassword, role: 'ADMIN' },
        create: {
            email: 'admin@klhb.com',
            password: adminPassword,
            name: 'Floor Admin',
            role: 'ADMIN',
            collegeId: college.id,
        },
    });
    console.log('Admin:', admin.email);

    const superAdmin = await prisma.user.upsert({
        where: { email: '2420090149@klh.edu.in' },
        update: { password: superPassword, role: 'SUPER_ADMIN', permissions: 'MANAGE_ADMINS,VIEW_ALL_DATA' },
        create: {
            email: '2420090149@klh.edu.in',
            password: superPassword,
            name: 'Main Super Admin',
            role: 'SUPER_ADMIN',
            permissions: 'MANAGE_ADMINS,VIEW_ALL_DATA',
            collegeId: college.id,
        },
    });
    console.log('Super Admin:', superAdmin.email);
    console.log('Done seeding!');
}

main()
    .catch((e) => {
        console.error('SEED FAILED:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
