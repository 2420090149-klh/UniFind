import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        db.prepare('DELETE FROM User WHERE id = ? AND role = ? AND collegeId = ?').run(params.id, 'ADMIN', user.collegeId);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const user = await getUserFromRequest();
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { permissions } = await req.json();

        db.prepare('UPDATE User SET permissions = ? WHERE id = ? AND role = ? AND collegeId = ?').run(
            permissions, params.id, 'ADMIN', user.collegeId
        );

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
    }
}
