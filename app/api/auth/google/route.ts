import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'UNCONFIGURED_CLIENT_ID';
const authClient = new OAuth2Client(googleClientId);
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function POST(req: Request) {
    try {
        const { token: googleToken, subdomain } = await req.json();

        if (!googleToken || !subdomain) {
            return NextResponse.json({ error: 'Missing token or subdomain' }, { status: 400 });
        }

        // Verify Google token
        let payload;
        try {
            const ticket = await authClient.verifyIdToken({
                idToken: googleToken,
                audience: googleClientId,  
            });
            payload = ticket.getPayload();
        } catch (error) {
            // Fallback for development if client ID is missing
            if (googleClientId === 'UNCONFIGURED_CLIENT_ID') {
                 const decoded = jwt.decode(googleToken) as any;
                 if (!decoded || !decoded.email) throw new Error("Invalid token format");
                 payload = decoded;
            } else {
                 console.error('Google token verification failed:', error);
                 return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
            }
        }

        if (!payload || !payload.email) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }

        const { email, name } = payload;

        // Check if college exists
        const college = await prisma.college.findUnique({
            where: { subdomain }
        });

        if (!college) {
            return NextResponse.json({ error: 'Invalid college' }, { status: 404 });
        }

        // Check for existing user or create new one
        let user = await prisma.user.findFirst({
            where: { 
                email,
                collegeId: college.id 
            }
        });
        
        if (!user) {
            const userId = crypto.randomUUID();
            const randomPassword = crypto.randomBytes(16).toString('hex'); 
            
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email,
                    password: randomPassword,
                    name: name || 'Google User',
                    role: 'STUDENT',
                    collegeId: college.id
                }
            });
        }

        // Generate our JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role, collegeId: user.collegeId }, 
            SECRET_KEY, 
            { expiresIn: '1d' }
        );

        return NextResponse.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });

    } catch (error) {
        console.error('Google Auth error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
