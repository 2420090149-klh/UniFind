import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, password, name, subdomain } = await req.json();

        if (!email || !password || !name || !subdomain) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const college = await prisma.college.findUnique({
            where: { subdomain }
        });
        if (!college) {
            return NextResponse.json({ error: 'Invalid college domain' }, { status: 404 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { email, collegeId: college.id }
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        await prisma.user.create({
            data: {
                id: userId,
                email,
                password: hashedPassword,
                name,
                role: 'STUDENT',
                collegeId: college.id
            }
        });

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
