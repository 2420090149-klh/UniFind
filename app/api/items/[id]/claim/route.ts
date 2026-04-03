import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const item = db.prepare('SELECT * FROM Item WHERE id = ?').get(id) as any;

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.status !== 'REPORTED') {
            return NextResponse.json({ error: 'Item already claimed or processed' }, { status: 400 });
        }

        // Verify college match
        if (item.collegeId !== user.collegeId) {
            return NextResponse.json({ error: 'College mismatch' }, { status: 403 });
        }

        const now = new Date().toISOString();
        db.prepare('UPDATE Item SET status = ?, ownerId = ?, updatedAt = ? WHERE id = ?').run(
            'CLAIMED', user.userId, now, id
        );

        return NextResponse.json({ message: 'Item claimed successfully' });
    } catch (error) {
        console.error('Claim item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
