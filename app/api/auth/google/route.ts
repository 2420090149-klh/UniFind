import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'UNCONFIGURED_CLIENT_ID');
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function POST(req: Request) {
    try {
        const { token: googleToken, subdomain } = await req.json();

        if (!googleToken || !subdomain) {
            return NextResponse.json({ error: 'Missing token or subdomain' }, { status: 400 });
        }

        // Verify Google token
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID || 'UNCONFIGURED_CLIENT_ID',  
            });
        } catch (error) {
            // Temporary workaround if GOOGLE_CLIENT_ID is not configured locally, to parse the token directly for testing
            if ((process.env.GOOGLE_CLIENT_ID || 'UNCONFIGURED_CLIENT_ID') === 'UNCONFIGURED_CLIENT_ID') {
                 const decoded = jwt.decode(googleToken) as { email: string, name: string };
                 if (!decoded || !decoded.email) throw new Error("Invalid token format");
                 ticket = { getPayload: () => decoded };
            } else {
                 console.error('Google token verification failed:', error);
                 return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
            }
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }

        const { email, name } = payload;

        // Check if college exists
        const college = db.prepare('SELECT * FROM College WHERE subdomain = ?').get(subdomain) as any;
        if (!college) {
            return NextResponse.json({ error: 'Invalid college domain' }, { status: 404 });
        }

        // Check for existing user
        let user = db.prepare('SELECT * FROM User WHERE email = ? AND collegeId = ?').get(email, college.id) as any;
        
        if (!user) {
            // Create user for google sign up
            const userId = crypto.randomUUID();
            // Google users don't have passwords, but we provide a random placeholder
            const randomPassword = crypto.randomUUID(); 
            
            db.prepare('INSERT INTO User (id, email, password, name, role, collegeId) VALUES (?, ?, ?, ?, ?, ?)').run(
                userId, email, randomPassword, name || 'Google User', 'STUDENT', college.id
            );
            
            user = db.prepare('SELECT * FROM User WHERE id = ?').get(userId);
        }

        // Generate our JWT
        const token = jwt.sign({ userId: user.id, role: user.role, collegeId: user.collegeId }, SECRET_KEY, { expiresIn: '1d' });

        return NextResponse.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (error) {
        console.error('Google Auth error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
