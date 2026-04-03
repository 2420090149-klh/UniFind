const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        console.log('Admin found:', !!admin);
    } catch (e) {
        console.error('Check failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
