import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const { id } = params;
        const item = db.prepare('SELECT * FROM Item WHERE id = ?').get(id) as any;

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.collegeId !== user.collegeId) {
            return NextResponse.json({ error: 'College mismatch' }, { status: 403 });
        }

        if (item.status !== 'CLAIMED') {
            return NextResponse.json({ error: 'Item must be claimed first' }, { status: 400 });
        }

        const now = new Date().toISOString();
        db.prepare('UPDATE Item SET status = ?, updatedAt = ? WHERE id = ?').run(
            'HANDED_OVER', now, id
        );

        return NextResponse.json({ message: 'Item marked as handed over' });
    } catch (error) {
        console.error('Verify item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
