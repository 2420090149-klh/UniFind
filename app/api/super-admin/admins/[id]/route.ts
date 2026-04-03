import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const admin = await prisma.user.findFirst({
            where: {
                id,
                role: 'ADMIN',
                collegeId: user.collegeId
            }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found or access denied' }, { status: 404 });
        }

        await prisma.user.delete({
            where: { id: admin.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete admin error:', error);
        return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
        const user = await getUserFromRequest();
        
        if (!user || user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { permissions } = await req.json();

        const admin = await prisma.user.findFirst({
            where: {
                id,
                role: 'ADMIN',
                collegeId: user.collegeId
            }
        });

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found or access denied' }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: admin.id },
            data: { 
                permissions: permissions || '' 
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update admin error:', error);
        return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 });
    }
}
