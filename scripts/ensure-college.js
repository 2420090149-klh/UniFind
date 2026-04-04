const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@libsql/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const adapter = new PrismaLibSql({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking if KLH College exists in Turso Cloud...");
  
  try {
    const college = await prisma.college.upsert({
      where: { subdomain: 'klh' },
      update: {},
      create: {
        name: 'KL University Hyderabad',
        subdomain: 'klh',
      },
    });
    
    console.log("✅ SUCCESS: College 'klh' is now in your Cloud Database!");
    console.log(college);
  } catch (error) {
    console.error("❌ ERROR: Could not connect to Turso Cloud.");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
