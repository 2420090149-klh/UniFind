import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;

        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                finder: {
                    select: { id: true, name: true, email: true }
                },
                owner: {
                    select: { id: true, name: true, email: true }
                },
                college: {
                    select: { id: true, name: true, subdomain: true }
                }
            }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            item, 
            finder: item.finder, 
            owner: item.owner 
        });
    } catch (error) {
        console.error('Get item detail error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { status } = await req.json();

        const allowed = ['REPORTED', 'CLAIMED', 'HANDED_OVER', 'RECEIVED', 'APPROVED', 'RETURNED'];
        if (!allowed.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await prisma.item.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Patch item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const item = await prisma.item.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        await prisma.item.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Delete item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
