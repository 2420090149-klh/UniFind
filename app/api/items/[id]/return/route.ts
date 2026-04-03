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

        if (item.ownerId !== user.userId) {
            return NextResponse.json({ error: 'Not the owner' }, { status: 403 });
        }

        if (item.status !== 'HANDED_OVER') {
            return NextResponse.json({ error: 'Item must be handed over first' }, { status: 400 });
        }

        const now = new Date().toISOString();
        // Option to delete or archive. Prompt says "remove the item".
        // We can just update status to RECEIVED and filter out in GET /items
        db.prepare('UPDATE Item SET status = ?, updatedAt = ? WHERE id = ?').run(
            'RECEIVED', now, id
        );

        return NextResponse.json({ message: 'Item receipt confirmed' });
    } catch (error) {
        console.error('Return item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
