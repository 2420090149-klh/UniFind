import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params;
        const item = db.prepare('SELECT * FROM Item WHERE id = ?').get(id) as any;
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        let finder = null;
        if (item.finderId) finder = db.prepare('SELECT id, name, email FROM User WHERE id = ?').get(item.finderId) as any;

        let owner = null;
        if (item.ownerId) owner = db.prepare('SELECT id, name, email FROM User WHERE id = ?').get(item.ownerId) as any;

        return NextResponse.json({ item, finder, owner });
    } catch (error) {
        console.error('Get item detail error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Admin/SuperAdmin: change item status manually (e.g. mark as CLAIMED for walk-in, or revert)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const { status } = await req.json();

        const allowed = ['REPORTED', 'CLAIMED', 'HANDED_OVER', 'RECEIVED'];
        if (!allowed.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const now = new Date().toISOString();
        db.prepare('UPDATE Item SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Patch item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Admin/SuperAdmin: delete an item
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const item = db.prepare('SELECT id FROM Item WHERE id = ?').get(id) as any;
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        db.prepare('DELETE FROM Item WHERE id = ?').run(id);
        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
