import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
        }

        const item = await prisma.item.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.collegeId !== user.collegeId) {
            return NextResponse.json({ error: 'College mismatch' }, { status: 403 });
        }

        if (item.status !== 'CLAIMED') {
            return NextResponse.json({ error: 'Item must be claimed first before verification' }, { status: 400 });
        }

        await prisma.item.update({
            where: { id },
            data: { 
                status: 'HANDED_OVER'
            }
        });

        return NextResponse.json({ message: 'Item marked as handed over successfully' });
    } catch (error) {
        console.error('Verify item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
