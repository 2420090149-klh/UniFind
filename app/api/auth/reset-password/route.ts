import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        // Find user with this valid token that has not expired
        const user = db.prepare('SELECT * FROM User WHERE resetToken = ? AND resetTokenExpiry > ?').get(token, new Date().toISOString()) as any;
        
        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user and clear the token fields
        db.prepare('UPDATE User SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?').run(hashedPassword, user.id);

        return NextResponse.json({ message: 'Password has been reset successfully' }, { status: 200 });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
