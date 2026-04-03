import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET() {
    try {
        const colleges = await prisma.college.findMany();
        return NextResponse.json({ colleges });
    } catch (error) {
        console.error('Get colleges error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
