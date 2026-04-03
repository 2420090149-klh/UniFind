import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function POST(req: Request) {
    try {
        const { email, password, subdomain } = await req.json();

        if (!email || !password || !subdomain) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const college = await prisma.college.findUnique({
            where: { subdomain }
        });
        if (!college) {
            return NextResponse.json({ error: 'Invalid college domain' }, { status: 404 });
        }

        const user = await prisma.user.findFirst({
            where: { email, collegeId: college.id }
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, collegeId: user.collegeId }, SECRET_KEY, { expiresIn: '1d' });

        return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
