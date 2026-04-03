import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const user = await getUserFromRequest();
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get all admins for the college
        const admins = db.prepare('SELECT id, email, name, role, permissions FROM User WHERE role = ? AND collegeId = ?').all('ADMIN', user.collegeId);
        return NextResponse.json({ admins });
    } catch (e) {
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

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdminId = crypto.randomUUID();

        db.prepare('INSERT INTO User (id, email, password, name, role, permissions, collegeId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(newAdminId, email, hashedPassword, name, 'ADMIN', permissions || '', user.collegeId, new Date().toISOString());

        return NextResponse.json({ success: true });
    } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
}
