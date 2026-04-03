import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || user.role === 'STUDENT') {
            return NextResponse.json({ error: 'Only admins can return items' }, { status: 403 });
        }

        const item = await prisma.item.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        await prisma.item.update({
            where: { id: item.id },
            data: { 
                status: 'RETURNED'
            }
        });

        return NextResponse.json({ message: 'Item marked as returned successfully' });
    } catch (error) {
        console.error('Return item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
