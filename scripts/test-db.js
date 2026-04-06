require('dotenv').config();
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbUrl = process.env.DATABASE_URL || 'file:./unifind.db';
const filePath = path.resolve(dbUrl.replace('file:./', '').replace('file:', ''));
console.log('filePath:', filePath);

async function test() {
  let database, prisma;
  try {
    database = new Database(filePath);
    const adapter = new PrismaBetterSqlite3(database);
    prisma = new PrismaClient({ adapter });

    const col = await prisma.college.findFirst();
    console.log('DB query OK, first college:', JSON.stringify(col));
    
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log('Users:', JSON.stringify(users));
  } catch(e) {
    console.error('Query error:', e.message);
    console.error(e.stack);
  } finally {
    if (prisma) await prisma.$disconnect();
  }
}
test();
