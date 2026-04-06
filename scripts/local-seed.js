const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting LOCAL Seed...');
    
    const password = await bcrypt.hash('admin123', 10);
    const superPassword = await bcrypt.hash('Dheeran@15019d', 10);

    // 1. Create College
    const college = await prisma.college.upsert({
        where: { subdomain: 'klh' },
        update: {},
        create: {
            id: 'college-1',
            name: 'KL University Hyderabad',
            subdomain: 'klh',
        },
    });
    console.log('✅ College created:', college.name);

    // 2. Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: '2420090149@klh.edu.in' },
        update: {},
        create: {
            email: '2420090149@klh.edu.in',
            password: superPassword,
            name: 'Main Super Admin',
            role: 'SUPER_ADMIN',
            permissions: 'MANAGE_ADMINS,VIEW_ALL_DATA',
            collegeId: college.id
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);

    console.log('🚀 LOCAL Database initialized and seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
