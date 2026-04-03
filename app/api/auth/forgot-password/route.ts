import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists
        const user = db.prepare('SELECT * FROM User WHERE email = ?').get(email) as any;
        if (!user) {
            // We usually return 200 even if user doesn't exist to prevent email enumeration
            return NextResponse.json({ message: 'If an account exists with that email, a reset link has been generated.' }, { status: 200 });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

        db.prepare('UPDATE User SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?').run(resetToken, resetTokenExpiry, user.id);

        const college = db.prepare('SELECT * FROM College WHERE id = ?').get(user.collegeId) as any;
        const subdomain = college ? college.subdomain : 'app';

        // For this local demonstration, we will log the reset link to the terminal
        // In a real staging/prod setup, we would send this via email using Resend, SendGrid, etc.
        const resetLink = `http://localhost:3000/${subdomain}/reset-password?token=${resetToken}`;
        
        console.log('\n\n======================================================');
        console.log('❗️ PASSWORD RESET REQUESTED ❗️');
        console.log(`Email: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('======================================================\n\n');

        return NextResponse.json({ message: 'If an account exists with that email, a reset link has been generated. Check the terminal output.' }, { status: 200 });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
