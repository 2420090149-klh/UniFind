import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
// Fallback UUID if package not installed (though I should install it or use crypto.randomUUID)
// We will use crypto.randomUUID() which is available in Node 19+ and Next.js edge/node runtime usually.

export async function POST(req: Request) {
    try {
        const { email, password, name, subdomain } = await req.json();

        if (!email || !password || !name || !subdomain) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const college = db.prepare('SELECT * FROM College WHERE subdomain = ?').get(subdomain) as any;
        if (!college) {
            return NextResponse.json({ error: 'Invalid college domain' }, { status: 404 });
        }

        const existingUser = db.prepare('SELECT * FROM User WHERE email = ? AND collegeId = ?').get(email, college.id);
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        db.prepare('INSERT INTO User (id, email, password, name, role, collegeId) VALUES (?, ?, ?, ?, ?, ?)').run(
            userId, email, hashedPassword, name, 'STUDENT', college.id
        );

        return NextResponse.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
