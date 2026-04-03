import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
    try {
        const user = await getUserFromRequest();
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const admins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
                collegeId: user.collegeId
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                permissions: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ admins });
    } catch (error) {
        console.error('Get admins error:', error);
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest();
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { email, password, name, permissions } = await req.json();
        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const existingAdmin = await prisma.user.findUnique({
            where: { email }
        });

        if (existingAdmin) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdminId = crypto.randomUUID();

        await prisma.user.create({
            data: {
                id: newAdminId,
                email,
                password: hashedPassword,
                name,
                role: 'ADMIN',
                permissions: permissions || '',
                collegeId: user.collegeId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Create admin error:', error);
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
}
