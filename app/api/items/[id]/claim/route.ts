import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const item = await prisma.item.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (item.status !== 'REPORTED') {
            return NextResponse.json({ error: 'Item is not claimable in its current state' }, { status: 400 });
        }

        await prisma.item.update({
            where: { id },
            data: {
                status: 'CLAIMED',
                ownerId: user.userId
            }
        });

        return NextResponse.json({ message: 'Claim request submitted' });
    } catch (error) {
        console.error('Claim item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
