import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function POST(req: Request) {
    try {
        const { email, password, subdomain } = await req.json();

        if (!email || !password || !subdomain) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const college = db.prepare('SELECT * FROM College WHERE subdomain = ?').get(subdomain) as any;
        if (!college) {
            return NextResponse.json({ error: 'Invalid college domain' }, { status: 404 });
        }

        const user = db.prepare('SELECT * FROM User WHERE email = ? AND collegeId = ?').get(email, college.id) as any;
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
