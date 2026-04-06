import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to `global` in development to prevent
// exhausting the database connection limit.
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./unifind.db';

  // Production: Turso / LibSQL (libsql:// or https://)
  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@libsql/client');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require('@prisma/adapter-libsql');

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL || dbUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  }

  // Local development: better-sqlite3
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

  // Strip file: prefix for better-sqlite3
  const filePath = dbUrl.replace('file:./', '').replace('file:', '');
  const database = new Database(filePath);
  const adapter = new PrismaBetterSqlite3(database);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
